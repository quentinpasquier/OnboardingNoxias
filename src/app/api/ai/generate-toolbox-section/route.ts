import { NextResponse } from "next/server";
import { anthropic, MODEL, buildSystem } from "@/lib/anthropic";
import { buildMissionContext } from "@/lib/mission-context";
import { SECTION_SCHEMAS, SECTION_PROMPTS } from "@/lib/toolbox-section-prompts";
import type { SectionKey } from "@/lib/toolbox-sections";
import type { Mission } from "@/types/mission";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = { mission: Mission; section: SectionKey; refineInstructions?: string };

const VALID_SECTIONS: SectionKey[] = ["positioning", "personas", "arguments", "pitch", "objections", "qualification"];

export async function POST(req: Request) {
  try {
    const { mission, section, refineInstructions } = (await req.json()) as Body;
    if (!VALID_SECTIONS.includes(section)) {
      return NextResponse.json({ error: `Section inconnue : ${section}` }, { status: 400 });
    }

    const context = buildMissionContext(mission, { includeMatrix: true });
    const system = buildSystem(context);

    const userPrompt = refineInstructions?.trim()
      ? `${SECTION_PROMPTS[section]}\n\n**Instructions complémentaires :**\n${refineInstructions.trim()}`
      : SECTION_PROMPTS[section];

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SECTION_SCHEMAS[section] },
      },
      system,
      messages: [{ role: "user", content: userPrompt }],
    });

    const final = await stream.finalMessage();
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
      section,
      data: parsed,
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
