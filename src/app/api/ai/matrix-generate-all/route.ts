import { NextResponse } from "next/server";
import { anthropic, MODEL, buildSystem } from "@/lib/anthropic";
import { buildMissionContext } from "@/lib/mission-context";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import type { Mission } from "@/types/mission";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = { mission: Mission; refineInstructions?: string };

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

export async function POST(req: Request) {
  try {
    const { mission, refineInstructions } = (await req.json()) as Body;

    const missingIds = MATRIX_QUESTIONS
      .filter((q) => !mission.matrix[q.id]?.trim())
      .map((q) => q.id);

    if (missingIds.length === 0) {
      return NextResponse.json({ answers: [], skipped: "Toutes les questions sont déjà remplies." });
    }

    const context = buildMissionContext(mission, { includeMatrix: true });
    const system = buildSystem(context);

    const questionsList = MATRIX_QUESTIONS
      .filter((q) => missingIds.includes(q.id))
      .map((q) => `[${q.id}] **${q.category}** — ${q.question}${q.hint ? ` _(${q.hint})_` : ""}`)
      .join("\n");

    const userPrompt = `Génère une réponse pour CHACUNE des ${missingIds.length} questions ci-dessous, en t'appuyant sur le contexte client fourni (sources documentaires, site web, notes, et matrice déjà remplie).

**Questions à traiter :**
${questionsList}

**Exigences :**
- Une réponse par question, **id strictement identique** au numéro fourni.
- 4 à 8 phrases denses par réponse, ton Noxias (direct, premium, posé, sans préambule).
- Ancre dans les éléments concrets du contexte. Si une info manque, infère prudemment plutôt que de laisser vide ou de faire générique.
- Pas de "TODO" ni "à compléter".
- Pas de listes à puces sauf si la question l'appelle (cibles, canaux, KPI).
- Cohérence transverse : les réponses doivent former un ensemble logique (le persona des questions 4-14 doit coller à la cible des questions 2-3, etc.).${refineInstructions?.trim() ? `\n\n**Instructions complémentaires du collaborateur :**\n${refineInstructions.trim()}` : ""}

Réponds en JSON strict conforme au schéma. Aucun markdown autour.`;

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
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
      requested: missingIds.length,
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
