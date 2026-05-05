import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import type { Mission } from "@/types/mission";

export const runtime = "nodejs";

// Charte Noxias
const INK = "FF000C1E";
const ACCENT = "FF3CC879";
const PAPER_ALT = "FFF7F8F9";
const BORDER = "FFE3E6EA";

export async function POST(req: Request) {
  try {
    const { mission } = (await req.json()) as { mission: Mission };

    const wb = new ExcelJS.Workbook();
    wb.creator = "Onboarding Noxias";
    wb.created = new Date();

    const ws = wb.addWorksheet("Matrice de prospection", {
      views: [{ state: "frozen", ySplit: 2 }],
      properties: { defaultRowHeight: 18 },
    });

    // Titre fusionné sur les 4 colonnes
    ws.mergeCells(1, 1, 1, 4);
    const title = ws.getCell(1, 1);
    title.value = `${mission.clientName} — Matrice de prospection`;
    title.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } };
    title.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
    ws.getRow(1).height = 36;

    // Header row
    const header = ws.getRow(2);
    header.values = ["ID", "Catégorie", "Question centrale", "Réponse"];
    header.eachCell((cell) => {
      cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INK } };
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true, indent: 1 };
      cell.border = {
        bottom: { style: "medium", color: { argb: ACCENT } },
        right: { style: "thin", color: { argb: BORDER } },
      };
    });
    header.height = 28;

    ws.columns = [
      { key: "id", width: 6 },
      { key: "cat", width: 32 },
      { key: "q", width: 38 },
      { key: "a", width: 70 },
    ];

    // Data rows
    let rowIdx = 3;
    for (const q of MATRIX_QUESTIONS) {
      const a = (mission.matrix[q.id] ?? "").trim();
      const status = mission.matrixStatus?.[q.id] ?? (a ? "validated" : "empty");
      const row = ws.getRow(rowIdx);
      row.values = [q.id, q.category, q.question, a];

      // Style général
      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Calibri", size: 10, color: { argb: INK } };
        cell.alignment = { vertical: "top", horizontal: colNumber === 1 ? "center" : "left", wrapText: true, indent: colNumber === 1 ? 0 : 1 };
        cell.border = {
          top: { style: "thin", color: { argb: BORDER } },
          bottom: { style: "thin", color: { argb: BORDER } },
          right: { style: "thin", color: { argb: BORDER } },
        };
      });

      // ID en accent
      const idCell = row.getCell(1);
      idCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: ACCENT } };

      // Lignes alternées
      if (rowIdx % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PAPER_ALT } };
        });
        idCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PAPER_ALT } };
      }

      // Marquer les drafts
      if (status === "draft") {
        const ansCell = row.getCell(4);
        ansCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF7E0" } };
        ansCell.note = "Brouillon IA — à valider";
      }

      // Hauteur dynamique : approx 14pt par 80 chars de réponse
      const lines = Math.max(2, Math.ceil((a.length || 1) / 80));
      row.height = Math.min(220, 14 + lines * 14);

      rowIdx++;
    }

    const buf = await wb.xlsx.writeBuffer();
    const safeName = mission.clientName.replace(/[^a-zA-Z0-9-_]/g, "_");
    return new NextResponse(buf as ArrayBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${safeName}-matrice.xlsx"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
