/**
 * 30 questions de la matrice de prospection — structure issue de la VDEF Bowigo.
 * Réutilisable pour n'importe quel client.
 */

export type MatrixQuestion = {
  id: number;
  category: string;
  question: string;
  hint?: string;
};

export const MATRIX_QUESTIONS: MatrixQuestion[] = [
  { id: 1, category: "1. Objectifs de la prospection", question: "Quels sont vos objectifs principaux ?", hint: "Acquisition / Activation / Conversion / Rétention" },
  { id: 2, category: "2. Cible(s) prioritaire(s)", question: "Quel est votre public cible ?", hint: "Secteur, taille, typologie de projet" },
  { id: 3, category: "2.1 L'anti-cible (disqualification)", question: "Qui NE FAUT-IL PAS prospecter ?" },
  { id: 4, category: "2.2 Zoom persona — KPI", question: "Quels KPI impactent ce décideur ?" },
  { id: 5, category: "2.3 Zoom persona — Priorités 6-12 mois", question: "Quelles sont leurs priorités à 6-12 mois ?" },
  { id: 6, category: "2.4 Zoom persona — Douleurs", question: "À quelles douleurs notre offre répond ?" },
  { id: 7, category: "2.5 Zoom persona — Motivations positives", question: "Qu'est-ce qui déclenche une décision ?" },
  { id: 8, category: "2.6 Zoom persona — Cercle d'influence", question: "Qui influence dans la décision ?" },
  { id: 9, category: "2.7 Zoom persona — Coût d'inaction à 3 mois", question: "Que se passe-t-il s'ils ne font rien ?" },
  { id: 10, category: "2.8 Zoom persona — Freins internes / Budget", question: "Quels freins et budgets ?" },
  { id: 11, category: "2.9 Traitement des objections", question: "Que répondent-ils pour dire non ?" },
  { id: 12, category: "2.10 Arguments massue (Killer Arguments)", question: "Les phrases qui font mouche ?" },
  { id: 13, category: "2.11 Zoom persona — Déclencheur", question: "Quels événements précèdent un achat ?" },
  { id: 14, category: "2.12 Moment de vérité (Time-to-Value)", question: "L'instant précis où ils sont convaincus ?" },
  { id: 15, category: "3. Offre(s) / produits / services", question: "Quels services promouvoir ?" },
  { id: 16, category: "4. Proposition de valeur", question: "Quelle est votre valeur unique ?" },
  { id: 17, category: "4.1 Promesse en une phrase", question: "Promesse principale ?" },
  { id: 18, category: "4.2 Valeur tangible livrée 30-60j", question: "Résultat concret promis ?" },
  { id: 19, category: "4.3 Différenciation concurrentielle", question: "Différenciateurs clés ?" },
  { id: 20, category: "5. Canaux d'acquisition marketing", question: "Où trouver votre cible ?" },
  { id: 21, category: "6. Personnalisation du message", question: "Quelle info clé mettre en avant ?" },
  { id: 22, category: "6.1 Angles de message", question: "Messages à marteler ?" },
  { id: 23, category: "6.2 Objections courantes (vente)", question: "Objections visibles à l'acquisition ?" },
  { id: 24, category: "7. Défis et pain points", question: "Alternatives / concurrents perçus ?" },
  { id: 25, category: "8. Mesure", question: "Qu'est-ce qu'on mesure ?" },
  { id: 26, category: "9. KPIs de succès (monitoring)", question: "De quoi a-t-on besoin ?" },
  { id: 27, category: "10. Ressources & support", question: "L'accroche finale ?" },
  { id: 28, category: "11. L'offre irrésistible (Hook)", question: "Positionnement global ?" },
  { id: 29, category: "12. Historique / contexte", question: "Priorités de prospection ?" },
  { id: 30, category: "13. Cible(s) secondaire(s)", question: "Cibles secondaires & règles d'ouverture ?" },
  { id: 31, category: "14. Cas clients & références", question: "Quels cas clients mobiliser pour rassurer en intro de pitch ?", hint: "3 à 5 cas concrets : nom du client, secteur, résultat chiffré ou anecdote utilisable. Sert à crédibiliser dès la prise de contact." },
];

export const CATEGORY_GROUPS: { label: string; ids: number[] }[] = [
  { label: "Objectifs & cibles", ids: [1, 2, 3] },
  { label: "Persona & douleurs", ids: [4, 5, 6, 7, 8, 9, 10] },
  { label: "Argumentation", ids: [11, 12, 13, 14] },
  { label: "Offre & valeur", ids: [15, 16, 17, 18, 19] },
  { label: "Canaux & messages", ids: [20, 21, 22, 23] },
  { label: "Concurrence & mesure", ids: [24, 25, 26] },
  { label: "Positionnement", ids: [27, 28, 29, 30] },
  { label: "Références", ids: [31] },
];
