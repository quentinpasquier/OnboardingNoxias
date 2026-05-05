import { NextResponse } from "next/server";
// pdf-parse a une initialisation paresseuse
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
    const buf = Buffer.from(await file.arrayBuffer());
    const result = await pdfParse(buf);
    const text = (result.text || "").replace(/\s+\n/g, "\n").trim().slice(0, 200_000);
    return NextResponse.json({ text, pages: result.numpages });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
