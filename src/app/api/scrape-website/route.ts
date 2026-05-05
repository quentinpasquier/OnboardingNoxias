import { NextResponse } from "next/server";
import { safeFetchPublic } from "@/lib/ssrf-guard";

export const runtime = "nodejs";
export const maxDuration = 30;

function htmlToText(html: string) {
  const noScripts = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const noTags = noScripts.replace(/<[^>]+>/g, " ");
  return noTags.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}

const MAX_BYTES = 2_000_000; // 2 MB de HTML max

export async function POST(req: Request) {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url) return NextResponse.json({ error: "URL manquante" }, { status: 400 });

    const result = await safeFetchPublic(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NoxiasProspectionBuilder/1.0)" },
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    const res = result.response;
    if (!res.ok) {
      return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 502 });
    }

    // Limite la taille du body lue côté serveur pour éviter les bombs HTML
    const reader = res.body?.getReader();
    if (!reader) return NextResponse.json({ error: "Réponse vide" }, { status: 502 });
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        try { await reader.cancel(); } catch {}
        return NextResponse.json({ error: "Réponse trop volumineuse (> 2 MB)" }, { status: 413 });
      }
      chunks.push(value);
    }
    const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    const html = new TextDecoder("utf-8").decode(buf);

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const text = htmlToText(html).slice(0, 100_000);
    return NextResponse.json({ text, title: titleMatch?.[1]?.trim() ?? new URL(url.startsWith("http") ? url : `https://${url}`).hostname });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
