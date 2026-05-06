import type { Mission } from "@/types/mission";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";

function csvEscape(v: string): string {
  if (v == null) return "";
  const s = String(v).replace(/\r\n|\n/g, "\n");
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function matrixToCsv(mission: Mission): string {
  const rows: string[] = [];
  rows.push(["ID", "Catégorie", "Question", "Réponse"].map(csvEscape).join(","));
  for (const q of MATRIX_QUESTIONS) {
    const a = mission.matrix[q.id]?.trim() ?? "";
    rows.push([String(q.id), q.category, q.question, a].map(csvEscape).join(","));
  }
  return rows.join("\n") + "\n";
}

export function downloadCsv(filename: string, content: string) {
  const bom = "﻿";
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
