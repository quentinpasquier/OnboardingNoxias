# Noxias — Prospection Builder

Outil web pour co-construire avec un client deux livrables de prospection :

1. **Matrice de prospection** (30 questions structurées : cible, douleurs, valeur, canaux, KPI…)
2. **Boîte à outils du commercial** (positionnement, personas, argumentaires, pitch V1 ramifié, 30 objections classées, matrice de qualification)

L'IA propose, le collaborateur Noxias arbitre, le client valide.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS**
- **Anthropic SDK** (Claude Opus 4.7, adaptive thinking, prompt caching, structured outputs)
- Stockage V1 : **localStorage** (un seul collaborateur, N missions client)
- Export : Markdown, **DOCX** (via `docx`), PDF (via la vue imprimable du navigateur)
- PDF parsing serveur : `pdf-parse`
- Web scraping serveur : `fetch` natif

## Démarrer en local

```bash
# 1. Installer les dépendances
npm install

# 2. Renseigner les variables d'environnement
cp .env.example .env.local
# → ouvre .env.local et colle ta clé ANTHROPIC_API_KEY

# 3. Lancer le serveur de dev
npm run dev
```

L'app tourne sur http://localhost:3000.

## Variables d'environnement

| Variable | Requis | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Clé API Anthropic ([console.anthropic.com](https://console.anthropic.com)) |
| `ANTHROPIC_MODEL` | optionnel | Default : `claude-opus-4-7`. Pour réduire le coût, utiliser `claude-sonnet-4-6`. |
| `NEXT_PUBLIC_APP_URL` | optionnel | URL publique de l'app (utile en prod). |

Pour V1, **aucune base de données** n'est nécessaire — tout vit dans le localStorage du navigateur du collaborateur.

## Architecture

```
src/
├─ app/
│  ├─ page.tsx                          → Dashboard missions
│  ├─ missions/[id]/page.tsx            → Mission (4 onglets)
│  ├─ missions/[id]/print/page.tsx      → Vue imprimable PDF
│  └─ api/
│     ├─ ai/matrix-assist               → Génère / affine 1 réponse
│     ├─ ai/generate-toolbox            → Génère la boîte à outils complète
│     ├─ extract-pdf                    → Extrait le texte d'un PDF
│     ├─ scrape-website                 → Aspire le contenu d'une URL
│     └─ export/docx                    → Génère le DOCX final
├─ components/
│  ├─ Dashboard.tsx, MissionWorkspace.tsx
│  ├─ panels/ContextPanel, MatrixPanel, ToolboxPanel, ExportPanel
│  └─ ui/ (button, card, dialog, tabs, …)
└─ lib/
   ├─ anthropic.ts                      → Client + system prompt + caching
   ├─ matrix-questions.ts               → Les 30 questions
   ├─ toolbox-schema.ts                 → Types et structure de la boîte
   ├─ toolbox-prompts.ts                → JSON Schema + prompt de génération
   ├─ mission-context.ts                → Construit le contexte envoyé à l'IA
   ├─ exporters.ts                      → Markdown
   └─ storage.ts                        → localStorage abstraction
```

## Flux d'utilisation

1. **Créer une mission** depuis le dashboard (nom du client + URL optionnelle).
2. **Onglet Contexte** : importer PDFs (brief, plaquette), aspirer le site web, coller des notes.
3. **Onglet Matrice** : pour chaque question, soit le collaborateur tape directement avec le client, soit il clique « ✨ IA » pour proposer une réponse à partir des sources, qu'il édite ensuite.
4. **Onglet Boîte à outils** : une fois la matrice ≈ 80% remplie, générer la boîte. Tout est éditable, et un bouton « Régénérer » avec instructions ciblées permet d'affiner.
5. **Onglet Export** : Markdown, DOCX (Word), PDF (vue imprimable + navigateur).

## Branding

Le branding Noxias est encapsulé dans des variables CSS (`src/app/globals.css`) :

```css
:root {
  --noxias-ink: 220 35% 9%;
  --noxias-paper: 36 33% 97%;
  --noxias-accent: 28 60% 55%;
  --noxias-muted: 220 12% 45%;
}
```

Pour appliquer la vraie identité Noxias :
- Remplacer ces 4 valeurs HSL par les couleurs de la charte.
- Remplacer le logo SVG dans `src/components/branding/Logo.tsx`.
- Adapter les fonts dans `src/app/layout.tsx` (actuellement Inter + Fraunces).

## Coûts IA estimés

- **Matrice — IA assist par question** : ~0,5–2 ¢ par appel (avec prompt caching après le premier).
- **Génération de la boîte à outils** : ~5–15 ¢ par génération (output ~10–20K tokens).

Le prompt système Noxias et le contexte mission sont mis en cache (TTL 5 min). Les appels IA pour la même mission dans la même session bénéficient d'un coût d'input ~10× réduit.

## Migration vers Supabase (V2)

Le V1 utilise localStorage : simple, zéro config, mais limité à un navigateur. Pour passer multi-utilisateurs / multi-appareils :

1. Créer un projet [Supabase](https://supabase.com), récupérer URL + anon key.
2. Ajouter une table `missions` :

   ```sql
   create table missions (
     id uuid primary key default gen_random_uuid(),
     user_id uuid references auth.users not null,
     client_name text not null,
     client_website text,
     notes text,
     files jsonb default '[]'::jsonb,
     matrix jsonb default '{}'::jsonb,
     toolbox jsonb,
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );
   alter table missions enable row level security;
   create policy "users see own missions" on missions for all using (auth.uid() = user_id);
   ```

3. Remplacer `src/lib/storage.ts` par un client Supabase :

   ```ts
   import { createBrowserClient } from "@supabase/ssr";
   const supabase = createBrowserClient(URL, ANON_KEY);
   // implémenter list, get, upsert, remove via supabase.from("missions").{select,upsert,delete}
   ```

4. Ajouter une page `/login` avec magic link (`supabase.auth.signInWithOtp`).
5. Wrapper le layout avec un middleware Supabase qui redirige vers `/login` si pas auth.

L'API IA et l'UI restent inchangées — seule la couche storage change.

## Déploiement (Vercel)

```bash
# 1. Push sur GitHub
git push

# 2. Importer le repo dans Vercel
# 3. Ajouter ANTHROPIC_API_KEY dans Settings → Environment Variables
# 4. Deploy
```

Pour limiter l'accès en preview, activer Password Protection dans Vercel ou ajouter Basic Auth via middleware.

## TODO V2 (idées)

- Auth + multi-collaborateurs (Supabase magic link)
- Partage en lecture seule au client (lien token)
- Versioning de la boîte à outils (historique des régénérations)
- Mode "simulateur d'appel" pour entraîner les commerciaux sur le pitch V1
- Quiz de validation par section (matrice & boîte) — le mode onboarding interne d'origine
- Intégration CRM (Pipedrive / HubSpot) pour pousser les leads qualifiés
