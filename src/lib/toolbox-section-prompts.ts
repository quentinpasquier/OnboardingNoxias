/**
 * Schémas + prompts par section (positioning / personas / arguments / pitch / objections / qualification).
 * Permet de générer chaque section indépendamment avec un timeout court.
 */

import type { SectionKey } from "@/lib/toolbox-sections";

const positioningSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    intro: { type: "string" },
    promise: { type: "string" },
    services: { type: "string" },
    targets: { type: "string" },
    phrases: { type: "array", items: { type: "string" } },
    finalAnchor: { type: "string" },
    irritants: { type: "array", items: { type: "string" } },
    valueResult: { type: "string" },
  },
  required: ["intro", "promise", "services", "targets", "phrases", "finalAnchor", "irritants", "valueResult"],
} as const;

const personasSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    personas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          profile: { type: "string" },
          kpis: { type: "string" },
          pains: { type: "string" },
          motivations: { type: "string" },
          triggers: { type: "string" },
        },
        required: ["title", "profile", "kpis", "pains", "motivations", "triggers"],
      },
    },
  },
  required: ["personas"],
} as const;

const argumentsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    disqualified: { type: "string" },
    killerArguments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { headline: { type: "string" }, body: { type: "string" } },
        required: ["headline", "body"],
      },
    },
  },
  required: ["disqualified", "killerArguments"],
} as const;

const pitchSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    pitch: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          scripts: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: { variant: { type: "string" }, text: { type: "string" } },
              required: ["variant", "text"],
            },
          },
        },
        required: ["id", "label", "scripts"],
      },
    },
  },
  required: ["pitch"],
} as const;

const objectionsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    objections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "integer" },
          category: { type: "string", enum: ["A", "B", "C", "D", "E"] },
          text: { type: "string" },
          response: { type: "string" },
        },
        required: ["id", "category", "text", "response"],
      },
    },
  },
  required: ["objections"],
} as const;

const qualificationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    qualification: {
      type: "object",
      additionalProperties: false,
      properties: {
        criteria: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              label: { type: "string" },
              score0: { type: "string" },
              score1: { type: "string" },
              score2: { type: "string" },
            },
            required: ["label", "score0", "score1", "score2"],
          },
        },
        tiers: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              score: { type: "string" },
              description: { type: "string" },
              action: { type: "string" },
            },
            required: ["name", "score", "description", "action"],
          },
        },
      },
      required: ["criteria", "tiers"],
    },
  },
  required: ["qualification"],
} as const;

export const SECTION_SCHEMAS = {
  positioning: positioningSchema,
  personas: personasSchema,
  arguments: argumentsSchema,
  pitch: pitchSchema,
  objections: objectionsSchema,
  qualification: qualificationSchema,
} as const;

const COMMON_RULES = `Ton Noxias : direct, premium, posé. Pas de préambule. Ancré dans la matrice et le contexte client. Si une info manque, infère prudemment plutôt que de générer du flou. Aucune mention "TODO" ou "à compléter". JSON strict conforme au schéma, sans markdown autour.`;

export const SECTION_PROMPTS: Record<SectionKey, string> = {
  positioning: `Génère la section **positionnement** de la boîte à outils du commercial.

- **intro** : 4 à 6 paragraphes (~ 200–400 mots). Cadre le document, explique l'enjeu réel (au-delà du produit), positionne le client comme partenaire/expert (pas simple fournisseur). Cite les forces concrètes extraites de la matrice.
- **promise** : 1–2 phrases. La promesse centrale.
- **services** : ordre constant des services à présenter dans le discours, séparés par virgules ou puces.
- **targets** : 1 paragraphe sur les cibles à attaquer en priorité (corps de cible, super-cible, cibles secondaires).
- **phrases** : exactement 5 punchlines à marteler, courtes.
- **finalAnchor** : 1–2 phrases qui ancrent le positionnement final ("X ne vend pas Y. X prend en charge Z.").
- **irritants** : 4 à 6 questions concrètes que le commercial doit poser pour ouvrir l'échange ("Comment gérez-vous … ?", "Que se passe-t-il quand … ?"). Pas de oui/non.
- **valueResult** : 4 à 8 phrases sur le résultat tangible promis sous 30–60 jours.

${COMMON_RULES}`,

  personas: `Génère la section **personas** de la boîte à outils.

Produis 1 à 3 personas (idéal 2). Chacun :
- **title** : "Persona N : [phrase descriptive]" (ex. "Persona 1 : Le dirigeant TPE qui veut un site sans gérer la technique").
- **profile** : 2–3 paragraphes narratifs sur qui il est, son contexte, ce qu'il cherche vraiment.
- **kpis** : 1 paragraphe narratif listant les indicateurs qu'il regarde (phrasé fluide, pas de puces).
- **pains** : 2 paragraphes narratifs. Le quotidien et l'irritant principal en formulations spontanées ("il sait que… mais il n'a ni le temps…"). Inclus 4–5 objections types entre guillemets dans le 2e paragraphe.
- **motivations** : 1 paragraphe sur ce qui le pousse à avancer.
- **triggers** : 1 paragraphe sur les moments où le sujet devient prioritaire.

${COMMON_RULES}`,

  arguments: `Génère les **arguments massue** + le bloc **disqualified** de la boîte à outils.

- **disqualified** : 4–6 phrases sur les profils à NE PAS prospecter (anti-cible).
- **killerArguments** : 6 à 8 arguments massue. Chacun :
  - **headline** : la phrase à dire au prospect, **entre guillemets typographiques « … »**, courte et percutante (≤ 18 mots).
  - **body** : 3–5 phrases denses qui expliquent le contexte et le payoff.

${COMMON_RULES}`,

  pitch: `Génère le **pitch V1** complet de la boîte à outils.

EXACTEMENT 5 sections, ids dans cet ordre :
- **"1.0"** — "Si barrage / accueil" — 3–5 scripts variants : standard, "C'est pour quoi ?", "il/elle n'est pas dispo", "demande de précision".
- **"1.1"** — "Brise-glace / prise de contact avec le décideur" — 3–4 variants : standard, plus directe, plus impactante, + scripts pour gérer "on a déjà…", "encore un prestataire ?", "vous faites quoi exactement ?". **Inclus impérativement la mention d'un cas client réel** (nom, secteur, résultat chiffré ou anecdote) extrait de la question 31 de la matrice.
- **"2.0"** — "Réponse prospect — qualification de la situation actuelle" — 4 scripts pour chaque réponse type ("on gère en interne", "on a déjà un prestataire", "au cas par cas", "on réfléchit").
- **"3.0"** — "Questions de qualification — PAIN & KPI" — 1–2 scripts qui déroulent les vraies questions à poser.
- **"4.0"** — "Pitch de réponse adapté — proposition de valeur" — **6 à 8 variants**, chacun déclenché par une douleur précise (variant = "Si douleur = …", text = la réplique).
- **"5.0"** — "Prise de RDV" — 2–3 variants (formulation standard, plus directe, orientée référence/projet).

Le texte de chaque script est rédigé comme une réplique commerciale prête à dire à voix haute, format "Commercial : « … »".

${COMMON_RULES}`,

  objections: `Génère les **30 objections** de la boîte à outils.

EXACTEMENT 30 objections, ids 1 à 30, **6 par catégorie** :
- **A** — Prestataires actuels / interne ("j'ai déjà…", "je passe par…", "je gère moi-même", "mon ami / fille / neveu s'en occupe", "je suis engagé", "rester chez le prestataire actuel c'est plus simple").
- **B** — Budget / coût ("pas le budget", "trop cher", "budget serré", "pas de dépense mensuelle en plus", "investir ailleurs", "plus tard").
- **C** — Temps / priorité ("pas le temps", "pas la priorité", "envoyez un mail", "débordé", "on vient juste de le faire", "pas de ressources internes").
- **D** — Confiance / transparence ("mauvaise expérience prestataire", "promesse non tenue", "trop commercial", "comment savoir si différent", "ne pas dépendre", "garder la main").
- **E** — Besoin / pertinence ("je m'en sors", "pas besoin du produit", "bouche-à-oreille suffit", "pas besoin de référencement / X", "mes clients ne regardent pas", "pas sûr que ça vaille le coup").

Pour chaque objection :
- **text** : la phrase du prospect entre guillemets typographiques « … » (≤ 12 mots, naturelle).
- **response** : la réponse-type, 4–7 phrases denses, en italique-friendly. Reconnaît l'objection ("Je comprends", "Je l'entends"), reformule en irritant concret, ramène vers la valeur du client.

${COMMON_RULES}`,

  qualification: `Génère la **matrice de qualification (Scoring R1)**.

- **criteria** : EXACTEMENT 5 critères dans cet ordre — Douleur (PAIN), Objectif (GAIN), Budget, Autorité (Décision), Urgence (Déclencheur). Pour chacun, score0/score1/score2 décrivent **avec exemples concrets entre guillemets** ("Mon site n'est plus à jour", "Je paye 200 €/mois et je ne suis pas content").
- **tiers** : EXACTEMENT 3 tiers — "Tier A — Lead chaud" (7 à 10), "Tier B — Lead tiède" (4 à 6), "Tier C — Lead froid" (0 à 3). Pour chacun : description (1–3 phrases) + action (1 phrase).

${COMMON_RULES}`,
};
