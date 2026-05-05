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

## Setup complet

### 1. Supabase (5 min)

1. Crée un projet gratuit sur [supabase.com](https://supabase.com).
2. **SQL Editor** → New query → colle le contenu de [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) → Run.
3. **Authentication → Providers → Email** :
   - `Enable Email provider` ✅
   - `Confirm email` ✅
   - `Allow new users to sign up` ❌ (désactivé : seul l'admin invite)
4. **Authentication → URL Configuration** :
   - `Site URL` = ton URL prod (ex. `https://prospection.noxias.com`)
   - `Redirect URLs` = ajoute `http://localhost:3000/auth/callback` et `https://<ton-domaine>/auth/callback`
5. **Authentication → Users → Invite user** : invite tes collaborateurs un par un.
6. **Project Settings → API** : récupère `URL` et `anon public key`.

### 2. Anthropic

Récupère une clé API sur [console.anthropic.com](https://console.anthropic.com).

### 3. Local

```bash
npm install
cp .env.example .env.local
# → colle ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

L'app tourne sur http://localhost:3000. La première visite te redirige sur `/login`. Renseigne ton email Noxias, clique le lien magique reçu, tu es dans l'app.

## Variables d'environnement

| Variable | Requis | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Clé API Anthropic |
| `ANTHROPIC_MODEL` | optionnel | Default : `claude-opus-4-7`. `claude-sonnet-4-6` pour ~3× moins cher. |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | Clé publishable Supabase (nouveau format `sb_publishable_…`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optionnel | Ancien format JWT, accepté en fallback si la publishable n'est pas définie |
| `NEXT_PUBLIC_APP_URL` | optionnel | URL publique de l'app |

## Modèle d'auth & permissions

- **Magic link** par email. Aucun mot de passe.
- **Workspace partagé** : tous les utilisateurs invités voient et éditent toutes les missions. Idéal pour une équipe Noxias unique.
- **Signups désactivés** côté Supabase : impossible de s'inscrire sans invitation préalable d'un admin.
- **RLS active** sur la table `missions` : seuls les utilisateurs authentifiés peuvent lire/écrire (les requêtes anonymes sont rejetées au niveau base de données, pas seulement applicatif).
- **Middleware** : tout chemin (sauf `/login`, `/auth/*`) exige une session. Les routes API renvoient `401 JSON` si non authentifié, les routes UI redirigent vers `/login`.

## Inviter un nouveau membre de l'équipe

1. Supabase Dashboard → Authentication → Users → Invite user → email.
2. Le membre reçoit un email d'invitation.
3. Au clic, il atterrit sur `/login`, retape son email pour recevoir le magic link, et accède à l'app.

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

La charte Noxias est encapsulée dans `src/app/globals.css` :

```css
:root {
  --noxias-ink: 216 100% 6%;        /* #000c1e */
  --noxias-deep: 261 33% 15%;       /* #221932 */
  --noxias-paper: 0 0% 100%;        /* #ffffff */
  --noxias-accent: 146 56% 51%;     /* #3cc879 */
  --noxias-muted: 220 12% 45%;
}
```

Font : **Ubuntu** (Google Fonts) chargée dans `src/app/layout.tsx`.

Logo : recréé en SVG dans `src/components/branding/Logo.tsx` (wordmark
"noxias" + triangle vert ▶ entre le `a` et le `s`). Pour utiliser l'asset
officiel, déposer le SVG dans `public/brand/logo.svg` et le remplacer dans
`Logo.tsx` par un composant `next/image`.

## Coûts IA estimés

- **Matrice — IA assist par question** : ~0,5–2 ¢ par appel (avec prompt caching après le premier).
- **Génération de la boîte à outils** : ~5–15 ¢ par génération (output ~10–20K tokens).

Le prompt système Noxias et le contexte mission sont mis en cache (TTL 5 min). Les appels IA pour la même mission dans la même session bénéficient d'un coût d'input ~10× réduit.


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
