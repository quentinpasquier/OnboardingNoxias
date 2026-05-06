/**
 * Découpage de la boîte à outils en 6 sections autonomes (édition par page)
 * et en 14 « jobs » plus granulaires (génération IA en blocs courts pour
 * éviter les timeouts serverless).
 */
import type { Toolbox } from "@/lib/toolbox-schema";
import { Target, Users, MessageSquare, Phone, Shield, Layers } from "lucide-react";

export type SectionKey = "positioning" | "personas" | "arguments" | "pitch" | "objections" | "qualification";

export type PitchId = "1.0" | "1.1" | "2.0" | "3.0" | "4.0" | "5.0";
export type ObjectionCode = "A" | "B" | "C" | "D" | "E";

export type Job =
  | { type: "positioning" }
  | { type: "personas" }
  | { type: "arguments" }
  | { type: "pitch_section"; id: PitchId }
  | { type: "objection_category"; code: ObjectionCode }
  | { type: "qualification" };

export type JobKey = string; // e.g. "positioning", "pitch_1.0", "objections_A"

export function jobToKey(job: Job): JobKey {
  switch (job.type) {
    case "positioning": return "positioning";
    case "personas": return "personas";
    case "arguments": return "arguments";
    case "pitch_section": return `pitch_${job.id}`;
    case "objection_category": return `objections_${job.code}`;
    case "qualification": return "qualification";
  }
}

export function jobLabel(job: Job): string {
  switch (job.type) {
    case "positioning": return "Positionnement";
    case "personas": return "Personas";
    case "arguments": return "Arguments massue & disqualification";
    case "pitch_section": return PITCH_SECTION_LABELS[job.id];
    case "objection_category": return `Objections ${job.code}, ${OBJECTION_CATEGORY_LABELS[job.code]}`;
    case "qualification": return "Matrice de qualification";
  }
}

export const PITCH_SECTION_LABELS: Record<PitchId, string> = {
  "1.0": "Pitch 1.0, Si barrage / accueil",
  "1.1": "Pitch 1.1, Brise-glace décideur",
  "2.0": "Pitch 2.0, Qualification de la situation",
  "3.0": "Pitch 3.0, Questions PAIN & KPI",
  "4.0": "Pitch 4.0, Pitch adapté par douleur",
  "5.0": "Pitch 5.0, Prise de RDV",
};

export const PITCH_SECTION_DESCRIPTIONS: Record<PitchId, string> = {
  "1.0": "3 à 5 scripts pour passer le standard / l'accueil.",
  "1.1": "3 à 4 scripts d'introduction au décideur, avec mention obligatoire d'un cas client.",
  "2.0": "4 scripts pour qualifier la situation actuelle selon la réponse du prospect.",
  "3.0": "Liste de questions PAIN & KPI à poser pour cadrer la douleur réelle.",
  "4.0": "6 à 8 répliques selon la douleur identifiée, le cœur du pitch.",
  "5.0": "2 à 3 formulations pour proposer un RDV physique ou en visio.",
};

export const OBJECTION_CATEGORY_LABELS: Record<ObjectionCode, string> = {
  A: "Prestataires actuels / interne",
  B: "Budget / coût",
  C: "Temps / priorité",
  D: "Confiance / transparence",
  E: "Besoin / pertinence",
};

export const SECTION_DEFS: { key: SectionKey; slug: string; label: string; description: string; icon: typeof Target }[] = [
  { key: "positioning", slug: "positionnement", label: "Positionnement", description: "Cadrage, promesse, services, cibles, phrases à marteler, irritants à poser, ancrage final.", icon: Target },
  { key: "personas", slug: "personas", label: "Personas", description: "1 à 3 décideurs cibles : profil, KPI, douleurs, motivations, déclencheurs.", icon: Users },
  { key: "arguments", slug: "argumentaires", label: "Arguments massue & disqualification", description: "6-8 phrases massues + profils à NE PAS prospecter.", icon: MessageSquare },
  { key: "pitch", slug: "pitch", label: "Pitch V1", description: "6 sous-blocs : barrage, brise-glace, qualif, PAIN&KPI, valeur, RDV. Régénérables un par un.", icon: Phone },
  { key: "objections", slug: "objections", label: "Traitement des objections", description: "30 objections en 5 familles (A à E), régénérables famille par famille.", icon: Shield },
  { key: "qualification", slug: "qualification", label: "Matrice de qualification", description: "Scoring 5 critères + 3 tiers de leads.", icon: Layers },
];

/** Étend une SectionKey en la liste de jobs concrets à générer. */
export function expandSectionToJobs(key: SectionKey): Job[] {
  switch (key) {
    case "positioning": return [{ type: "positioning" }];
    case "personas": return [{ type: "personas" }];
    case "arguments": return [{ type: "arguments" }];
    case "pitch":
      return (["1.0", "1.1", "2.0", "3.0", "4.0", "5.0"] as PitchId[]).map((id) => ({ type: "pitch_section" as const, id }));
    case "objections":
      return (["A", "B", "C", "D", "E"] as ObjectionCode[]).map((code) => ({ type: "objection_category" as const, code }));
    case "qualification": return [{ type: "qualification" }];
  }
}

/** Tous les jobs nécessaires pour générer la boîte complète. */
export function allJobs(): Job[] {
  return SECTION_DEFS.flatMap((s) => expandSectionToJobs(s.key));
}

/** Jobs manquants pour cette boîte (pour la génération incrémentale). */
export function missingJobs(toolbox: Toolbox | null): Job[] {
  return allJobs().filter((job) => !isJobDone(toolbox, job));
}

export function isJobDone(toolbox: Toolbox | null, job: Job): boolean {
  if (!toolbox) return false;
  switch (job.type) {
    case "positioning":
      return !!toolbox.positioning?.intro?.trim();
    case "personas":
      return Array.isArray(toolbox.personas) && toolbox.personas.length > 0;
    case "arguments":
      return Array.isArray(toolbox.killerArguments) && toolbox.killerArguments.length > 0;
    case "pitch_section": {
      const section = toolbox.pitch?.find((p) => p.id === job.id);
      return !!section && Array.isArray(section.scripts) && section.scripts.length > 0;
    }
    case "objection_category": {
      const items = toolbox.objections?.filter((o) => o.category === job.code) ?? [];
      return items.length > 0;
    }
    case "qualification":
      return Array.isArray(toolbox.qualification?.criteria) && toolbox.qualification.criteria.length > 0;
  }
}

export function isSectionDone(toolbox: Toolbox | null, key: SectionKey): boolean {
  return expandSectionToJobs(key).every((job) => isJobDone(toolbox, job));
}

export function emptyToolbox(): Toolbox {
  return {
    positioning: { intro: "", promise: "", services: "", targets: "", phrases: [], finalAnchor: "", irritants: [], valueResult: "" },
    personas: [],
    disqualified: "",
    killerArguments: [],
    pitch: [],
    objections: [],
    qualification: { criteria: [], tiers: [] },
  };
}

/**
 * Merge la réponse d'un job dans la toolbox existante.
 * - positioning / personas / arguments / qualification : remplacent la section.
 * - pitch_section : remplace la section pitch ayant le même id (ou append).
 * - objection_category : retire les objections de cette catégorie puis append les nouvelles.
 */
export function mergeJobResult(toolbox: Toolbox | null, job: Job, data: Record<string, unknown>): Toolbox {
  const tb: Toolbox = toolbox ?? emptyToolbox();
  switch (job.type) {
    case "positioning":
      return { ...tb, positioning: data as Toolbox["positioning"] };

    case "personas":
      return { ...tb, personas: (data.personas ?? []) as Toolbox["personas"] };

    case "arguments":
      return {
        ...tb,
        disqualified: (data.disqualified ?? "") as string,
        killerArguments: (data.killerArguments ?? []) as Toolbox["killerArguments"],
      };

    case "pitch_section": {
      const newSection = data.section as Toolbox["pitch"][number] | undefined;
      if (!newSection) return tb;
      const others = tb.pitch.filter((p) => p.id !== job.id);
      const combined = [...others, newSection].sort((a, b) => a.id.localeCompare(b.id));
      return { ...tb, pitch: combined };
    }

    case "objection_category": {
      const incoming = (data.objections ?? []) as Toolbox["objections"];
      const others = tb.objections.filter((o) => o.category !== job.code);
      const combined = [...others, ...incoming].sort((a, b) => a.id - b.id);
      return { ...tb, objections: combined };
    }

    case "qualification":
      return { ...tb, qualification: (data.qualification ?? { criteria: [], tiers: [] }) as Toolbox["qualification"] };
  }
}

/**
 * Vide les données d'un job dans la toolbox (pour permettre la régénération).
 */
export function clearJobInToolbox(toolbox: Toolbox | null, job: Job): Toolbox {
  const tb: Toolbox = toolbox ?? emptyToolbox();
  const empty = emptyToolbox();
  switch (job.type) {
    case "positioning":
      return { ...tb, positioning: empty.positioning };
    case "personas":
      return { ...tb, personas: [] };
    case "arguments":
      return { ...tb, killerArguments: [], disqualified: "" };
    case "pitch_section":
      return { ...tb, pitch: tb.pitch.filter((p) => p.id !== job.id) };
    case "objection_category":
      return { ...tb, objections: tb.objections.filter((o) => o.category !== job.code) };
    case "qualification":
      return { ...tb, qualification: empty.qualification };
  }
}

/** Vide tous les jobs d'une section. */
export function clearSectionInToolbox(toolbox: Toolbox | null, key: SectionKey): Toolbox {
  let next: Toolbox = toolbox ?? emptyToolbox();
  for (const job of expandSectionToJobs(key)) {
    next = clearJobInToolbox(next, job);
  }
  return next;
}
