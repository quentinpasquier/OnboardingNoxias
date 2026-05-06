/**
 * Structure cible de la "Boîte à outils" générée par l'IA depuis la matrice.
 * Calquée sur la VDEF Bowigo : positionnement, personas, argumentaires,
 * pitch V1 (5 sections), 30 objections (5 catégories), matrice de qualification.
 */

export type Persona = {
  title: string;
  profile: string;
  kpis: string;
  pains: string;
  motivations: string;
  triggers: string;
};

export type PitchSection = {
  id: string;
  label: string;
  scripts: { variant: string; text: string }[];
};

export type Objection = {
  id: number;
  category: "A" | "B" | "C" | "D" | "E";
  text: string;
  response: string;
};

export type QualifCriterion = {
  label: string;
  score0: string;
  score1: string;
  score2: string;
};

export type Toolbox = {
  positioning: {
    intro: string;        // 4 à 6 paragraphes narratifs (cadrage, enjeu, positionnement)
    promise: string;      // promesse centrale en 1-2 phrases
    services: string;     // ordre des services à présenter
    targets: string;      // cibles à prioriser
    phrases: string[];    // 5 phrases à marteler
    finalAnchor: string;  // positionnement final à ancrer
    irritants: string[];  // questions concrètes pour ouvrir un échange (« comment gérez-vous… »)
    valueResult: string;  // résultat tangible promis 30-60j
  };
  personas: Persona[];
  disqualified: string;
  killerArguments: { headline: string; body: string }[];
  pitch: PitchSection[];
  objections: Objection[];
  qualification: {
    criteria: QualifCriterion[];
    tiers: { name: string; score: string; description: string; action: string }[];
  };
};

export const PITCH_STRUCTURE = [
  { id: "1.0", label: "Si barrage / accueil" },
  { id: "1.1", label: "Brise-glace / prise de contact décideur" },
  { id: "2.0", label: "Qualification de la situation actuelle" },
  { id: "3.0", label: "Questions de qualification, PAIN & KPI" },
  { id: "4.0", label: "Pitch de réponse adapté, proposition de valeur" },
  { id: "5.0", label: "Prise de RDV" },
];

export const OBJECTION_CATEGORIES: { code: "A" | "B" | "C" | "D" | "E"; label: string }[] = [
  { code: "A", label: "Partenaires actuels / interne" },
  { code: "B", label: "Budget / coût" },
  { code: "C", label: "Temps / priorité" },
  { code: "D", label: "Confiance / transparence" },
  { code: "E", label: "Besoin / pertinence" },
];

export const QUALIF_CRITERIA_LABELS = ["Douleur (PAIN)", "Objectif (GAIN)", "Budget", "Autorité", "Urgence"];
