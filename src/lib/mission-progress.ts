import type { Mission, PackType } from "@/types/mission";
import { MATRIX_QUESTIONS } from "@/lib/matrix-questions";
import { SECTION_DEFS, expandSectionToJobs, isJobDone } from "@/lib/toolbox-sections";
import { ValidationKey, isValidated } from "@/lib/validation-keys";

export const PACK_LABELS: Record<PackType, string> = {
  "5_rdv": "Pack 5 RDV",
  "10_rdv": "Pack 10 RDV",
  "custom": "Pack sur-mesure",
};

export const PACK_SHORT: Record<PackType, string> = {
  "5_rdv": "5 RDV",
  "10_rdv": "10 RDV",
  "custom": "Sur-mesure",
};

export type MissionProgress = {
  matrixAnswered: number;
  matrixValidated: number;
  matrixTotal: number;
  toolboxGenerated: number;
  toolboxValidated: number;
  toolboxTotal: number;
  weightedPct: number;
};

export function computeProgress(mission: Mission): MissionProgress {
  const matrixTotal = MATRIX_QUESTIONS.length;
  const matrixAnswered = MATRIX_QUESTIONS.filter((q) => mission.matrix[q.id]?.trim()).length;
  const matrixValidated = MATRIX_QUESTIONS.filter((q) => mission.matrixStatus?.[q.id] === "validated").length;

  const tb = mission.toolbox;
  const validations = mission.validations ?? {};
  const toolboxUnits: { generated: boolean; validated: boolean }[] = [];

  for (const def of SECTION_DEFS) {
    const jobs = expandSectionToJobs(def.key);
    for (const j of jobs) {
      const generated = isJobDone(tb, j);
      let validated = false;
      if (j.type === "positioning") validated = isValidated(validations, ValidationKey.positioning());
      else if (j.type === "arguments") validated = isValidated(validations, ValidationKey.arguments_());
      else if (j.type === "qualification") validated = isValidated(validations, ValidationKey.qualification());
      else if (j.type === "pitch_section") validated = isValidated(validations, ValidationKey.pitch(j.id));
      else if (j.type === "objection_category") validated = isValidated(validations, ValidationKey.objection(j.code));
      else if (j.type === "personas") {
        const n = tb?.personas.length ?? 0;
        if (n > 0) {
          let ok = 0;
          for (let i = 0; i < n; i++) if (isValidated(validations, ValidationKey.persona(i))) ok++;
          validated = ok === n;
        }
      }
      toolboxUnits.push({ generated, validated });
    }
  }

  const toolboxTotal = toolboxUnits.length;
  const toolboxGenerated = toolboxUnits.filter((u) => u.generated).length;
  const toolboxValidated = toolboxUnits.filter((u) => u.validated).length;

  const matrixAnsweredPct = matrixTotal ? matrixAnswered / matrixTotal : 0;
  const matrixValidatedPct = matrixTotal ? matrixValidated / matrixTotal : 0;
  const toolboxGeneratedPct = toolboxTotal ? toolboxGenerated / toolboxTotal : 0;
  const toolboxValidatedPct = toolboxTotal ? toolboxValidated / toolboxTotal : 0;

  const weighted =
    matrixAnsweredPct * 0.25 +
    matrixValidatedPct * 0.15 +
    toolboxGeneratedPct * 0.30 +
    toolboxValidatedPct * 0.30;

  return {
    matrixAnswered, matrixValidated, matrixTotal,
    toolboxGenerated, toolboxValidated, toolboxTotal,
    weightedPct: Math.round(weighted * 100),
  };
}

export type TimingInfo = {
  startDate: string | null;
  deliveryDate: string | null;
  totalDays: number | null;
  daysElapsed: number | null;
  daysRemaining: number | null;
  timeProgressPct: number | null;
  overdue: boolean;
};

function parseDate(iso?: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

export function computeTiming(mission: Mission, today = new Date()): TimingInfo {
  const start = parseDate(mission.startDate);
  const delivery = parseDate(mission.deliveryDate);
  if (!start || !delivery) {
    return {
      startDate: mission.startDate ?? null,
      deliveryDate: mission.deliveryDate ?? null,
      totalDays: null, daysElapsed: null, daysRemaining: null,
      timeProgressPct: null, overdue: false,
    };
  }
  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.max(1, Math.round((delivery.getTime() - start.getTime()) / msPerDay));
  const daysElapsed = Math.max(0, Math.floor((today.getTime() - start.getTime()) / msPerDay));
  const daysRemaining = Math.round((delivery.getTime() - today.getTime()) / msPerDay);
  const timeProgressPct = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));
  const overdue = daysRemaining < 0;
  return {
    startDate: mission.startDate ?? null,
    deliveryDate: mission.deliveryDate ?? null,
    totalDays, daysElapsed, daysRemaining, timeProgressPct, overdue,
  };
}

export type HealthStatus = "on_track" | "behind" | "at_risk" | "overdue" | "completed" | "not_scheduled";

export function computeHealth(mission: Mission, progress: MissionProgress, timing: TimingInfo): HealthStatus {
  if (mission.status === "completed") return "completed";
  if (timing.timeProgressPct === null) return "not_scheduled";
  if (timing.overdue && progress.weightedPct < 100) return "overdue";
  const delta = progress.weightedPct - timing.timeProgressPct;
  if (delta >= -5) return "on_track";
  if (delta >= -20) return "behind";
  return "at_risk";
}

export const HEALTH_LABELS: Record<HealthStatus, string> = {
  on_track: "Dans les temps",
  behind: "Léger retard",
  at_risk: "En risque",
  overdue: "En dépassement",
  completed: "Livré",
  not_scheduled: "Sans échéance",
};

export const HEALTH_COLORS: Record<HealthStatus, { bg: string; text: string; border: string; ring: string; dot: string }> = {
  on_track:      { bg: "bg-emerald-500/15", text: "text-emerald-300", border: "border-emerald-500/40", ring: "ring-emerald-500", dot: "bg-emerald-400" },
  behind:        { bg: "bg-amber-500/15",   text: "text-amber-300",   border: "border-amber-500/40",   ring: "ring-amber-500",   dot: "bg-amber-400" },
  at_risk:       { bg: "bg-orange-500/15",  text: "text-orange-300",  border: "border-orange-500/40",  ring: "ring-orange-500",  dot: "bg-orange-500" },
  overdue:       { bg: "bg-red-600/15",     text: "text-red-300",     border: "border-red-600/50",    ring: "ring-red-600",     dot: "bg-red-500" },
  completed:     { bg: "bg-noxias-deep/40", text: "text-emerald-200", border: "border-emerald-400/40", ring: "ring-emerald-400", dot: "bg-emerald-300" },
  not_scheduled: { bg: "bg-slate-500/15",   text: "text-slate-300",   border: "border-slate-500/40",   ring: "ring-slate-500",   dot: "bg-slate-400" },
};

export function formatDaysRemaining(daysRemaining: number | null): string {
  if (daysRemaining === null) return "sans échéance";
  if (daysRemaining < 0) return `${Math.abs(daysRemaining)} j de retard`;
  if (daysRemaining === 0) return "à livrer aujourd'hui";
  if (daysRemaining === 1) return "1 j restant";
  return `${daysRemaining} j restants`;
}

export function formatShortDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
