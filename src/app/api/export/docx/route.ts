import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import type { Mission } from "@/types/mission";

export const runtime = "nodejs";

const HEADING_COLOR = "0F1421";
const ACCENT_COLOR = "C8A36F";

function p(text: string, opts: { bold?: boolean; italic?: boolean; size?: number; color?: string; spacing?: number } = {}) {
  return new Paragraph({
    children: [new TextRun({ text, bold: opts.bold, italics: opts.italic, size: opts.size, color: opts.color, font: "Calibri" })],
    spacing: { after: opts.spacing ?? 120 },
  });
}

function h(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel], color = HEADING_COLOR) {
  return new Paragraph({
    heading: level,
    children: [new TextRun({ text, color, font: "Georgia" })],
    spacing: { before: 280, after: 160 },
  });
}

export async function POST(req: Request) {
  try {
    const { mission } = (await req.json()) as { mission: Mission };

    const children: (Paragraph | Table)[] = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "NOXIAS", color: ACCENT_COLOR, size: 16, bold: true, characterSpacing: 200 })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.TITLE,
        children: [new TextRun({ text: `${mission.clientName} — Livrables prospection`, color: HEADING_COLOR, font: "Georgia" })],
        spacing: { after: 480 },
      }),
    ];

    children.push(h("Matrice de prospection", HeadingLevel.HEADING_1));
    let answeredCount = 0;
    for (const q of MATRIX_QUESTIONS) {
      const a = mission.matrix[q.id]?.trim();
      if (!a) continue;
      answeredCount++;
      children.push(h(`${q.id}. ${q.category}`, HeadingLevel.HEADING_3));
      children.push(p(q.question, { italic: true, color: "666666", size: 22 }));
      for (const line of a.split("\n")) children.push(p(line));
    }
    if (answeredCount === 0) {
      children.push(p("Matrice non renseignée.", { italic: true, color: "999999" }));
    }

    const tb = mission.toolbox;
    if (tb) {
      children.push(h("Boîte à outils du commercial", HeadingLevel.HEADING_1));

      children.push(h("Positionnement", HeadingLevel.HEADING_2));
      for (const line of tb.positioning.intro.split("\n").filter(Boolean)) children.push(p(line));
      children.push(p("Promesse centrale", { bold: true }));
      children.push(p(tb.positioning.promise));
      children.push(p("Services à mettre en avant", { bold: true }));
      children.push(p(tb.positioning.services));
      children.push(p("Cibles à prioriser", { bold: true }));
      children.push(p(tb.positioning.targets));
      children.push(p("Phrases à marteler", { bold: true }));
      for (const phr of tb.positioning.phrases) children.push(p(`• ${phr}`));
      children.push(p("Ancrage final", { bold: true }));
      children.push(p(tb.positioning.finalAnchor));

      children.push(h("Personas", HeadingLevel.HEADING_2));
      for (const persona of tb.personas) {
        children.push(h(persona.title, HeadingLevel.HEADING_3));
        children.push(p("Profil.", { bold: true }));
        children.push(p(persona.profile));
        children.push(p("KPI.", { bold: true }));
        children.push(p(persona.kpis));
        children.push(p("Douleurs.", { bold: true }));
        children.push(p(persona.pains));
        children.push(p("Motivations.", { bold: true }));
        children.push(p(persona.motivations));
        children.push(p("Déclencheurs.", { bold: true }));
        children.push(p(persona.triggers));
      }

      children.push(h("Profils à disqualifier", HeadingLevel.HEADING_2));
      for (const line of tb.disqualified.split("\n").filter(Boolean)) children.push(p(line));

      children.push(h("Argumentaires clés", HeadingLevel.HEADING_2));
      for (const arg of tb.killerArguments) {
        children.push(p(`« ${arg.headline} »`, { italic: true, color: ACCENT_COLOR }));
        children.push(p(arg.body));
      }

      children.push(h("Pitch V1", HeadingLevel.HEADING_2));
      for (const section of tb.pitch) {
        children.push(h(`${section.id} — ${section.label}`, HeadingLevel.HEADING_3));
        for (const sc of section.scripts) {
          children.push(p(sc.variant, { bold: true, color: ACCENT_COLOR, size: 20 }));
          for (const line of sc.text.split("\n")) children.push(p(line));
        }
      }

      children.push(h("Traitement des 30 objections", HeadingLevel.HEADING_2));
      const cats: Record<string, string> = { A: "Partenaires actuels / interne", B: "Budget / coût", C: "Temps / priorité", D: "Confiance / transparence", E: "Besoin / pertinence" };
      for (const code of ["A", "B", "C", "D", "E"] as const) {
        children.push(h(`${code}. ${cats[code]}`, HeadingLevel.HEADING_3));
        const items = tb.objections.filter((o) => o.category === code);
        for (const o of items) {
          children.push(p(`${o.id}. « ${o.text} »`, { bold: true, italic: true }));
          for (const line of o.response.split("\n")) children.push(p(line));
        }
      }

      children.push(h("Matrice de qualification", HeadingLevel.HEADING_2));
      const cellPad = { top: 100, bottom: 100, left: 120, right: 120 };
      const headerCell = (text: string) => new TableCell({
        children: [p(text, { bold: true, color: "FFFFFF", size: 18 })],
        shading: { fill: HEADING_COLOR },
        margins: cellPad,
      });
      const bodyCell = (text: string) => new TableCell({ children: [p(text, { size: 18 })], margins: cellPad });

      const qualifTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              headerCell("Critère"),
              headerCell("Score 0 (faible)"),
              headerCell("Score 1 (moyen)"),
              headerCell("Score 2 (élevé)"),
            ],
            tableHeader: true,
          }),
          ...tb.qualification.criteria.map((c) =>
            new TableRow({ children: [bodyCell(c.label), bodyCell(c.score0), bodyCell(c.score1), bodyCell(c.score2)] }),
          ),
        ],
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
          left: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
          right: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "EEEEEE" },
          insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "EEEEEE" },
        },
      });
      children.push(qualifTable);

      children.push(p("", { spacing: 240 }));
      children.push(p("Tiers de leads", { bold: true }));
      for (const t of tb.qualification.tiers) {
        children.push(p(`${t.name} (${t.score}). ${t.description}`));
        children.push(p(`Action : ${t.action}`, { italic: true, color: "555555" }));
      }
    }

    const doc = new Document({
      creator: "Noxias Prospection Builder",
      title: `${mission.clientName} — Livrables prospection`,
      sections: [{ children }],
    });

    const buf = await Packer.toBuffer(doc);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${mission.clientName.replace(/[^a-zA-Z0-9-_]/g, "_")}-prospection.docx"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
