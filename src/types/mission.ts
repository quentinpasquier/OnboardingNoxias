import type { Toolbox } from "@/lib/toolbox-schema";

export type MissionFile = {
  id: string;
  name: string;
  excerpt: string;
  addedAt: string;
  addedBy?: "admin" | "client";
};

export type MissionComment = {
  id: string;
  missionId: string;
  anchorType: string;
  anchorId: string | null;
  authorName: string;
  authorRole: "admin" | "client";
  body: string;
  resolved: boolean;
  createdAt: string;
};

export type MatrixAnswers = Record<number, string>; // questionId -> answer
export type MatrixStatus = Record<number, "draft" | "validated">; // questionId -> status

export type MissionStatus = "in_progress" | "completed";

export type Mission = {
  id: string;
  clientName: string;
  clientWebsite?: string;
  notes?: string;
  files: MissionFile[];
  matrix: MatrixAnswers;
  matrixStatus?: MatrixStatus;
  toolbox: Toolbox | null;
  status?: MissionStatus;
  shareToken?: string;
  recommendations?: string;
  createdAt: string;
  updatedAt: string;
};

export const emptyMission = (clientName: string): Mission => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    clientName,
    files: [],
    matrix: {},
    matrixStatus: {},
    toolbox: null,
    status: "in_progress",
    createdAt: now,
    updatedAt: now,
  };
};
