import { NextResponse } from "next/server";
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  Header, Footer, PageNumber, PageBreak,
} from "docx";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import type { Mission } from "@/types/mission";
import type { ExportScope } from "@/lib/exporters";

export const runtime = "nodejs";

// Charte Noxias (hex sans préfixe pour docx)
const INK = "000C1E";
const DEEP = "221932";
const ACCENT = "3CC879";
const ACCENT_LIGHT = "E8F8EF";
const MUTED = "6A7280";
const BORDER = "E5E7EB";
const PAPER_ALT = "F9FAFB";

function p(text: string, opts: { bold?: boolean; italic?: boolean; size?: number; color?: string; spacing?: number; align?: typeof AlignmentType[keyof typeof AlignmentType] } = {}) {
  return new Paragraph({
    alignment: opts.align,
    children: [new TextRun({
      text,
      bold: opts.bold,
      italics: opts.italic,
      size: opts.size,
      color: opts.color,
      font: "Ubuntu",
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

function partLabel(label: string) {
  return new Paragraph({
    children: [new TextRun({ text: label, color: ACCENT, size: 18, bold: true, characterSpacing: 200, font: "Ubuntu" })],
    spacing: { before: 600, after: 80 },
  });
}

function ruleAccent() {
  return new Paragraph({
    children: [],
    border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: ACCENT, space: 1 } },
    spacing: { before: 60, after: 240 },
  });
}

function pullQuote(text: string) {
  return new Paragraph({
    children: [new TextRun({ text: `« ${text} »`, italics: true, color: ACCENT, size: 26, bold: true, font: "Ubuntu" })],
    spacing: { before: 200, after: 120 },
    indent: { left: 320 },
    border: { left: { style: BorderStyle.SINGLE, size: 24, color: ACCENT, space: 12 } },
  });
}

function bullet(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, font: "Ubuntu" })],
    bullet: { level: 0 },
    spacing: { after: 80 },
  });
}

function calloutBox(title: string, body: string) {
  // Encadré coloré avec fond accent_light + bordure gauche accent
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, color: "auto", fill: ACCENT_LIGHT },
            margins: { top: 200, bottom: 200, left: 320, right: 280 },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "auto" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
              right: { style: BorderStyle.NONE, size: 0, color: "auto" },
              left: { style: BorderStyle.SINGLE, size: 30, color: ACCENT },
            },
            children: [
              new Paragraph({
                children: [new TextRun({ text: title.toUpperCase(), color: ACCENT, bold: true, size: 16, characterSpacing: 100, font: "Ubuntu" })],
                spacing: { after: 80 },
              }),
              new Paragraph({
                children: [new TextRun({ text: body, color: INK, size: 22, font: "Ubuntu" })],
                spacing: { after: 0 },
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildMatrixSection(mission: Mission): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(partLabel("01.  PARTIE 01"));
  out.push(h("Matrice de prospection", HeadingLevel.HEADING_1));
  out.push(ruleAccent());

  const answeredItems = MATRIX_QUESTIONS.filter((q) => mission.matrix[q.id]?.trim());
  out.push(p(`${answeredItems.length} réponses sur ${MATRIX_QUESTIONS.length} questions.`, { italic: true, color: MUTED, size: 22 }));

  if (answeredItems.length === 0) {
    out.push(p("Matrice non renseignée.", { italic: true, color: "999999" }));
    return out;
  }

  for (const q of answeredItems) {
    const a = mission.matrix[q.id]!.trim();
    out.push(h(`${q.id}. ${q.category}`, HeadingLevel.HEADING_3, DEEP));
    out.push(p(q.question, { italic: true, color: MUTED, size: 22 }));
    for (const line of a.split("\n")) {
      const trimmed = line.trim();
      const m = trimmed.match(/^[-•*]\s+(.+)$/);
      if (m) out.push(bullet(m[1]));
      else if (trimmed.length > 0) out.push(p(trimmed));
    }
  }
  return out;
}

function buildToolboxSection(mission: Mission): (Paragraph | Table)[] {
  const tb = mission.toolbox;
  const out: (Paragraph | Table)[] = [];
  if (!tb) {
    out.push(partLabel("02.  PARTIE 02"));
    out.push(h("Boîte à outils du commercial", HeadingLevel.HEADING_1));
    out.push(p("Boîte à outils non générée.", { italic: true, color: "999999" }));
    return out;
  }

  // ---------- PARTIE 1 : Boîte à outils ----------
  out.push(partLabel("02.  PARTIE 02"));
  out.push(h("Boîte à outils du commercial", HeadingLevel.HEADING_1));
  out.push(ruleAccent());

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
    out.push(pullQuote(arg.headline));
    for (const para of arg.body.split(/\n\s*\n/)) if (para.trim()) out.push(p(para.trim()));
  }

  if (tb.positioning.irritants?.length) {
    out.push(h("Pourquoi nous ?, Questions à ouvrir", HeadingLevel.HEADING_2));
    out.push(p("La prospection ne démarre pas par « Nous vendons … ». Elle commence par un irritant concret :", { italic: true, color: MUTED }));
    for (const q of tb.positioning.irritants) out.push(bullet(q));
  }

  out.push(h("Services à mettre en avant", HeadingLevel.HEADING_2));
  out.push(p(tb.positioning.services));

  out.push(h("Cibles à prioriser en prospection", HeadingLevel.HEADING_2));
  out.push(p(tb.positioning.targets));

  out.push(calloutBox("Promesse commerciale centrale", tb.positioning.promise));

  out.push(h("Résultat concret promis (30–60 jours)", HeadingLevel.HEADING_2));
  for (const para of (tb.positioning.valueResult ?? "").split(/\n\s*\n/)) if (para.trim()) out.push(p(para.trim()));

  out.push(h("Phrases à marteler", HeadingLevel.HEADING_2));
  for (const phr of tb.positioning.phrases) out.push(pullQuote(phr));

  out.push(calloutBox("Positionnement final à ancrer", tb.positioning.finalAnchor));

  // ---------- PARTIE 2 : Pitch ----------
  out.push(new Paragraph({ children: [new PageBreak()] }));
  out.push(partLabel("03.  PARTIE 03"));
  out.push(h("Pitch V1", HeadingLevel.HEADING_1));
  out.push(ruleAccent());
  out.push(p("Trame d'entretien complète : passage du barrage, brise-glace décideur, qualification de la situation, questions PAIN & KPI, pitch de réponse adapté à la douleur identifiée et formulation de prise de RDV.", { italic: true, color: MUTED, size: 22 }));

  for (const section of tb.pitch) {
    out.push(h(`(${section.id})  ${section.label}`, HeadingLevel.HEADING_2));
    for (const sc of section.scripts) {
      out.push(p(sc.variant, { bold: true, color: ACCENT, size: 22 }));
      for (const line of sc.text.split(/\n\s*\n/)) if (line.trim()) out.push(p(line.trim(), { italic: true }));
    }
  }

  // ---------- PARTIE 3 : Objections ----------
  out.push(new Paragraph({ children: [new PageBreak()] }));
  out.push(partLabel("04.  PARTIE 04"));
  out.push(h("Traitement des objections", HeadingLevel.HEADING_1));
  out.push(ruleAccent());
  out.push(p("Cinq familles d'objections classiques chez les décideurs : prestataires actuels & interne, budget & coût, temps & priorité, confiance & transparence, besoin & pertinence. Pour chacune, la question typique du prospect et la réponse à servir.", { italic: true, color: MUTED, size: 22 }));

  const cats: Record<string, string> = {
    A: "Prestataires actuels / interne",
    B: "Budget / coût",
    C: "Temps / priorité",
    D: "Confiance / transparence",
    E: "Besoin / pertinence",
  };
  for (const code of ["A", "B", "C", "D", "E"] as const) {
    out.push(h(`${code}. ${cats[code]}`, HeadingLevel.HEADING_2));
    const items = tb.objections.filter((o) => o.category === code).sort((a, b) => a.id - b.id);
    for (const o of items) {
      out.push(pullQuote(o.text));
      for (const line of o.response.split(/\n\s*\n/)) if (line.trim()) out.push(p(line.trim(), { italic: true }));
    }
  }

  // ---------- PARTIE 4 : Matrice de qualification ----------
  out.push(new Paragraph({ children: [new PageBreak()] }));
  out.push(partLabel("05.  PARTIE 05"));
  out.push(h("Matrice de qualification (R1)", HeadingLevel.HEADING_1));
  out.push(ruleAccent());
  out.push(p("Lead « Qualifié pour R2 » si score ≥ 7/10. Cinq critères, chacun noté 0/1/2.", { italic: true, color: MUTED, size: 22 }));
  out.push(p("", { spacing: 120 }));

  const cellPad = { top: 120, bottom: 120, left: 140, right: 140 };
  const headerCell = (text: string) => new TableCell({
    children: [p(text, { bold: true, color: "FFFFFF", size: 18 })],
    shading: { type: ShadingType.CLEAR, color: "auto", fill: INK },
    margins: cellPad,
  });
  const bodyCell = (text: string, alt = false) => new TableCell({
    children: [p(text, { size: 18 })],
    margins: cellPad,
    shading: alt ? { type: ShadingType.CLEAR, color: "auto", fill: PAPER_ALT } : undefined,
  });

  const qualifTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [headerCell("Critère"), headerCell("Score 0, faible"), headerCell("Score 1, moyen"), headerCell("Score 2, élevé")],
        tableHeader: true,
      }),
      ...tb.qualification.criteria.map((c, idx) =>
        new TableRow({
          children: [
            new TableCell({
              children: [p(c.label, { bold: true, color: DEEP, size: 18 })],
              margins: cellPad,
              shading: { type: ShadingType.CLEAR, color: "auto", fill: ACCENT_LIGHT },
            }),
            bodyCell(c.score0, idx % 2 === 1),
            bodyCell(c.score1, idx % 2 === 1),
            bodyCell(c.score2, idx % 2 === 1),
          ],
        }),
      ),
    ],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: BORDER },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: BORDER },
    },
  });
  out.push(qualifTable);

  out.push(p("", { spacing: 240 }));
  out.push(h("Tiers de leads", HeadingLevel.HEADING_2));

  // Infographie : 3 cards alignées (table 1×3) avec couleurs distinctes
  const tierColors: Record<number, { bg: string; ink: string; label: string }> = {
    0: { bg: ACCENT_LIGHT, ink: ACCENT, label: "PRIORITÉ ABSOLUE" },
    1: { bg: "FEF3C7", ink: "D97706", label: "À NOURRIR" },
    2: { bg: "F3F4F6", ink: MUTED, label: "DISQUALIFIÉ / NURTURING" },
  };

  const tierTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: tb.qualification.tiers.map((t, i) => {
          const color = tierColors[i] ?? tierColors[2];
          return new TableCell({
            shading: { type: ShadingType.CLEAR, color: "auto", fill: color.bg },
            margins: { top: 240, bottom: 240, left: 240, right: 240 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 24, color: color.ink },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: color.ink },
              left: { style: BorderStyle.SINGLE, size: 4, color: color.ink },
              right: { style: BorderStyle.SINGLE, size: 4, color: color.ink },
            },
            children: [
              new Paragraph({
                children: [new TextRun({ text: color.label, color: color.ink, bold: true, size: 14, characterSpacing: 100, font: "Ubuntu" })],
                spacing: { after: 60 },
              }),
              new Paragraph({
                children: [new TextRun({ text: t.name, color: DEEP, bold: true, size: 22, font: "Ubuntu" })],
                spacing: { after: 80 },
              }),
              new Paragraph({
                children: [new TextRun({ text: `Score ${t.score}`, color: color.ink, italics: true, size: 18, font: "Ubuntu" })],
                spacing: { after: 140 },
              }),
              new Paragraph({
                children: [new TextRun({ text: t.description, color: INK, size: 18, font: "Ubuntu" })],
                spacing: { after: 100 },
              }),
              new Paragraph({
                children: [new TextRun({ text: "Action : ", color: color.ink, bold: true, size: 16, font: "Ubuntu" }), new TextRun({ text: t.action, color: INK, size: 16, italics: true, font: "Ubuntu" })],
                spacing: { after: 0 },
              }),
            ],
          });
        }),
      }),
    ],
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "auto" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideVertical: { style: BorderStyle.SINGLE, size: 8, color: "FFFFFF" },
    },
  });
  out.push(tierTable);

  return out;
}

function buildCoverPage(title: string, subtitle: string): Paragraph[] {
  return [
    new Paragraph({ children: [], spacing: { before: 1200 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "▶  NOXIAS", color: ACCENT, size: 22, bold: true, characterSpacing: 240, font: "Ubuntu" })],
      spacing: { after: 80 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "ONBOARDING CLIENT", color: DEEP, size: 18, bold: true, characterSpacing: 200, font: "Ubuntu" })],
      spacing: { after: 800 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: title, color: INK, size: 64, bold: true, font: "Ubuntu" })],
      spacing: { after: 240 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [],
      border: { bottom: { style: BorderStyle.SINGLE, size: 30, color: ACCENT, space: 1 } },
      spacing: { before: 80, after: 240 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: subtitle, color: MUTED, size: 28, italics: true, font: "Ubuntu" })],
      spacing: { after: 1200 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({
        text: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }),
        color: MUTED, size: 18, font: "Ubuntu",
      })],
      spacing: { after: 80 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Document confidentiel, usage commercial Noxias", color: MUTED, size: 14, italics: true, font: "Ubuntu" })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function buildSommaire(scope: ExportScope): Paragraph[] {
  const items: { num: string; label: string }[] = [];
  if (scope === "matrix" || scope === "both") items.push({ num: "01", label: "Matrice de prospection" });
  if (scope === "toolbox" || scope === "both") {
    items.push({ num: scope === "toolbox" ? "01" : "02", label: "Boîte à outils du commercial" });
    items.push({ num: scope === "toolbox" ? "02" : "03", label: "Pitch V1" });
    items.push({ num: scope === "toolbox" ? "03" : "04", label: "Traitement des objections" });
    items.push({ num: scope === "toolbox" ? "04" : "05", label: "Matrice de qualification (R1)" });
  }
  return [
    new Paragraph({
      children: [new TextRun({ text: "AU SOMMAIRE", color: ACCENT, bold: true, size: 18, characterSpacing: 240, font: "Ubuntu" })],
      spacing: { before: 600, after: 180 },
    }),
    new Paragraph({ children: [], border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: ACCENT, space: 1 } }, spacing: { after: 320 } }),
    ...items.map((it) => new Paragraph({
      children: [
        new TextRun({ text: `${it.num}.  `, color: ACCENT, bold: true, size: 22, font: "Ubuntu" }),
        new TextRun({ text: it.label, color: INK, size: 26, bold: true, font: "Ubuntu" }),
      ],
      spacing: { after: 200 },
    })),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

export async function POST(req: Request) {
  try {
    const { mission, scope = "both" } = (await req.json()) as { mission: Mission; scope?: ExportScope };
    return await renderMissionDocxResponse(mission, scope);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function renderMissionDocxResponse(mission: Mission, scope: ExportScope = "both") {
  try {

    const docTitle = scope === "matrix"
      ? "Matrice de prospection"
      : scope === "toolbox"
        ? "Boîte à outils du commercial"
        : "Livrables prospection";

    const children: (Paragraph | Table)[] = [
      ...buildCoverPage(mission.clientName, docTitle),
      ...buildSommaire(scope),
    ];

    if (scope === "matrix" || scope === "both") children.push(...buildMatrixSection(mission));
    if (scope === "toolbox" || scope === "both") children.push(...buildToolboxSection(mission));

    const headerEl = new Header({
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: "▶ ", color: ACCENT, bold: true, font: "Ubuntu", size: 16 }),
            new TextRun({ text: `noxias  ·  ${mission.clientName}`, color: MUTED, size: 14, font: "Ubuntu" }),
          ],
        }),
      ],
    });

    const footerEl = new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Page ", color: MUTED, size: 14, font: "Ubuntu" }),
            new TextRun({ children: [PageNumber.CURRENT], color: MUTED, size: 14, font: "Ubuntu" }),
            new TextRun({ text: " · Noxias Onboarding Builder", color: MUTED, size: 14, italics: true, font: "Ubuntu" }),
          ],
        }),
      ],
    });

    const doc = new Document({
      creator: "Noxias Onboarding Builder",
      title: `${mission.clientName}, ${docTitle}`,
      styles: { default: { document: { run: { font: "Ubuntu" } } } },
      sections: [{
        headers: { default: headerEl },
        footers: { default: footerEl },
        properties: { page: { margin: { top: 1100, bottom: 1100, left: 1100, right: 1100 } } },
        children,
      }],
    });

    const buf = await Packer.toBuffer(doc);
    const safeName = mission.clientName.replace(/[^a-zA-Z0-9-_]/g, "_");
    const suffix = scope === "matrix" ? "matrice" : scope === "toolbox" ? "boite-a-outils" : "onboarding";
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
