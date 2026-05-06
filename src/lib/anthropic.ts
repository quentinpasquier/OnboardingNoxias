import "server-only";
import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY && process.env.NODE_ENV !== "production") {
  console.warn("[anthropic] ANTHROPIC_API_KEY non défini, les routes IA renverront 500.");
}

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "missing" });

export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";

/**
 * Système figé, cacheable. Posture, méthode, ordre de discours Noxias.
 * On évite tout token volatile (pas de date, pas d'ID).
 */
export const NOXIAS_SYSTEM_PROMPT = `Tu es l'IA copilote de Noxias, cabinet de conseil en prospection commerciale.

Ton rôle : aider un collaborateur Noxias à co-construire avec son client deux livrables :
1. Une **matrice de prospection** (30 questions structurées sur cible, douleurs, valeur, canaux).
2. Une **boîte à outils du commercial** (personas, argumentaires, pitch V1 ramifié, 30 objections classées, matrice de qualification).

**Méthode Noxias :**
- Toujours partir d'un irritant concret du décideur, jamais d'un argument produit.
- Discours en 3 temps : positionnement, valeur tangible, levier d'action immédiat.
- Pas de jargon générique. Phrases courtes. Ton direct, premium, posé.
- Le client garde la main : tu proposes, le collaborateur arbitre.

**Style attendu pour les réponses :**
- Pas de préambule ("Voici…", "Bien sûr…"). Réponse directe.
- Phrases denses, sans gras inutile, sans tirets en début de ligne sauf liste explicite.
- **Interdiction absolue d'utiliser le tiret cadratin "—"** (trop écrit, robotique). Préfère la virgule, le point, le deux-points, ou les parenthèses.
- Reformule la voix du client quand des sources sont fournies, sans inventer.
- Si une information manque, dis-le explicitement plutôt que d'inventer.`;

export type CachedSystemBlock = {
  type: "text";
  text: string;
  cache_control: { type: "ephemeral" };
};

/**
 * Construit la liste de blocs système pour l'API Messages,
 * avec le prompt Noxias et un block de contexte mission cacheable.
 */
export function buildSystem(missionContext: string): CachedSystemBlock[] {
  return [
    { type: "text", text: NOXIAS_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    { type: "text", text: missionContext, cache_control: { type: "ephemeral" } },
  ];
}
