import type { Mission } from "@/types/mission";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";

export function missionToMarkdown(mission: Mission): string {
  const lines: string[] = [];
  lines.push(`# ${mission.clientName} — Livrables prospection`);
  lines.push(`*Généré par Noxias Prospection Builder*\n`);

  lines.push(`\n## Matrice de prospection\n`);
  for (const q of MATRIX_QUESTIONS) {
    const a = mission.matrix[q.id]?.trim();
    if (!a) continue;
    lines.push(`### ${q.id}. ${q.category}`);
    lines.push(`**${q.question}**\n`);
    lines.push(`${a}\n`);
  }

  const tb = mission.toolbox;
  if (tb) {
    lines.push(`\n## Boîte à outils du commercial\n`);

    lines.push(`### Positionnement\n`);
    lines.push(tb.positioning.intro);
    lines.push(`\n**Promesse :** ${tb.positioning.promise}`);
    lines.push(`\n**Services à mettre en avant :** ${tb.positioning.services}`);
    lines.push(`\n**Cibles à prioriser :** ${tb.positioning.targets}`);
    lines.push(`\n**Phrases à marteler :**`);
    for (const p of tb.positioning.phrases) lines.push(`- ${p}`);
    lines.push(`\n**Ancrage final :** ${tb.positioning.finalAnchor}\n`);

    lines.push(`### Personas\n`);
    for (const p of tb.personas) {
      lines.push(`#### ${p.title}`);
      lines.push(`**Profil.** ${p.profile}\n`);
      lines.push(`**KPI.** ${p.kpis}\n`);
      lines.push(`**Douleurs.** ${p.pains}\n`);
      lines.push(`**Motivations.** ${p.motivations}\n`);
      lines.push(`**Déclencheurs.** ${p.triggers}\n`);
    }

    lines.push(`### Profils à disqualifier\n`);
    lines.push(tb.disqualified + "\n");

    lines.push(`### Argumentaires clés\n`);
    for (const a of tb.killerArguments) {
      lines.push(`> *${a.headline}*\n`);
      lines.push(a.body + "\n");
    }

    lines.push(`### Pitch V1\n`);
    for (const s of tb.pitch) {
      lines.push(`#### ${s.id} — ${s.label}`);
      for (const sc of s.scripts) {
        lines.push(`\n**${sc.variant}**\n`);
        lines.push(sc.text + "\n");
      }
    }

    lines.push(`### Traitement des 30 objections\n`);
    const cats: Record<string, string> = { A: "Partenaires actuels / interne", B: "Budget / coût", C: "Temps / priorité", D: "Confiance / transparence", E: "Besoin / pertinence" };
    for (const code of ["A", "B", "C", "D", "E"] as const) {
      lines.push(`#### ${code}. ${cats[code]}\n`);
      const items = tb.objections.filter((o) => o.category === code);
      for (const o of items) {
        lines.push(`**${o.id}. *${o.text}***\n`);
        lines.push(o.response + "\n");
      }
    }

    lines.push(`### Matrice de qualification\n`);
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
