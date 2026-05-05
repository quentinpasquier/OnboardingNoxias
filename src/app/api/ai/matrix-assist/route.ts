import { NextResponse } from "next/server";
import { anthropic, MODEL, buildSystem } from "@/lib/anthropic";
import { buildMissionContext } from "@/lib/mission-context";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import type { Mission } from "@/types/mission";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  mission: Mission;
  questionId: number;
  mode: "draft" | "refine";
  currentAnswer?: string;
  instructions?: string;
};

export async function POST(req: Request) {
  try {
    const { mission, questionId, mode, currentAnswer, instructions } = (await req.json()) as Body;
    const q = MATRIX_QUESTIONS.find((x) => x.id === questionId);
    if (!q) return NextResponse.json({ error: "Question introuvable" }, { status: 400 });

    const context = buildMissionContext(mission, { includeMatrix: true });
    const system = buildSystem(context);

    const userPrompt =
      mode === "draft"
        ? `Propose une réponse pour cette ligne de la matrice de prospection :

**${q.category}**
**Question :** ${q.question}${q.hint ? `\n**Indication :** ${q.hint}` : ""}

Formule une réponse opérationnelle, ancrée dans le contexte client fourni. 4 à 8 phrases denses, ton Noxias. Pas de listes à puces sauf si la question l'appelle (cibles, canaux, KPI).`
        : `Affine cette réponse de la matrice de prospection :

**${q.category}**
**Question :** ${q.question}
**Réponse actuelle :**
${currentAnswer ?? ""}

**Instructions du collaborateur :**
${instructions ?? "Améliore la clarté et la densité, garde le sens."}

Renvoie uniquement la réponse retravaillée.`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("\n")
      .trim();

    return NextResponse.json({
      text,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cacheRead: response.usage.cache_read_input_tokens ?? 0,
        cacheWrite: response.usage.cache_creation_input_tokens ?? 0,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur IA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
