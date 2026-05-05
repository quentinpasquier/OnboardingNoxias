import { NextResponse } from "next/server";
import { anthropic, MODEL, buildSystem } from "@/lib/anthropic";
import { buildMissionContext } from "@/lib/mission-context";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import type { Mission } from "@/types/mission";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = { mission: Mission; questionIds?: number[]; refineInstructions?: string };

const ANSWERS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    answers: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "integer" },
          text: { type: "string" },
        },
        required: ["id", "text"],
      },
    },
  },
  required: ["answers"],
} as const;

const LIST_FRIENDLY_IDS = new Set([2, 3, 15, 19, 20, 22, 23, 24, 26, 30]);

export async function POST(req: Request) {
  try {
    const { mission, questionIds, refineInstructions } = (await req.json()) as Body;

    const targetIds = (questionIds && questionIds.length > 0
      ? questionIds
      : MATRIX_QUESTIONS.filter((q) => !mission.matrix[q.id]?.trim()).map((q) => q.id));

    if (targetIds.length === 0) {
      return NextResponse.json({ answers: [], skipped: "Aucune question à traiter dans ce lot." });
    }

    const context = buildMissionContext(mission, { includeMatrix: true });
    const system = buildSystem(context);

    const questionsList = MATRIX_QUESTIONS
      .filter((q) => targetIds.includes(q.id))
      .map((q) => {
        const list = LIST_FRIENDLY_IDS.has(q.id) ? " (réponse en liste à puces `- ...`)" : "";
        return `[${q.id}] **${q.category}** — ${q.question}${q.hint ? ` _(${q.hint})_` : ""}${list}`;
      })
      .join("\n");

    const userPrompt = `Génère une réponse pour CHACUNE des ${targetIds.length} questions ci-dessous, en t'appuyant sur le contexte client (sources documentaires, site web, notes, et matrice déjà remplie).

**Questions à traiter :**
${questionsList}

**Format obligatoire :**
- Une réponse par question, **id strictement identique** au numéro fourni.
- Privilégier la **liste à puces** (\`- ...\`, une idée par ligne) pour toutes les questions qui appellent une énumération (cibles, canaux, KPI, services, douleurs, motivations, déclencheurs, objections, freins, phrases à marteler). 4 à 8 puces par liste, denses, sans numérotation.
- Pour les questions purement narratives (introduction, promesse en une phrase, ancrage final), 3 à 5 phrases denses, sans liste.
- Ton Noxias : direct, premium, posé, pas de préambule, pas de jargon creux.

**Exigences de fond :**
- Ancre dans les éléments concrets du contexte. Si une info manque, infère prudemment plutôt que de laisser vide ou de faire générique.
- Pas de "TODO" ni "à compléter". Pas de phrases qui commencent par "Voici…" ou "Bien sûr…".
- Cohérence transverse : les réponses du lot doivent être logiquement compatibles entre elles ET avec le reste de la matrice déjà remplie (visible dans le contexte).${refineInstructions?.trim() ? `\n\n**Instructions complémentaires du collaborateur :**\n${refineInstructions.trim()}` : ""}

Réponds en JSON strict conforme au schéma. Aucun markdown autour.`;

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: ANSWERS_SCHEMA },
      },
      system,
      messages: [{ role: "user", content: userPrompt }],
    });

    const final = await stream.finalMessage();

    const text = final.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    let parsed: { answers: { id: number; text: string }[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "JSON invalide retourné par l'IA", raw: text.slice(0, 2000) }, { status: 502 });
    }

    return NextResponse.json({
      answers: parsed.answers,
      requested: targetIds.length,
      received: parsed.answers.length,
      usage: {
        input: final.usage.input_tokens,
        output: final.usage.output_tokens,
        cacheRead: final.usage.cache_read_input_tokens ?? 0,
        cacheWrite: final.usage.cache_creation_input_tokens ?? 0,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur IA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
