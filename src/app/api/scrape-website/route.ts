import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

function htmlToText(html: string) {
  const noScripts = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const noTags = noScripts.replace(/<[^>]+>/g, " ");
  return noTags.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}

export async function POST(req: Request) {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url) return NextResponse.json({ error: "URL manquante" }, { status: 400 });
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const res = await fetch(u.toString(), {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; NoxiasProspectionBuilder/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 502 });
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const text = htmlToText(html).slice(0, 100_000);
    return NextResponse.json({ text, title: titleMatch?.[1]?.trim() ?? u.hostname });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
