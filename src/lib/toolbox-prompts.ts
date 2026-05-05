/**
 * Schéma JSON et prompts pour la génération de la boîte à outils.
 * Calqué sur la VDEF Bowigo : positionnement, 1 à 3 personas,
 * argumentaires, pitch V1 (5 sections), 30 objections, matrice de qualification.
 */

export const TOOLBOX_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    positioning: {
      type: "object",
      additionalProperties: false,
      properties: {
        intro: { type: "string" },
        promise: { type: "string" },
        services: { type: "string" },
        targets: { type: "string" },
        phrases: { type: "array", items: { type: "string" } },
        finalAnchor: { type: "string" },
      },
      required: ["intro", "promise", "services", "targets", "phrases", "finalAnchor"],
    },
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
    disqualified: { type: "string" },
    killerArguments: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          headline: { type: "string" },
          body: { type: "string" },
        },
        required: ["headline", "body"],
      },
    },
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
              properties: {
                variant: { type: "string" },
                text: { type: "string" },
              },
              required: ["variant", "text"],
            },
          },
        },
        required: ["id", "label", "scripts"],
      },
    },
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
  required: ["positioning", "personas", "disqualified", "killerArguments", "pitch", "objections", "qualification"],
} as const;

export const TOOLBOX_USER_PROMPT = `Génère la boîte à outils complète du commercial pour cette mission, en t'appuyant strictement sur la matrice et le contexte ci-dessus.

Exigences précises :

1. **positioning** :
   - intro : 5–8 phrases de cadrage (qui est l'entreprise, pour qui, à quoi elle sert vraiment, ce qu'elle n'est PAS).
   - promise : 1–2 phrases — la promesse centrale.
   - services : ordre constant des services à présenter.
   - targets : cibles à attaquer en priorité.
   - phrases : 5 punchlines à marteler.
   - finalAnchor : 1 phrase de positionnement final.

2. **personas** : produis 1 à 3 personas (max 3). Pour chacun : title, profile (paragraphe), kpis, pains, motivations, triggers — chacun en 3–6 phrases denses.

3. **disqualified** : profils à NE PAS prospecter, 4–6 phrases.

4. **killerArguments** : 6 à 8 arguments massue. Pour chacun : headline (citation entre guillemets) + body (3–5 phrases d'explication).

5. **pitch** : 5 sections OBLIGATOIRES, ids exactement "1.0", "1.1", "2.0", "3.0", "4.0", "5.0" :
   - 1.0 — "Si barrage / accueil"
   - 1.1 — "Brise-glace / prise de contact décideur"
   - 2.0 — "Qualification de la situation actuelle"
   - 3.0 — "Questions de qualification — PAIN & KPI"
   - 4.0 — "Pitch de réponse adapté — proposition de valeur"
   - 5.0 — "Prise de RDV — visio"
   Chaque section a 2 à 4 scripts (variant = nom de variante, text = script à dire en direct, sous forme de réplique commerciale).

6. **objections** : EXACTEMENT 30 objections, ids 1 à 30, réparties dans les 5 catégories :
   - A (Partenaires actuels / interne) : 6 objections
   - B (Budget / coût) : 6 objections
   - C (Temps / priorité) : 6 objections
   - D (Confiance / transparence) : 6 objections
   - E (Besoin / pertinence) : 6 objections
   Chaque objection a text (la phrase du prospect, entre guillemets) + response (la réponse type, 4–6 phrases).

7. **qualification** :
   - criteria : 5 critères dans cet ordre — Douleur (PAIN), Objectif (GAIN), Budget, Autorité, Urgence. Pour chacun, score0/score1/score2 décrivent le niveau (faible/moyen/élevé) avec exemples concrets.
   - tiers : 3 tiers — "Tier A — Lead chaud" (7-10), "Tier B — Lead tiède" (4-6), "Tier C — Lead froid" (0-3), avec description + action.

CONTRAINTES :
- Réponse en JSON strict conforme au schéma. Pas de markdown autour.
- Aucune mention "TODO" ou "à compléter". Si le contexte est mince, infère prudemment plutôt que de laisser vide.
- Pas de phrases creuses ("optimiser la performance"). Chaque phrase doit être actionnable.`;
