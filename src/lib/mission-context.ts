import type { Mission } from "@/types/mission";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";

const MAX_PER_FILE = 12_000;
const MAX_TOTAL_FILES = 60_000;

export function buildMissionContext(mission: Mission, opts: { includeMatrix?: boolean } = {}): string {
  const parts: string[] = [];

  parts.push(`# Mission cliente : ${mission.clientName}`);
  if (mission.clientWebsite) parts.push(`Site web : ${mission.clientWebsite}`);
  if (mission.notes?.trim()) parts.push(`\n## Notes du collaborateur\n${mission.notes.trim()}`);

  if (mission.files.length > 0) {
    parts.push(`\n## Sources documentaires (${mission.files.length})`);
    let total = 0;
    for (const f of mission.files) {
      const remaining = MAX_TOTAL_FILES - total;
      if (remaining <= 0) {
        parts.push(`\n### ${f.name}\n[…tronqué — limite contexte atteinte]`);
        continue;
      }
      const slice = f.excerpt.slice(0, Math.min(MAX_PER_FILE, remaining));
      parts.push(`\n### ${f.name}\n${slice}${f.excerpt.length > slice.length ? "\n[…suite tronquée]" : ""}`);
      total += slice.length;
    }
  }

  if (opts.includeMatrix) {
    const answered = MATRIX_QUESTIONS.filter((q) => mission.matrix[q.id]?.trim());
    if (answered.length > 0) {
      parts.push(`\n## Matrice déjà remplie (${answered.length}/${MATRIX_QUESTIONS.length})`);
      for (const q of answered) {
        parts.push(`\n[${q.id}] ${q.category} — ${q.question}\n${mission.matrix[q.id].trim()}`);
      }
    }
  }

  return parts.join("\n");
}
