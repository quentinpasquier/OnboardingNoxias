import { NextResponse } from "next/server";
import { anthropic, MODEL, buildSystem } from "@/lib/anthropic";
import { buildMissionContext } from "@/lib/mission-context";
import { TOOLBOX_JSON_SCHEMA, TOOLBOX_USER_PROMPT } from "@/lib/toolbox-prompts";
import type { Mission } from "@/types/mission";

export const runtime = "nodejs";
export const maxDuration = 300;

type Body = { mission: Mission; refineInstructions?: string };

export async function POST(req: Request) {
  try {
    const { mission, refineInstructions } = (await req.json()) as Body;
    const context = buildMissionContext(mission, { includeMatrix: true });
    const system = buildSystem(context);

    const userMessage = refineInstructions?.trim()
      ? `${TOOLBOX_USER_PROMPT}\n\n**Instructions complémentaires du collaborateur :**\n${refineInstructions.trim()}`
      : TOOLBOX_USER_PROMPT;

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "high",
        format: { type: "json_schema", schema: TOOLBOX_JSON_SCHEMA },
      },
      system,
      messages: [{ role: "user", content: userMessage }],
    });

    const final = await stream.finalMessage();

    const text = final.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "JSON invalide retourné par l'IA", raw: text.slice(0, 2000) }, { status: 502 });
    }

    return NextResponse.json({
      toolbox: parsed,
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
