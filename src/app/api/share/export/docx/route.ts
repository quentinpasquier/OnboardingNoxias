import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { renderMissionDocxResponse } from "@/app/api/export/docx/route";
import { rowToMission } from "@/lib/supabase/missions-store";
import type { ExportScope } from "@/lib/exporters";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req: Request) {
  try {
    const { token, scope = "both" } = (await req.json()) as { token: string; scope?: ExportScope };
    if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    if (!SUPABASE_URL || !SUPABASE_KEY) return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });

    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await sb.rpc("get_shared_mission", { p_token: token }).maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });

    const mission = rowToMission(data as Parameters<typeof rowToMission>[0]);
    return await renderMissionDocxResponse(mission, scope);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
