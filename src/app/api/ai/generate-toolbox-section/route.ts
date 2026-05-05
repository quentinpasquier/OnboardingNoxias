import { NextResponse } from "next/server";
import { anthropic, MODEL, buildSystem, NOXIAS_SYSTEM_PROMPT } from "@/lib/anthropic";
import { buildMissionContext } from "@/lib/mission-context";
import { getJobPrompt, PITCH_EXPERT_SYSTEM_ADDENDUM } from "@/lib/toolbox-section-prompts";
import type { Job } from "@/lib/toolbox-sections";
import type { Mission } from "@/types/mission";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = { mission: Mission; job: Job; refineInstructions?: string };

export async function POST(req: Request) {
  try {
    const { mission, job, refineInstructions } = (await req.json()) as Body;
    if (!job || !job.type) {
      return NextResponse.json({ error: "Job manquant" }, { status: 400 });
    }

    const { schema, userPrompt, expert, maxTokens, effort, thinking } = getJobPrompt(job);
    const context = buildMissionContext(mission, { includeMatrix: true });

    // Si agent expert : on injecte l'addendum dans le system prompt avant
    // le contexte mission. Le prefix Noxias reste le même (cache hit).
    const systemBlocks = expert
      ? [
          { type: "text" as const, text: NOXIAS_SYSTEM_PROMPT + PITCH_EXPERT_SYSTEM_ADDENDUM, cache_control: { type: "ephemeral" as const } },
          { type: "text" as const, text: context, cache_control: { type: "ephemeral" as const } },
        ]
      : buildSystem(context);

    const finalPrompt = refineInstructions?.trim()
      ? `${userPrompt}\n\n**Instructions complémentaires :**\n${refineInstructions.trim()}`
      : userPrompt;

    const startedAt = Date.now();
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: maxTokens,
      thinking: { type: thinking },
      output_config: {
        effort,
        format: { type: "json_schema", schema },
      },
      system: systemBlocks,
      messages: [{ role: "user", content: finalPrompt }],
    });

    const final = await stream.finalMessage();
    const durationMs = Date.now() - startedAt;
    const text = final.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "JSON invalide retourné par l'IA", raw: text.slice(0, 1500) }, { status: 502 });
    }

    return NextResponse.json({
      job,
      data: parsed,
      durationMs,
      usage: {
        input: final.usage.input_tokens,
        output: final.usage.output_tokens,
        cacheRead: final.usage.cache_read_input_tokens ?? 0,
        cacheWrite: final.usage.cache_creation_input_tokens ?? 0,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur IA";
    console.error("[generate-toolbox-section] error:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
