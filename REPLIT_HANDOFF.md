# Daylora - Replit Handoff

Ce fichier sert de référence rapide pour remettre le projet Daylora en place sur Replit après un push, sans perdre l'alignement produit ni les réglages attendus.

## Objectif

Daylora est une plateforme SaaS de sites d'événements / mariage.

Le but n'est pas de refaire le produit.
Le but est de garder l'existant stable, lisible et cohérent, en respectant les règles métier déjà en place.

## Stack

- Monorepo npm workspaces
- API Express + TypeScript
- Front admin/public en React + Vite
- PostgreSQL Neon
- Drizzle ORM
- Sessions Express
- Stripe

## Commandes utiles

À la racine :

```bash
npm install
npm run dev
```

Production / déploiement :

```bash
npm run build
npm run start
```

Vérification :

```bash
npm run check
```

Note :
- le repo contient encore quelques erreurs TypeScript historiques sur certaines zones anciennes
- ne pas considérer `npm run check` comme parfaitement vert sur tout le projet tant qu'un nettoyage global n'a pas été fait

## Variables d'environnement minimales

À configurer sur Replit :

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=...
APP_BASE_URL=https://daylora.app
MARKETING_BASE_URL=https://daylora.app
SESSION_STORE=db
NODE_ENV=production
```

Variables Stripe si utilisées :

```env
STRIPE_SECRET_KEY=...
VITE_STRIPE_PUBLIC_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_SUBSCRIPTION=...
STRIPE_PRICE_LIFETIME=...
```

Support :

```env
SUPER_ADMIN_EMAIL=admin@daylora.app
```

Important :
- pour le support onboarding, ne pas remettre WhatsApp pour l'instant
- utiliser `help@daylora.app`
- le support interne principal est intégré dans l'app

## Replit

Le repo contient déjà :

- [`.replit`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/.replit)
- [`replit.md`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/replit.md)

Points à conserver :

- `run = "npm run dev"`
- build production via `npm run build`
- run production via `npm run start`
- port app principal servi côté Replit

## Règles produit à respecter

### Premium

Certaines actions doivent rester Premium.
Ne pas les rendre accessibles au plan gratuit.

À conserver :

- multi-site : Premium uniquement
- templates `Modern` et `Minimal` : Premium uniquement
- template `Avant-Garde` : Premium uniquement
- invités illimités : Premium uniquement
- cadeaux illimités : Premium uniquement
- blagues live : Premium uniquement

Limites actuelles :

- free :
  - `maxSites = 1`
  - `maxRsvp = 10`
  - `maxGifts = 2`
- premium :
  - `maxSites = Infinity`
  - `maxRsvp = Infinity`
  - `maxGifts = Infinity`

Source :
- [`packages/shared/schema.ts`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/packages/shared/schema.ts)

### Support

Il existe deux systèmes d'aide distincts :

1. support interne dans l'app
- chatbot + conversations admin
- temps réel via SSE
- bouton `Assistance` dans l'espace connecté
- conversations visibles côté `/admin/conversations`

2. mini assistant onboarding
- email `help@daylora.app`
- pas de WhatsApp pour l'instant
- petit assistant local + lien mail

Ne pas réintroduire WhatsApp sans décision explicite.

### SEO

Le SEO a été renforcé récemment.

À conserver :

- landing orientée requêtes `site de mariage`, `invitation mariage`, `RSVP mariage`
- `canonical`, `robots`, Open Graph, Twitter cards
- JSON-LD global dans `index.html`
- injection SEO serveur sur les vrais sites publiés
- `robots.txt`
- `sitemap.xml`
- `noindex` sur `preview`, `admin`, `login`, `signup`, `dashboard`

Fichiers clés :

- [`apps/app/client/index.html`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/app/client/index.html)
- [`apps/app/client/src/pages/LandingPage.tsx`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/app/client/src/pages/LandingPage.tsx)
- [`apps/api/index.ts`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/api/index.ts)

### Langues

Langues actuellement branchées :

- français
- anglais

Le switcher admin est visible dans le bloc profil / bas de sidebar.
Dans `Design`, la langue du site reste aussi modifiable.

Les traductions centralisées sont dans :

- [`apps/app/client/src/lib/nls_fr.ts`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/app/client/src/lib/nls_fr.ts)
- [`apps/app/client/src/lib/nls_en.ts`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/app/client/src/lib/nls_en.ts)
- [`apps/app/client/src/lib/nls.ts`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/app/client/src/lib/nls.ts)

Ne pas disperser de nouveaux textes traduits si possible.

### UX

À respecter :

- vocabulaire simple
- éviter le jargon inutile
- éviter les doublons de configuration
- garder le backoffice lisible
- vérifier à chaque modif que le `Centre d'aide` reste aligné avec l'interface réelle
- ne pas laisser de sections invitation dans `Design` si elles ne concernent pas le site public
- quand une zone est vide côté preview, éviter d'afficher un grand bloc blanc inutile
- préférer de vrais composants UI stylés plutôt que les `select` natifs

### Organisation

Une nouvelle couche `Organisation` a été ajoutée au produit, sans toucher au coeur public du site.

Modules attendus :

- `Checklist`
- `Planning`
- `Budget`
- `Dashboard` enrichi avec progression globale

Principe produit :

- `Checklist` = quoi faire
- `Planning` = quand le faire
- `Budget` = combien ça coûte
- `Dashboard` = où en est l'organisation

Ces modules doivent rester :

- simples
- premium
- mobile-friendly
- centrés sur l'organisation, pas sur du social

Important :

- ne pas remettre ces données dans `weddings.config`
- garder des tables dédiées
- garder le calcul du score de progression côté API / service

Tables ajoutées :

- `organization_checklist_categories`
- `organization_checklist_items`
- `organization_planning_items`
- `organization_budget_categories`
- `organization_budget_items`

Fichiers clés :

- [`packages/shared/schema.ts`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/packages/shared/schema.ts)
- [`apps/api/storage.ts`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/api/storage.ts)
- [`apps/api/routes.ts`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/api/routes.ts)
- [`apps/api/organization-service.ts`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/api/organization-service.ts)
- [`apps/app/client/src/pages/admin/ChecklistPage.tsx`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/app/client/src/pages/admin/ChecklistPage.tsx)
- [`apps/app/client/src/pages/admin/PlanningPage.tsx`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/app/client/src/pages/admin/PlanningPage.tsx)
- [`apps/app/client/src/pages/admin/BudgetPage.tsx`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/app/client/src/pages/admin/BudgetPage.tsx)
- [`apps/app/client/src/pages/admin/DashboardPage.tsx`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/app/client/src/pages/admin/DashboardPage.tsx)
- [`apps/app/client/src/hooks/use-api.ts`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/app/client/src/hooks/use-api.ts)
- [`apps/app/client/src/layouts/AdminLayout.tsx`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/app/client/src/layouts/AdminLayout.tsx)

Routes API ajoutées :

- `GET /api/organization/checklist`
- `POST /api/organization/checklist/categories`
- `PATCH /api/organization/checklist/categories/:id`
- `DELETE /api/organization/checklist/categories/:id`
- `POST /api/organization/checklist/items`
- `PATCH /api/organization/checklist/items/:id`
- `DELETE /api/organization/checklist/items/:id`
- `GET /api/organization/planning`
- `POST /api/organization/planning/items`
- `PATCH /api/organization/planning/items/:id`
- `DELETE /api/organization/planning/items/:id`
- `GET /api/organization/budget`
- `POST /api/organization/budget/categories`
- `PATCH /api/organization/budget/categories/:id`
- `DELETE /api/organization/budget/categories/:id`
- `POST /api/organization/budget/items`
- `PATCH /api/organization/budget/items/:id`
- `DELETE /api/organization/budget/items/:id`
- `GET /api/organization/progress`

Comportements à conserver :

- la checklist par défaut se génère automatiquement
- les catégories budget par défaut se génèrent automatiquement
- le planning peut démarrer vide, avec suggestions
- le dashboard affiche un score global + prochaines actions
- les écrans `Checklist`, `Planning` et `Budget` ont reçu une deuxième passe UX plus premium

## Fonctions sensibles déjà en place

### Suppression de site

Fonction disponible depuis `Paramètres`.

Elle supprime :

- le site
- les invités
- les cadeaux
- la cagnotte liée
- les logs et données liées

Fichiers :

- [`apps/api/storage.ts`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/api/storage.ts)
- [`apps/api/routes.ts`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/api/routes.ts)
- [`apps/app/client/src/pages/admin/SettingsPage.tsx`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/app/client/src/pages/admin/SettingsPage.tsx)

### Suppression de compte

Fonction disponible depuis `Paramètres`.

Elle :

- demande une raison
- permet un commentaire libre
- supprime le compte
- supprime aussi tous les sites possédés par le compte

Fichiers :

- [`apps/api/auth-routes.ts`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/api/auth-routes.ts)
- [`apps/api/storage.ts`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/api/storage.ts)
- [`apps/app/client/src/pages/admin/SettingsPage.tsx`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/app/client/src/pages/admin/SettingsPage.tsx)

### Multi-site premium

Le multi-site est géré dans `Paramètres > Mes sites` et aussi depuis le switcher de site du header admin.

À conserver :

- 1 site max pour un compte gratuit
- création de sites supplémentaires seulement si premium
- dans le header admin, l'entrée `Nouveau site` doit ouvrir une modale
- l'adresse du site doit se générer automatiquement depuis le nom

## Comptes de test utiles

Si besoin de seed manuel :

- user standard :
  - `amy@daylora.local`
- super admin :
  - `admin@daylora.local`
- user premium :
  - `amy@daylora.premium`

Identifiants locaux connus :

- `amy@daylora.local` / `DayloraTest123!`
- `admin@daylora.local` / `DayloraAdmin123!`
- `amy@daylora.premium` / `DayloraPremium123!`

Ces comptes peuvent exister en local, mais ne doivent pas être supposés présents sur un nouvel environnement.

## Templates

Templates actuellement attendus dans le produit :

- `classic`
- `modern`
- `minimal`
- `avantgarde`

Important :

- si un template est ajouté, il doit être branché partout
- ne pas l'ajouter seulement dans `TemplatesPage`

Zones à vérifier :

- [`apps/app/client/src/pages/admin/TemplatesPage.tsx`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/app/client/src/pages/admin/TemplatesPage.tsx)
- [`apps/app/client/src/pages/admin/DesignPage.tsx`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/app/client/src/pages/admin/DesignPage.tsx)
- [`apps/api/routes.ts`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/api/routes.ts)
- [`apps/app/client/src/pages/OnboardingPreview.tsx`](/Users/amy/Documents/Workspace/DZYN_DEV/daylora-app/apps/app/client/src/pages/OnboardingPreview.tsx)
- renderer public concerné

## Pages et comportements récents à conserver

- `Design` :
  - ordre des blocs simplifié
  - `Navigation` retirée
  - `Dress code` retiré de `Design`
  - `Hébergement à proximité` bloc séparé
  - `Galerie photos` et `Cadeaux` visibles dans `Design`
  - selects stylés
- preview de `Design` :
  - le site doit remplir proprement le cadre
  - pas de mini assistant noir dans l'iframe preview
- preview de `Templates` :
  - l'échelle est compensée pour éviter le grand vide sous l'iframe
- site public en preview :
  - overlay `Modifier le site` compact, discret
- `Facturation` :
  - cartes visuellement harmonisées
- onboarding :
  - mini assistant email `help@daylora.app`
  - pas de bouton WhatsApp

## Zones à tester après push

À vérifier manuellement sur Replit :

1. login
2. admin `/dashboard`
3. `Design`
4. `Invités`
5. `Templates`
6. `Paramètres`
7. `Facturation`
8. suppression de site
9. suppression de compte
10. multi-site premium
11. support interne
12. mini assistant onboarding
13. SEO :
   - `/robots.txt`
   - `/sitemap.xml`
   - meta tags landing
   - meta tags site publié
14. nouveau template `Avant-Garde` présent dans tous les écrans utiles
15. modules organisation :
   - `Checklist` chargée avec catégories par défaut
   - `Planning` chargé avec suggestions si vide
   - `Budget` chargé avec catégories par défaut
   - `Dashboard` affiche bien le score et les prochaines actions

## Règle d'or

Avant toute modification importante :

- ne pas casser auth
- ne pas casser multi-tenant
- ne pas casser Stripe
- ne pas casser le centre d'aide
- ne pas casser le SEO serveur
- ne pas ouvrir au plan gratuit une action prévue pour Premium
