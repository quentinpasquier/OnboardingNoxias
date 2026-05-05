import type { Toolbox } from "@/lib/toolbox-schema";

export type MissionFile = {
  id: string;
  name: string;
  excerpt: string; // text content (extracted from PDF or pasted)
  addedAt: string;
};

export type MatrixAnswers = Record<number, string>; // questionId -> answer

export type Mission = {
  id: string;
  clientName: string;
  clientWebsite?: string;
  notes?: string;
  files: MissionFile[];
  matrix: MatrixAnswers;
  toolbox: Toolbox | null;
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
    toolbox: null,
    createdAt: now,
    updatedAt: now,
  };
};
