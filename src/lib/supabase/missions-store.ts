"use client";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Mission, MissionFile, MatrixAnswers, MatrixStatus, MissionStatus, MissionComment } from "@/types/mission";
import type { Toolbox } from "@/lib/toolbox-schema";

type CommentRow = {
  id: string;
  mission_id: string;
  anchor_type: string;
  anchor_id: string | null;
  author_name: string;
  author_role: "admin" | "client";
  body: string;
  resolved: boolean;
  created_at: string;
};

function commentRowToComment(r: CommentRow): MissionComment {
  return {
    id: r.id,
    missionId: r.mission_id,
    anchorType: r.anchor_type,
    anchorId: r.anchor_id,
    authorName: r.author_name,
    authorRole: r.author_role,
    body: r.body,
    resolved: r.resolved,
    createdAt: r.created_at,
  };
}

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

  async addFile(token: string, name: string, excerpt: string): Promise<void> {
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.rpc("add_shared_file", {
      p_token: token, p_name: name, p_excerpt: excerpt,
    });
    if (error) throw error;
  },

  async removeFile(token: string, fileId: string): Promise<void> {
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.rpc("remove_shared_file", {
      p_token: token, p_file_id: fileId,
    });
    if (error) throw error;
  },

  async listComments(token: string): Promise<MissionComment[]> {
    const sb = getSupabaseBrowserClient();
    const { data, error } = await sb.rpc("list_shared_comments", { p_token: token });
    if (error) throw error;
    return ((data ?? []) as CommentRow[]).map(commentRowToComment);
  },

  async addComment(token: string, params: {
    anchorType: string; anchorId: string | null; authorName: string; body: string;
  }): Promise<MissionComment> {
    const sb = getSupabaseBrowserClient();
    const { data, error } = await sb.rpc("add_shared_comment", {
      p_token: token,
      p_anchor_type: params.anchorType,
      p_anchor_id: params.anchorId,
      p_author_name: params.authorName,
      p_body: params.body,
    }).single();
    if (error) throw error;
    return commentRowToComment(data as CommentRow);
  },

  async resolveComment(token: string, commentId: string, resolved: boolean): Promise<void> {
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.rpc("resolve_shared_comment", {
      p_token: token, p_comment_id: commentId, p_resolved: resolved,
    });
    if (error) throw error;
  },

  async deleteComment(token: string, commentId: string): Promise<void> {
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.rpc("delete_shared_comment", {
      p_token: token, p_comment_id: commentId,
    });
    if (error) throw error;
  },
};

export const commentsStore = {
  async listForMission(missionId: string): Promise<MissionComment[]> {
    const sb = getSupabaseBrowserClient();
    const { data, error } = await sb.from("mission_comments")
      .select("*").eq("mission_id", missionId).order("created_at", { ascending: true });
    if (error) throw error;
    return (data as CommentRow[]).map(commentRowToComment);
  },

  async addAdminComment(missionId: string, params: {
    anchorType: string; anchorId: string | null; authorName: string; body: string;
  }): Promise<MissionComment> {
    const sb = getSupabaseBrowserClient();
    const { data, error } = await sb.from("mission_comments")
      .insert({
        mission_id: missionId,
        anchor_type: params.anchorType,
        anchor_id: params.anchorId,
        author_name: params.authorName,
        author_role: "admin",
        body: params.body,
      })
      .select("*").single();
    if (error) throw error;
    return commentRowToComment(data as CommentRow);
  },

  async setResolved(commentId: string, resolved: boolean): Promise<void> {
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.from("mission_comments").update({ resolved }).eq("id", commentId);
    if (error) throw error;
  },

  async remove(commentId: string): Promise<void> {
    const sb = getSupabaseBrowserClient();
    const { error } = await sb.from("mission_comments").delete().eq("id", commentId);
    if (error) throw error;
  },
};
