/**
 * Découpage de la boîte à outils en 6 sections autonomes pour générer
 * et éditer chacune indépendamment. Évite les timeouts serverless et
 * permet l'édition par page.
 */
import type { Toolbox } from "@/lib/toolbox-schema";
import { Target, Users, MessageSquare, Phone, Shield, Layers } from "lucide-react";

export type SectionKey = "positioning" | "personas" | "arguments" | "pitch" | "objections" | "qualification";

export const SECTION_DEFS: { key: SectionKey; slug: string; label: string; description: string; icon: typeof Target }[] = [
  { key: "positioning", slug: "positionnement", label: "Positionnement", description: "Cadrage, promesse, services, cibles, phrases à marteler, irritants à poser, ancrage final.", icon: Target },
  { key: "personas", slug: "personas", label: "Personas", description: "1 à 3 décideurs cibles : profil, KPI, douleurs, motivations, déclencheurs.", icon: Users },
  { key: "arguments", slug: "argumentaires", label: "Arguments massue & disqualification", description: "6-8 phrases massues + profils à NE PAS prospecter.", icon: MessageSquare },
  { key: "pitch", slug: "pitch", label: "Pitch V1", description: "5 sections : barrage, brise-glace, qualif, PAIN&KPI, valeur, RDV.", icon: Phone },
  { key: "objections", slug: "objections", label: "Traitement des objections", description: "30 objections classées en 5 familles (A à E).", icon: Shield },
  { key: "qualification", slug: "qualification", label: "Matrice de qualification", description: "Scoring 5 critères + 3 tiers de leads.", icon: Layers },
];

export function isSectionDone(toolbox: Toolbox | null, key: SectionKey): boolean {
  if (!toolbox) return false;
  switch (key) {
    case "positioning":
      return !!toolbox.positioning?.intro?.trim();
    case "personas":
      return Array.isArray(toolbox.personas) && toolbox.personas.length > 0;
    case "arguments":
      return Array.isArray(toolbox.killerArguments) && toolbox.killerArguments.length > 0;
    case "pitch":
      return Array.isArray(toolbox.pitch) && toolbox.pitch.length > 0;
    case "objections":
      return Array.isArray(toolbox.objections) && toolbox.objections.length > 0;
    case "qualification":
      return Array.isArray(toolbox.qualification?.criteria) && toolbox.qualification.criteria.length > 0;
  }
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
