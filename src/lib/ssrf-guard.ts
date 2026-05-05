import "server-only";
import { promises as dns } from "node:dns";
import net from "node:net";

/**
 * Bloque les SSRF : refuse les protocoles non-http(s) et les hostnames qui
 * résolvent vers des plages privées / link-local / loopback / metadata cloud.
 * À utiliser avant tout fetch déclenché par une URL utilisateur.
 */

const PRIVATE_V4_CIDRS: [number, number][] = [
  cidr("0.0.0.0", 8),       // "this network"
  cidr("10.0.0.0", 8),      // RFC1918
  cidr("100.64.0.0", 10),   // CGNAT
  cidr("127.0.0.0", 8),     // loopback
  cidr("169.254.0.0", 16),  // link-local (AWS IMDS, GCP metadata)
  cidr("172.16.0.0", 12),   // RFC1918
  cidr("192.0.0.0", 24),
  cidr("192.168.0.0", 16),  // RFC1918
  cidr("198.18.0.0", 15),   // benchmark
  cidr("224.0.0.0", 4),     // multicast
  cidr("240.0.0.0", 4),     // reserved
];

const FORBIDDEN_HOSTNAMES = new Set([
  "metadata.google.internal",
  "metadata",
  "instance-data",
  "metadata.azure.com",
  "169.254.169.254",
  "fd00:ec2::254",
]);

function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function cidr(ip: string, bits: number): [number, number] {
  const base = ipv4ToInt(ip);
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return [base & mask, mask];
}

function isPrivateV4(ip: string): boolean {
  const intIp = ipv4ToInt(ip);
  return PRIVATE_V4_CIDRS.some(([base, mask]) => (intIp & mask) === base);
}

function isPrivateV6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;                   // loopback
  if (lower.startsWith("fe80:")) return true;          // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA
  if (lower.startsWith("ff")) return true;             // multicast
  if (lower === "::" || lower === "::ffff:0:0") return true;
  // ::ffff:a.b.c.d → IPv4-mapped, vérifier le V4 sous-jacent
  const v4mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (v4mapped) return isPrivateV4(v4mapped[1]);
  return false;
}

export type SafeFetchResult = { ok: true; response: Response } | { ok: false; error: string };

/**
 * Fetch HTTP(S) sûr : vérifie hostname et IPs avant chaque requête,
 * suit jusqu'à 5 redirections en revérifiant à chaque saut.
 */
export async function safeFetchPublic(
  rawUrl: string,
  init: RequestInit = {},
  opts: { maxRedirects?: number; timeoutMs?: number } = {},
): Promise<SafeFetchResult> {
  const maxRedirects = opts.maxRedirects ?? 5;
  const timeoutMs = opts.timeoutMs ?? 15_000;

  let currentUrl: URL;
  try {
    currentUrl = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  } catch {
    return { ok: false, error: "URL invalide" };
  }

  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (currentUrl.protocol !== "http:" && currentUrl.protocol !== "https:") {
      return { ok: false, error: `Protocole interdit : ${currentUrl.protocol}` };
    }

    const hostnameLower = currentUrl.hostname.toLowerCase();
    if (FORBIDDEN_HOSTNAMES.has(hostnameLower)) {
      return { ok: false, error: "Hôte interdit (metadata service)" };
    }

    // Résoudre l'IP et vérifier qu'elle n'est pas privée
    let resolvedIp: string;
    let family: 4 | 6;
    if (net.isIP(hostnameLower)) {
      resolvedIp = hostnameLower;
      family = (net.isIP(hostnameLower) === 4 ? 4 : 6);
    } else {
      try {
        const lookup = await dns.lookup(hostnameLower, { all: false, verbatim: true });
        resolvedIp = lookup.address;
        family = lookup.family === 6 ? 6 : 4;
      } catch {
        return { ok: false, error: "Résolution DNS échouée" };
      }
    }

    if (family === 4 ? isPrivateV4(resolvedIp) : isPrivateV6(resolvedIp)) {
      return { ok: false, error: "Adresse IP privée / link-local interdite" };
    }

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(currentUrl.toString(), {
        ...init,
        redirect: "manual",
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(t);
      return { ok: false, error: err instanceof Error ? err.message : "Erreur réseau" };
    }
    clearTimeout(t);

    // Pas de redirection : on a la réponse finale
    if (res.status < 300 || res.status >= 400) {
      return { ok: true, response: res };
    }

    const location = res.headers.get("location");
    if (!location) return { ok: true, response: res };
    if (hop === maxRedirects) return { ok: false, error: "Trop de redirections" };

    try {
      currentUrl = new URL(location, currentUrl);
    } catch {
      return { ok: false, error: "Redirection invalide" };
    }
  }

  return { ok: false, error: "Trop de redirections" };
}
