import { NextResponse } from "next/server";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } from "docx";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import type { Mission } from "@/types/mission";
import type { ExportScope } from "@/lib/exporters";

export const runtime = "nodejs";

// Charte Noxias (hex sans préfixe pour docx)
const INK = "000C1E";
const ACCENT = "3CC879";
const MUTED = "6A7280";

function p(text: string, opts: { bold?: boolean; italic?: boolean; size?: number; color?: string; spacing?: number; font?: string } = {}) {
  return new Paragraph({
    children: [new TextRun({
      text,
      bold: opts.bold,
      italics: opts.italic,
      size: opts.size,
      color: opts.color,
      font: opts.font ?? "Ubuntu",
    })],
    spacing: { after: opts.spacing ?? 120 },
  });
}

function h(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel], color = INK) {
  return new Paragraph({
    heading: level,
    children: [new TextRun({ text, color, font: "Ubuntu", bold: true })],
    spacing: { before: 280, after: 160 },
  });
}

function quote(text: string) {
  return new Paragraph({
    children: [new TextRun({ text: `« ${text} »`, italics: true, color: ACCENT, font: "Ubuntu" })],
    spacing: { after: 120 },
  });
}

function bullet(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Ubuntu" })],
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}

function buildMatrixSection(mission: Mission): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(h("Matrice de prospection", HeadingLevel.HEADING_1));
  let answeredCount = 0;
  for (const q of MATRIX_QUESTIONS) {
    const a = mission.matrix[q.id]?.trim();
    if (!a) continue;
    answeredCount++;
    out.push(h(`${q.id}. ${q.category}`, HeadingLevel.HEADING_3));
    out.push(p(q.question, { italic: true, color: MUTED, size: 22 }));
    for (const line of a.split("\n")) {
      const trimmed = line.trim();
      const m = trimmed.match(/^[-•*]\s+(.+)$/);
      if (m) out.push(bullet(m[1]));
      else if (trimmed.length > 0) out.push(p(trimmed));
    }
  }
  if (answeredCount === 0) out.push(p("Matrice non renseignée.", { italic: true, color: "999999" }));
  return out;
}

function buildToolboxSection(mission: Mission): (Paragraph | Table)[] {
  const tb = mission.toolbox;
  const out: (Paragraph | Table)[] = [];
  if (!tb) {
    out.push(h("Boîte à outils du commercial", HeadingLevel.HEADING_1));
    out.push(p("Boîte à outils non générée.", { italic: true, color: "999999" }));
    return out;
  }

  // Sommaire
  out.push(h("AU SOMMAIRE", HeadingLevel.HEADING_2));
  out.push(p("01.  Boîte à outils du commercial", { bold: true }));
  out.push(p("02.  Pitch V1", { bold: true }));
  out.push(p("03.  Traitement des objections", { bold: true }));
  out.push(p("04.  Matrice de qualification (R1)", { bold: true }));

  // Partie 1
  out.push(p("01.  PARTIE 1", { bold: true, color: ACCENT, size: 20 }));
  out.push(h("Boîte à outils du commercial", HeadingLevel.HEADING_1));

  for (const para of tb.positioning.intro.split(/\n\s*\n/)) {
    if (para.trim()) out.push(p(para.trim()));
  }

  for (const persona of tb.personas) {
    out.push(h(persona.title, HeadingLevel.HEADING_2));

    out.push(p("Profil", { bold: true, color: ACCENT, size: 22 }));
    for (const para of persona.profile.split(/\n\s*\n/)) if (para.trim()) out.push(p(para.trim()));

    out.push(p("KPIs et métriques de décision", { bold: true, color: ACCENT, size: 22 }));
    for (const para of persona.kpis.split(/\n\s*\n/)) if (para.trim()) out.push(p(para.trim()));

    out.push(p("Douleurs et freins", { bold: true, color: ACCENT, size: 22 }));
    for (const para of persona.pains.split(/\n\s*\n/)) if (para.trim()) out.push(p(para.trim()));

    out.push(p("Motivations", { bold: true, color: ACCENT, size: 22 }));
    for (const para of persona.motivations.split(/\n\s*\n/)) if (para.trim()) out.push(p(para.trim()));

    out.push(p("Déclencheurs d'achat", { bold: true, color: ACCENT, size: 22 }));
    for (const para of persona.triggers.split(/\n\s*\n/)) if (para.trim()) out.push(p(para.trim()));
  }

  out.push(h("Profils à disqualifier", HeadingLevel.HEADING_2));
  for (const para of tb.disqualified.split(/\n\s*\n/)) if (para.trim()) out.push(p(para.trim()));

  out.push(h("Argumentaires clés", HeadingLevel.HEADING_2));
  for (const arg of tb.killerArguments) {
    out.push(quote(arg.headline));
    for (const para of arg.body.split(/\n\s*\n/)) if (para.trim()) out.push(p(para.trim()));
  }

  if (tb.positioning.irritants?.length) {
    out.push(h("Pourquoi nous ? — Questions à ouvrir", HeadingLevel.HEADING_2));
    out.push(p("La prospection ne démarre pas par « Nous vendons … ». Elle commence par un irritant concret :", { italic: true, color: MUTED }));
    for (const q of tb.positioning.irritants) out.push(bullet(q));
  }

  out.push(h("Services à mettre en avant", HeadingLevel.HEADING_2));
  out.push(p(tb.positioning.services));

  out.push(h("Cibles à prioriser en prospection", HeadingLevel.HEADING_2));
  out.push(p(tb.positioning.targets));

  out.push(h("Promesse commerciale centrale", HeadingLevel.HEADING_2));
  out.push(p(tb.positioning.promise));

  out.push(h("Résultat concret promis (30–60 jours)", HeadingLevel.HEADING_2));
  for (const para of (tb.positioning.valueResult ?? "").split(/\n\s*\n/)) if (para.trim()) out.push(p(para.trim()));

  out.push(h("Phrases à marteler", HeadingLevel.HEADING_2));
  for (const phr of tb.positioning.phrases) out.push(p(`• ${phr}`, { italic: true }));

  out.push(h("Positionnement final à ancrer", HeadingLevel.HEADING_2));
  out.push(p(tb.positioning.finalAnchor));

  // Partie 2 — Pitch
  out.push(p("02.  PARTIE 2", { bold: true, color: ACCENT, size: 20 }));
  out.push(h("Pitch V1", HeadingLevel.HEADING_1));
  for (const section of tb.pitch) {
    out.push(h(`(${section.id})  ${section.label}`, HeadingLevel.HEADING_2));
    for (const sc of section.scripts) {
      out.push(p(sc.variant, { bold: true, color: ACCENT, size: 22 }));
      for (const line of sc.text.split(/\n\s*\n/)) if (line.trim()) out.push(p(line.trim(), { italic: true }));
    }
  }

  // Partie 3 — Objections
  out.push(p("03.  PARTIE 3", { bold: true, color: ACCENT, size: 20 }));
  out.push(h("Traitement des objections", HeadingLevel.HEADING_1));
  const cats: Record<string, string> = { A: "Prestataires actuels / interne", B: "Budget / coût", C: "Temps / priorité", D: "Confiance / transparence", E: "Besoin / pertinence" };
  for (const code of ["A", "B", "C", "D", "E"] as const) {
    out.push(h(`${code}. ${cats[code]}`, HeadingLevel.HEADING_2));
    const items = tb.objections.filter((o) => o.category === code).sort((a, b) => a.id - b.id);
    for (const o of items) {
      out.push(quote(o.text));
      for (const line of o.response.split(/\n\s*\n/)) if (line.trim()) out.push(p(line.trim(), { italic: true }));
    }
  }

  // Partie 4 — Qualification
  out.push(p("04.  PARTIE 4", { bold: true, color: ACCENT, size: 20 }));
  out.push(h("Matrice de qualification (R1)", HeadingLevel.HEADING_1));
  out.push(p("Lead « Qualifié pour R2 » si score ≥ 7/10. Cinq critères, chacun noté 0/1/2.", { italic: true, color: MUTED }));

  const cellPad = { top: 100, bottom: 100, left: 120, right: 120 };
  const headerCell = (text: string) => new TableCell({
    children: [p(text, { bold: true, color: "FFFFFF", size: 18 })],
    shading: { type: ShadingType.CLEAR, color: "auto", fill: INK },
    margins: cellPad,
  });
  const bodyCell = (text: string) => new TableCell({ children: [p(text, { size: 18 })], margins: cellPad });

  const qualifTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [headerCell("Critère"), headerCell("Score 0 (faible)"), headerCell("Score 1 (moyen)"), headerCell("Score 2 (élevé)")],
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
  out.push(qualifTable);

  out.push(p("", { spacing: 240 }));
  out.push(h("Tiers de leads", HeadingLevel.HEADING_3));
  for (const t of tb.qualification.tiers) {
    out.push(p(`${t.name} (${t.score}). ${t.description}`, { bold: true }));
    out.push(p(`Action : ${t.action}`, { italic: true, color: MUTED }));
  }

  return out;
}

export async function POST(req: Request) {
  try {
    const { mission, scope = "both" } = (await req.json()) as { mission: Mission; scope?: ExportScope };

    const docTitle = scope === "matrix"
      ? `${mission.clientName} — Matrice de prospection`
      : scope === "toolbox"
        ? `${mission.clientName} — Boîte à outils du commercial`
        : `${mission.clientName} — Livrables prospection`;

    const children: (Paragraph | Table)[] = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "NOXIAS", color: ACCENT, size: 16, bold: true, characterSpacing: 200, font: "Ubuntu" })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.TITLE,
        children: [new TextRun({ text: docTitle, color: INK, font: "Ubuntu", bold: true })],
        spacing: { after: 480 },
      }),
    ];

    if (scope === "matrix" || scope === "both") children.push(...buildMatrixSection(mission));
    if (scope === "toolbox" || scope === "both") children.push(...buildToolboxSection(mission));

    const doc = new Document({
      creator: "Noxias Prospection Builder",
      title: docTitle,
      styles: {
        default: {
          document: { run: { font: "Ubuntu" } },
        },
      },
      sections: [{ children }],
    });

    const buf = await Packer.toBuffer(doc);
    const safeName = mission.clientName.replace(/[^a-zA-Z0-9-_]/g, "_");
    const suffix = scope === "matrix" ? "matrice" : scope === "toolbox" ? "boite-a-outils" : "prospection";
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeName}-${suffix}.docx"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
