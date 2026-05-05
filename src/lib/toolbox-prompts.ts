/**
 * Schéma JSON et prompts pour la génération de la boîte à outils.
 * Calé sur le template Noxias (référence : Boîte à outils du commercial — DigiLocal).
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
        irritants: { type: "array", items: { type: "string" } },
        valueResult: { type: "string" },
      },
      required: ["intro", "promise", "services", "targets", "phrases", "finalAnchor", "irritants", "valueResult"],
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

export const TOOLBOX_USER_PROMPT = `Génère la boîte à outils complète du commercial pour cette mission, en respectant strictement la structure et le ton du template Noxias.

**Méthode obligatoire :**
- Ancré dans la matrice et le contexte fournis ci-dessus. Si une info manque, infère prudemment plutôt que de générer du flou.
- Ton Noxias : direct, premium, posé. Pas de préambule. Pas de "Voici…" ou "Bien sûr…".
- Style narratif pour les blocs de positionnement et les personas (paragraphes denses, 5–10 phrases).
- Listes à puces uniquement pour les phrases à marteler, irritants et objections.

---

**positioning** :
- **intro** : 4 à 6 paragraphes (~ 200–400 mots au total). Ouvre par "Ce document a été conçu pour structurer et piloter les actions de prospection de [Client]…", explique l'enjeu réel (au-delà de la vente du produit), positionne le client comme partenaire/expert (pas comme simple fournisseur), enchaîne sur ce que le commercial trouvera dans la boîte. Réfère explicitement aux forces concrètes du client extraites de la matrice.
- **promise** : 1–2 phrases. La promesse centrale du client.
- **services** : ordre constant des services à présenter dans le discours. Liste séparée par des virgules ou puces, dans l'ordre de pertinence.
- **targets** : 1 paragraphe identifiant les cibles à attaquer en priorité (corps de cible, super-cible, cibles secondaires).
- **phrases** : exactement 5 phrases courtes à marteler. Chacune entre guillemets dans la sortie.
- **finalAnchor** : 1–2 phrases qui ancrent le positionnement définitif (« Le client ne vend pas X. Il prend en charge Y. »).
- **irritants** : 4 à 6 questions concrètes que le commercial doit poser pour ouvrir l'échange (« Comment gérez-vous aujourd'hui … ? », « Que se passe-t-il quand … ? »). Pas de questions fermées oui/non.
- **valueResult** : 4 à 8 phrases sur le résultat tangible promis sous 30–60 jours.

---

**personas** : produis 1 à 3 personas (idéal 2). Chacun :
- **title** : "Persona 1 : [phrase descriptive]" (ex. "Persona 1 : Le dirigeant de TPE/PME locale qui veut un site vitrine professionnel sans gérer la technique").
- **profile** : 2–3 paragraphes narratifs sur qui est ce persona, son contexte, ce qu'il cherche vraiment (au-delà du produit).
- **kpis** : 1 paragraphe narratif listant les indicateurs qu'il regarde (sans liste à puces — phrasé fluide).
- **pains** : 2 paragraphes narratifs. Le quotidien et l'irritant principal en formulations spontanées (« il sait que… mais il n'a ni le temps… »). Inclus 4–5 objections types entre guillemets dans le 2e paragraphe.
- **motivations** : 1 paragraphe narratif sur ce qui le pousse à avancer.
- **triggers** : 1 paragraphe narratif sur les moments où le sujet devient prioritaire.

---

**disqualified** : 4–6 phrases sur les profils à NE PAS prospecter (anti-cible).

---

**killerArguments** : 6 à 8 arguments massue. Chacun :
- **headline** : la phrase à dire au prospect, **entre guillemets typographiques « … »**, courte et percutante.
- **body** : 3–5 phrases denses qui expliquent le contexte et le payoff de l'argument.

---

**pitch** : EXACTEMENT 5 sections, ids dans cet ordre :
- **"1.0"** — "Si barrage / accueil" — 3–5 scripts variants : standard, "C'est pour quoi ?", "il/elle n'est pas dispo", "demande de précision".
- **"1.1"** — "Brise-glace / prise de contact avec le décideur" — 3–4 variants : standard, plus directe, plus impactante, + scripts pour gérer "on a déjà…", "encore un prestataire ?", "vous faites quoi exactement ?". **Inclus impérativement la mention d'un cas client réel** (nom, secteur, résultat chiffré ou anecdote) extrait de la question 31 de la matrice — pour crédibiliser dès la prise de contact.
- **"2.0"** — "Réponse prospect — qualification de la situation actuelle" — 4 scripts pour chaque réponse type du prospect ("on gère en interne", "on a déjà un prestataire", "au cas par cas", "on réfléchit à faire évoluer").
- **"3.0"** — "Questions de qualification — PAIN & KPI" — 1–2 scripts qui déroulent les vraies questions à poser (priorité actuelle, état du site/produit, coût actuel, engagement, satisfaction, etc. — adapté au métier).
- **"4.0"** — "Pitch de réponse adapté — proposition de valeur" — **6 à 8 variants**, chacun déclenché par une douleur précise (variant = "Si douleur = …", text = la réplique commerciale).
- **"5.0"** — "Prise de RDV" — 2–3 variants (formulation standard, version plus directe, version orientée référence/projet) + une checklist mentale.

Le texte de chaque script est rédigé comme une réplique commerciale **prête à dire à voix haute**, en italique-friendly (le frontend rendra). Format : "Commercial : « … »" ou simplement la phrase entre guillemets.

---

**objections** : EXACTEMENT 30 objections, ids 1 à 30, **6 par catégorie** :
- **A** — Prestataires actuels / interne (objections type "j'ai déjà…", "je passe par…", "je gère moi-même", "mon ami / fille / neveu s'en occupe", "je suis engagé", "rester chez le prestataire actuel c'est plus simple").
- **B** — Budget / coût ("pas le budget", "trop cher", "budget serré", "pas de dépense mensuelle en plus", "investir ailleurs", "plus tard").
- **C** — Temps / priorité ("pas le temps", "pas la priorité", "envoyez un mail", "débordé", "on vient juste de le faire", "pas de ressources internes").
- **D** — Confiance / transparence ("mauvaise expérience prestataire", "promesse non tenue", "trop commercial", "comment savoir si différent", "ne pas dépendre", "garder la main").
- **E** — Besoin / pertinence ("je m'en sors", "pas besoin du produit", "bouche-à-oreille suffit", "pas besoin de référencement / X", "mes clients ne regardent pas", "pas sûr que ça vaille le coup").

Pour chaque objection :
- **text** : la phrase du prospect entre guillemets typographiques « … » (≤ 12 mots, naturelle).
- **response** : la réponse-type, 4–7 phrases denses, en italique-friendly. Reconnaît l'objection ("Je comprends", "Je l'entends", "C'est une réaction logique"), reformule en irritant concret, ramène vers la valeur du client.

---

**qualification** :
- **criteria** : EXACTEMENT 5 critères dans cet ordre — Douleur (PAIN), Objectif (GAIN), Budget, Autorité (Décision), Urgence (Déclencheur). Pour chacun, score0/score1/score2 décrivent **avec exemples concrets entre guillemets** (« Mon site n'est plus à jour », « Je paye 200 €/mois et je ne suis pas content »).
- **tiers** : EXACTEMENT 3 tiers — "Tier A — Lead chaud" (7 à 10), "Tier B — Lead tiède" (4 à 6), "Tier C — Lead froid" (0 à 3). Pour chacun, description (1–3 phrases) + action (1 phrase).

---

CONTRAINTES FINALES :
- JSON strict conforme au schéma. Pas de markdown autour, pas de commentaire.
- Aucune mention "TODO", "à compléter", "à définir".
- Cohérence transverse : le persona doit coller à la cible, le pitch doit utiliser les phrases à marteler, les objections doivent reprendre les formulations spontanées du persona.`;
