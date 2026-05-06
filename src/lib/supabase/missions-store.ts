"use client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Mission, MissionFile, MatrixAnswers, MatrixStatus, MissionStatus } from "@/types/mission";
import type { Toolbox } from "@/lib/toolbox-schema";

type Row = {
  id: string;
  client_name: string;
  client_website: string | null;
  notes: string | null;
  files: MissionFile[];
  matrix: MatrixAnswers;
  matrix_status: MatrixStatus;
  toolbox: Toolbox | null;
  status: MissionStatus | null;
  share_token: string | null;
  recommendations: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export function rowToMission(r: Row): Mission {
  return {
    id: r.id,
    clientName: r.client_name,
    clientWebsite: r.client_website ?? undefined,
    notes: r.notes ?? undefined,
    files: r.files ?? [],
    matrix: r.matrix ?? {},
    matrixStatus: r.matrix_status ?? {},
    toolbox: r.toolbox,
    status: r.status ?? "in_progress",
    shareToken: r.share_token ?? undefined,
    recommendations: r.recommendations ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function missionToRow(m: Mission, userId?: string): Partial<Row> {
  return {
    id: m.id,
    client_name: m.clientName,
    client_website: m.clientWebsite ?? null,
    notes: m.notes ?? null,
    files: m.files,
    matrix: m.matrix,
    matrix_status: m.matrixStatus ?? {},
    toolbox: m.toolbox,
    status: m.status ?? "in_progress",
    share_token: m.shareToken ?? null,
    recommendations: m.recommendations ?? null,
    ...(userId ? { created_by: userId } : {}),
  };
}

export const missionsStore = {
  async list(): Promise<Mission[]> {
    const sb = getSupabaseBrowserClient();
    const { data, error } = await sb.from("missions").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return (data as Row[]).map(rowToMission);
  },

  async get(id: string): Promise<Mission | null> {
    const sb = getSupabaseBrowserClient();
    const { data, error } = await sb.from("missions").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? rowToMission(data as Row) : null;
  },

  async create(mission: Mission): Promise<Mission> {
    const sb = getSupabaseBrowserClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) throw new Error("Non authentifié");
    const row = missionToRow(mission, user.id);
    const { data, error } = await sb.from("missions").insert(row).select("*").single();
    if (error) throw error;
    return rowToMission(data as Row);
  },

  async update(mission: Mission): Promise<Mission> {
    const sb = getSupabaseBrowserClient();
    const row = missionToRow(mission);
    const { data, error } = await sb.from("missions").update(row).eq("id", mission.id).select("*").single();
    if (error) throw error;
    return rowToMission(data as Row);
  },

  async remove(id: string): Promise<void> {
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.from("missions").delete().eq("id", id);
    if (error) throw error;
  },

  async enableShare(id: string): Promise<string> {
    const sb = getSupabaseBrowserClient();
    const token = crypto.randomUUID();
    const { error } = await sb.from("missions").update({ share_token: token }).eq("id", id);
    if (error) throw error;
    return token;
  },

  async disableShare(id: string): Promise<void> {
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.from("missions").update({ share_token: null }).eq("id", id);
    if (error) throw error;
  },
};

export const sharedMissionsStore = {
  async get(token: string): Promise<Mission | null> {
    const sb = getSupabaseBrowserClient();
    const { data, error } = await sb.rpc("get_shared_mission", { p_token: token }).maybeSingle();
    if (error) throw error;
    return data ? rowToMission(data as Row) : null;
  },

  async submitRecommendations(token: string, recommendations: string): Promise<void> {
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.rpc("submit_shared_recommendations", {
      p_token: token,
      p_recommendations: recommendations,
    });
    if (error) throw error;
  },
};
