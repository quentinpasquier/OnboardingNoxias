import type { Mission } from "@/types/mission";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";

export type ExportScope = "matrix" | "toolbox" | "both";

const OBJ_CATS: Record<string, string> = {
  A: "Prestataires actuels / interne",
  B: "Budget / coût",
  C: "Temps / priorité",
  D: "Confiance / transparence",
  E: "Besoin / pertinence",
};

export function missionToMarkdown(mission: Mission, opts: { scope?: ExportScope } = {}): string {
  const scope = opts.scope ?? "both";
  const lines: string[] = [];

  if (scope === "matrix") lines.push(`# ${mission.clientName}, Matrice de prospection`);
  else if (scope === "toolbox") lines.push(`# ${mission.clientName}, Boîte à outils du commercial`);
  else lines.push(`# ${mission.clientName}, Livrables prospection`);
  lines.push(`*Généré par Onboarding Noxias*\n`);

  if (scope === "matrix" || scope === "both") {
    if (scope === "both") lines.push(`\n## Matrice de prospection\n`);
    for (const q of MATRIX_QUESTIONS) {
      const a = mission.matrix[q.id]?.trim();
      if (!a) continue;
      lines.push(`### ${q.id}. ${q.category}`);
      lines.push(`**${q.question}**\n`);
      lines.push(`${a}\n`);
    }
  }

  const tb = mission.toolbox;
  if (tb && (scope === "toolbox" || scope === "both")) {
    if (scope === "both") lines.push(`\n## Boîte à outils du commercial\n`);

    lines.push(`### Cadrage & positionnement\n`);
    lines.push(tb.positioning.intro + "\n");
    lines.push(`\n**Promesse centrale.** ${tb.positioning.promise}\n`);
    lines.push(`**Services à mettre en avant.** ${tb.positioning.services}\n`);
    lines.push(`**Cibles à prioriser.** ${tb.positioning.targets}\n`);
    lines.push(`**Résultat tangible (30-60j).** ${tb.positioning.valueResult ?? ""}\n`);
    lines.push(`**Phrases à marteler :**`);
    for (const p of tb.positioning.phrases) lines.push(`- *« ${p} »*`);
    if (tb.positioning.irritants?.length) {
      lines.push(`\n**Questions d'ouverture (irritants à poser) :**`);
      for (const q of tb.positioning.irritants) lines.push(`- ${q}`);
    }
    lines.push(`\n**Positionnement final.** ${tb.positioning.finalAnchor}\n`);

    lines.push(`### Personas\n`);
    for (const p of tb.personas) {
      lines.push(`#### ${p.title}\n`);
      lines.push(`**Profil.** ${p.profile}\n`);
      lines.push(`**KPIs et métriques de décision.** ${p.kpis}\n`);
      lines.push(`**Douleurs et freins.** ${p.pains}\n`);
      lines.push(`**Motivations.** ${p.motivations}\n`);
      lines.push(`**Déclencheurs d'achat.** ${p.triggers}\n`);
    }

    lines.push(`### Profils à disqualifier\n`);
    lines.push(tb.disqualified + "\n");

    lines.push(`### Argumentaires clés\n`);
    for (const a of tb.killerArguments) {
      lines.push(`> *« ${a.headline} »*\n`);
      lines.push(a.body + "\n");
    }

    lines.push(`### Pitch V1\n`);
    for (const s of tb.pitch) {
      lines.push(`#### ${s.id}, ${s.label}`);
      for (const sc of s.scripts) {
        lines.push(`\n**${sc.variant}**\n`);
        lines.push(sc.text + "\n");
      }
    }

    lines.push(`### Traitement des 30 objections\n`);
    for (const code of ["A", "B", "C", "D", "E"] as const) {
      lines.push(`#### ${code}. ${OBJ_CATS[code]}\n`);
      const items = tb.objections.filter((o) => o.category === code);
      for (const o of items) {
        lines.push(`**${o.id}.** *« ${o.text} »*\n`);
        lines.push(o.response + "\n");
      }
    }

    lines.push(`### Matrice de qualification (Scoring R1)\n`);
    lines.push(`Lead « Qualifié pour R2 » si score ≥ 7/10. Cinq critères, chacun noté 0/1/2.\n`);
    lines.push(`| Critère | Score 0 (faible) | Score 1 (moyen) | Score 2 (élevé) |`);
    lines.push(`|---|---|---|---|`);
    for (const c of tb.qualification.criteria) {
      lines.push(`| **${c.label}** | ${c.score0} | ${c.score1} | ${c.score2} |`);
    }
    lines.push(`\n**Tiers de leads :**`);
    for (const t of tb.qualification.tiers) {
      lines.push(`- **${t.name} (${t.score}).** ${t.description} *Action :* ${t.action}`);
    }
  }

  return lines.join("\n");
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
