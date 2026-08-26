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
export type PackType = "5_rdv" | "10_rdv" | "custom";

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
  validations?: Record<string, boolean>;
  startDate?: string;
  deliveryDate?: string;
  packType?: PackType;
  createdAt: string;
  updatedAt: string;
};

export const emptyMission = (clientName: string): Mission => {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const delivery = new Date();
  delivery.setDate(delivery.getDate() + 14);
  const deliveryStr = delivery.toISOString().slice(0, 10);
  return {
    id: crypto.randomUUID(),
    clientName,
    files: [],
    matrix: {},
    matrixStatus: {},
    toolbox: null,
    status: "in_progress",
    startDate: today,
    deliveryDate: deliveryStr,
    packType: "5_rdv",
    createdAt: now,
    updatedAt: now,
  };
};
