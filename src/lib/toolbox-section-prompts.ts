/**
 * Schémas + prompts par job. Chaque job correspond à un appel IA court
 * (10–20 s typique, < 60 s timeout serverless free tier).
 *
 * Les jobs pitch_* et objection_category bénéficient en plus d'un
 * « agent commercial expert » embarqué dans le system prompt.
 */

import type { Job, PitchId, ObjectionCode } from "@/lib/toolbox-sections";

// -----------------------------------------------------------------------------
// Sub-system prompt : Agent commercial expert
// -----------------------------------------------------------------------------
export const PITCH_EXPERT_SYSTEM_ADDENDUM = `\n\n**Agent commercial expert (active sur ce bloc)** :
Tu es un coach commercial senior, formé sur SPIN Selling (Neil Rackham), MEDDIC / MEDDPICC, BANT, la méthode Sandler et les fondamentaux de la prospection terrain française. Tu structures un pitch comme suit :

1. **Ancrage par l'irritant** (Situation → Problème → Implication → Need-payoff). Tu n'ouvres jamais par "Nous vendons / Nous créons …" mais par une question concrète sur la pratique actuelle du prospect.
2. **Asymétrie d'expertise** : tes questions sont plus fines que ce que le prospect attend, ce qui crédibilise immédiatement le commercial. Ex. : "Vous traitez vos modifs en 24 h ou plutôt 48–72 h ?", "Vous avez calculé combien vous coûte un mois supplémentaire d'engagement chez X ?".
3. **Preuve par cas client en < 30 secondes** : tu glisses systématiquement un cas client réel avec nom + secteur + résultat chiffré ou anecdote utilisable. Pas de stat vague.
4. **Cost of Inaction** avant la solution : tu fais voir le risque de ne rien faire avant de présenter la valeur. "Tell don't sell" inversé.
5. **Commitment incrémental** : jamais demander un gros oui d'un coup. Demander un mini-oui → puis un autre → puis le RDV. Toujours laisser le prospect garder la main ("aucun engagement", "vous êtes libre", "on regarde simplement").
6. **Ton parlé, pas écrit** : phrases courtes, ponctuation orale (virgules, pauses, retours), guillemets typographiques « … », un seul concept par phrase. Tu peux utiliser "—" pour les apartés. **Pas de jargon corporate**.
7. **Reformulation systématique** : tu reformules ce que dit le prospect avant de répondre, pour montrer que tu écoutes vraiment ("Si je comprends bien, …").
8. **Variantes calibrées** : tu fournis toujours plusieurs variantes par script (standard / plus directe / plus impactante / version pour cible chaude vs cible froide).`;

const COMMON_RULES = `Ton Noxias : direct, premium, posé. Pas de préambule. Ancré dans la matrice et le contexte client. Si une info manque, infère prudemment plutôt que de générer du flou. Aucune mention "TODO" ou "à compléter". JSON strict conforme au schéma, sans markdown autour.`;

// -----------------------------------------------------------------------------
// Schémas
// -----------------------------------------------------------------------------
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

const pitchSectionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    section: {
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
  required: ["section"],
} as const;

const objectionCategorySchema = {
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

// -----------------------------------------------------------------------------
// Prompts par job
// -----------------------------------------------------------------------------

const PITCH_USER_BY_ID: Record<PitchId, { label: string; brief: string }> = {
  "1.0": {
    label: "Si barrage / accueil",
    brief: `Génère 3 à 5 scripts variants pour passer le **standard / l'accueil** :
- Standard : « Bonjour, je suis bien chez … ? Parfait, [Prénom Nom] de [client]. Je cherche à joindre le ou la dirigeant·e ».
- "C'est pour quoi ?" : 1–2 phrases qui replacent le sujet sur un irritant concret du métier du prospect, pas sur le produit.
- "Il / elle n'est pas dispo" : demande de ligne directe + meilleur moment.
- "Demande de précision" : reformulation du positionnement (1 phrase) + relance ouverte.

Chaque script est rédigé comme une réplique commerciale parlée, format \`Commercial : « … »\`. Phrases courtes, ponctuation orale.`,
  },
  "1.1": {
    label: "Brise-glace / prise de contact avec le décideur",
    brief: `Génère 3 à 4 variants d'introduction au décideur :
- **Standard** : présentation + irritant + ce que le client n'est PAS + ce qu'il EST + question ouverte (référence à site / fiche Google / actu repérée).
- **Version plus directe** : attaque tout de suite par "On échange avec des dirigeants qui …" + cost-of-inaction.
- **Version plus impactante** (super-cible / concurrence) : positionne le client face à ses concurrents directs (Solocal/Linkeo équivalents pour ton secteur).
- **Scripts pour gérer** : "On a déjà un site / un prestataire" → "Vous payez combien, vous êtes engagés sur quelle durée ?" / "Encore un prestataire ?" → différenciation triple (prix, réactivité, interlocuteur unique) / "Vous faites quoi exactement ?" → ordre de discours constant / "Le digital, mon neveu / ma fille / un ami s'en occupe" → distinction service ponctuel vs continuité.

⚠️ **MENTION OBLIGATOIRE D'UN CAS CLIENT RÉEL** dans au moins 2 scripts (variant standard + variant plus impactante), extrait de la question 31 de la matrice si fournie. Format : "On accompagne par exemple [nom du client] dans [secteur] qui … [résultat chiffré]". Si la question 31 n'a pas de cas concret, infère 1–2 cas plausibles et marque-les explicitement comme "[exemple à valider avec un vrai cas client]".`,
  },
  "2.0": {
    label: "Réponse prospect — qualification de la situation actuelle",
    brief: `Génère exactement **4 scripts** correspondant aux 4 réponses types du prospect :
- "On gère ça en interne / on s'en occupe nous-mêmes" → diagnostic des 3 dimensions (visibilité, temps perdu, rendu pro vs concurrents).
- "On a déjà un prestataire / agence / freelance" → questions ouvertes sur durée d'engagement, montant mensuel, satisfaction réactivité + qualité + ROI.
- "Au cas par cas / avec ce qu'on a" → projection : "quand un prospect cherche votre activité, vous ressortez avant ou après vos concurrents directs ?".
- "On réfléchit à faire évoluer" → 6 axes possibles à présenter : coût, réactivité, qualité du rendu, référencement local, fin d'engagement, délégation totale.

Chaque script reformule la réponse prospect avant de poser sa propre question (asymétrie d'expertise).`,
  },
  "3.0": {
    label: "Questions de qualification — PAIN & KPI",
    brief: `Génère **1 ou 2 scripts** qui déroulent les vraies questions à poser, façon SPIN Selling. Inclus :
- 1 phrase d'ouverture qui rappelle qu'il ne s'agit pas forcément de tout remplacer mais de challenger l'existant.
- 6 à 8 questions concrètes (situation, problème, implication, need-payoff) — phrasées comme à l'oral, courtes.
- 1 question fermée binaire pour tester l'urgence ("Vous avez un enjeu particulier dans les 3 prochains mois ?").
- 1 question de hiérarchisation : "Le plus gros gain pour vous aujourd'hui ce serait plutôt : …".`,
  },
  "4.0": {
    label: "Pitch de réponse adapté — proposition de valeur",
    brief: `Génère **6 à 8 variants**, chacun déclenché par une douleur précise identifiée à l'étape 3.0. Format obligatoire :
- variant : "Si douleur = [douleur concrète]"
- text : 3–5 phrases qui (1) reconnaissent la douleur, (2) la reformulent en irritant business chiffré, (3) montrent comment le client la résout précisément (process, chiffres, garanties).

Couvre au moins ces 6 douleurs : trop de temps perdu sur la technique / produit obsolète ou pas crédible / coût mensuel trop élevé ou engagement long / mauvaise visibilité ou pas de leads entrants / manque de réactivité du prestataire actuel / peur de dépendre d'un nouveau prestataire. Si le contexte client appelle d'autres douleurs spécifiques, ajoute-les.`,
  },
  "5.0": {
    label: "Prise de RDV",
    brief: `Génère 2 à 3 variants de prise de RDV physique ou visio :
- **Standard** : reformulation des points de douleur identifiés + proposition d'un échange court (20–30 min) + mise en avant du sans engagement + question fermée alternative ("matin / après-midi", "début / fin de semaine").
- **Plus directe** : "Le plus simple, ce serait qu'on se bloque …" + question fermée alternative.
- **Orientée référence / projet** : promesse d'une démo + cas clients du secteur + question fermée alternative.

Rajoute aussi une **checklist mentale** (5 points) que le commercial doit avoir validée avant de proposer le RDV (besoin identifié, contexte compris, différence Noxias posée, objection de premier niveau levée, etc.) — sous forme d'un script supplémentaire avec variant "Checklist mentale" et text en bullet points.`,
  },
};

const OBJECTION_CATEGORY_BRIEF: Record<ObjectionCode, { label: string; cues: string[] }> = {
  A: {
    label: "Prestataires actuels / interne",
    cues: [
      `"J'ai déjà un site / un produit similaire."`,
      `"Je passe déjà par quelqu'un / j'ai déjà un prestataire."`,
      `"Je gère ça moi-même / je le fais moi-même."`,
      `"C'est mon neveu / ma fille / un ami qui s'occupe de ça."`,
      `"Je suis déjà engagé avec un autre prestataire."`,
      `"Mon prestataire actuel gère tout, c'est plus simple de rester chez lui."`,
    ],
  },
  B: {
    label: "Budget / coût",
    cues: [
      `"Je n'ai pas le budget."`,
      `"C'est trop cher."`,
      `"On a un budget très serré."`,
      `"Je ne veux pas rajouter une dépense mensuelle."`,
      `"Je préfère investir mon budget ailleurs."`,
      `"On verra plus tard, ce n'est pas le moment."`,
    ],
  },
  C: {
    label: "Temps / priorité",
    cues: [
      `"Je n'ai pas le temps."`,
      `"Ce n'est pas ma priorité."`,
      `"Envoyez-moi un mail / une documentation, je regarderai."`,
      `"Je suis débordé / je n'ai pas la tête à ça."`,
      `"On vient juste de refaire ça."`,
      `"Je n'ai pas les ressources internes pour porter ça."`,
    ],
  },
  D: {
    label: "Confiance / transparence",
    cues: [
      `"J'ai déjà eu une mauvaise expérience avec un prestataire."`,
      `"On m'a déjà promis des résultats, sans suite."`,
      `"J'ai peur d'un prestataire trop commercial ou trop flou."`,
      `"Comment savoir si vous êtes vraiment différents ?"`,
      `"Je ne veux pas dépendre encore plus d'un nouveau prestataire."`,
      `"Je veux pouvoir tout gérer / modifier moi-même."`,
    ],
  },
  E: {
    label: "Besoin / pertinence",
    cues: [
      `"Aujourd'hui, je m'en sors très bien comme ça."`,
      `"Mon activité ne dépend pas de ce produit / je n'en ai pas besoin."`,
      `"Mon bouche-à-oreille me suffit."`,
      `"Je n'ai pas besoin de [feature spécifique]."`,
      `"Mes clients ne regardent pas ça."`,
      `"Je ne suis pas sûr que ça vaille le coup de changer."`,
    ],
  },
};

// -----------------------------------------------------------------------------
// Public API : prompts and schemas per job
// -----------------------------------------------------------------------------

export type JobPrompt = {
  schema: Record<string, unknown>;
  userPrompt: string;
  expert: boolean; // true = on ajoute l'addendum agent commercial expert
  maxTokens: number;
};

export function getJobPrompt(job: Job): JobPrompt {
  switch (job.type) {
    case "positioning":
      return {
        schema: positioningSchema,
        expert: false,
        maxTokens: 12000,
        userPrompt: `Génère la section **positionnement** de la boîte à outils du commercial.

- **intro** : 4 à 6 paragraphes (~ 200–400 mots). Cadre le document, explique l'enjeu réel (au-delà du produit), positionne le client comme partenaire/expert (pas simple fournisseur). Cite les forces concrètes extraites de la matrice.
- **promise** : 1–2 phrases. La promesse centrale.
- **services** : ordre constant des services à présenter dans le discours.
- **targets** : 1 paragraphe sur les cibles à attaquer en priorité.
- **phrases** : exactement 5 punchlines à marteler, courtes.
- **finalAnchor** : 1–2 phrases qui ancrent le positionnement final.
- **irritants** : 4 à 6 questions concrètes que le commercial doit poser pour ouvrir l'échange. Pas de oui/non.
- **valueResult** : 4 à 8 phrases sur le résultat tangible promis sous 30–60 jours.

${COMMON_RULES}`,
      };

    case "personas":
      return {
        schema: personasSchema,
        expert: false,
        maxTokens: 14000,
        userPrompt: `Génère la section **personas** de la boîte à outils. Produis 1 à 3 personas (idéal 2). Chacun :
- **title** : "Persona N : [phrase descriptive]".
- **profile** : 2–3 paragraphes narratifs.
- **kpis** : 1 paragraphe narratif (phrasé fluide, pas de puces).
- **pains** : 2 paragraphes narratifs. Inclus 4–5 objections types entre guillemets dans le 2e paragraphe.
- **motivations** : 1 paragraphe.
- **triggers** : 1 paragraphe.

${COMMON_RULES}`,
      };

    case "arguments":
      return {
        schema: argumentsSchema,
        expert: false,
        maxTokens: 8000,
        userPrompt: `Génère le bloc **arguments massue + disqualification**.
- **disqualified** : 4–6 phrases sur les profils à NE PAS prospecter.
- **killerArguments** : 6 à 8 arguments. Chacun : **headline** entre guillemets typographiques « … » (≤ 18 mots) + **body** 3–5 phrases denses qui expliquent le contexte et le payoff.

${COMMON_RULES}`,
      };

    case "pitch_section": {
      const def = PITCH_USER_BY_ID[job.id];
      return {
        schema: pitchSectionSchema,
        expert: true,
        maxTokens: 10000,
        userPrompt: `Génère **uniquement la section "${job.id} — ${def.label}"** du pitch V1.

Format de sortie (JSON) :
\`\`\`
{ "section": { "id": "${job.id}", "label": "${def.label}", "scripts": [{ "variant": "...", "text": "..." }, ...] } }
\`\`\`

${def.brief}

${COMMON_RULES}`,
      };
    }

    case "objection_category": {
      const def = OBJECTION_CATEGORY_BRIEF[job.code];
      const startId = ({ A: 1, B: 7, C: 13, D: 19, E: 25 } as Record<ObjectionCode, number>)[job.code];
      return {
        schema: objectionCategorySchema,
        expert: true,
        maxTokens: 6000,
        userPrompt: `Génère **uniquement la famille d'objections "${job.code} — ${def.label}"** : EXACTEMENT 6 objections, ids de ${startId} à ${startId + 5}, toutes avec **category = "${job.code}"**.

Pour chaque objection :
- **text** : la phrase du prospect entre guillemets typographiques « … » (≤ 12 mots, naturelle, parlée). Inspire-toi de ces patterns prospects sans les copier mot pour mot :
${def.cues.map((c) => `  - ${c}`).join("\n")}
- **response** : la réponse-type du commercial, 4–7 phrases denses, en italique-friendly. Reconnaît l'objection ("Je comprends", "Je l'entends", "C'est une réaction logique"), reformule en irritant concret, ramène vers la valeur du client. Fais varier les techniques entre les 6 réponses (reformulation, projection cost-of-inaction, comparaison concurrentielle, mini-oui, contre-question, exemple chiffré).

${COMMON_RULES}`,
      };
    }

    case "qualification":
      return {
        schema: qualificationSchema,
        expert: false,
        maxTokens: 8000,
        userPrompt: `Génère la **matrice de qualification (Scoring R1)**.

- **criteria** : EXACTEMENT 5 critères dans cet ordre — Douleur (PAIN), Objectif (GAIN), Budget, Autorité (Décision), Urgence (Déclencheur). Pour chacun, score0/score1/score2 décrivent **avec exemples concrets entre guillemets** ("Mon site n'est plus à jour", "Je paye 200 €/mois et je ne suis pas content").
- **tiers** : EXACTEMENT 3 tiers — "Tier A — Lead chaud" (7 à 10), "Tier B — Lead tiède" (4 à 6), "Tier C — Lead froid" (0 à 3). Pour chacun : description (1–3 phrases) + action (1 phrase).

${COMMON_RULES}`,
      };
  }
}
