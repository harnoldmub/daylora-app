# Nocely — Product Requirements Document (PRD)
## Backoffice App · V2

**Auteur** : Product Lead  
**Date** : 18 février 2026  
**Statut** : Draft — Prêt pour revue engineering  
**Scope** : `/app/*` uniquement (hors marketing)

---

## 1. Énoncé du problème

Organiser un mariage en 2026 implique de jongler entre **12 à 18 outils distincts** : un Google Form pour les RSVP, Canva pour le faire-part, un site Wix générique, un virement bancaire partagé pour la cagnotte, un groupe WhatsApp pour les blagues du jour J, un tableur Excel pour le plan de table, un Drive pour les photos…

Les couples perdent **en moyenne 40 heures** sur la logistique digitale de leur mariage. Les solutions existantes sont soit trop complexes (Wix, Squarespace), soit trop anglophoniques (Zola, The Knot, WithJoy), soit trop limitées (faire-part papier + cagnotte séparée).

**Le vrai problème** : il n'existe aucune plateforme francophone all-in-one qui centralise la création du site, la gestion des invités, la cagnotte, les cadeaux, le live du jour J et la facturation premium — le tout depuis un backoffice intuitif, sans compétences techniques.

---

## 2. Persona utilisateur

### Persona primaire : **Léa & Thomas, 29 ans**

| Attribut | Détail |
|---|---|
| **Âge** | 25–35 ans |
| **Profil** | Digital natives, utilisent Notion/Trello au quotidien |
| **Revenus** | Ménage 50–90K€/an |
| **Délai mariage** | 8–18 mois |
| **Comportement** | Comparent 3–4 solutions en 30 min, veulent voir un résultat visuel en < 5 min |
| **Frustration #1** | "On a passé un week-end entier à faire le site sur Wix et c'est encore moche" |
| **Frustration #2** | "Impossible de savoir qui vient vraiment — les gens répondent par SMS, email, WhatsApp…" |
| **Frustration #3** | "La cagnotte Leetchi prend 4% et c'est pas intégré au site" |
| **Willingness to pay** | 49–99€ pour une solution complète qui leur fait gagner du temps |
| **Device** | 70% mobile pour la gestion courante, desktop pour la personnalisation |
| **Goal** | Un site de mariage élégant + une gestion invités centralisée, opérationnel en 15 min |

### Persona secondaire : **Wedding Planner freelance**
- Gère 5–12 mariages/an
- Besoin de multi-tenant et accès client
- Veut facturer sa prestation via la plateforme (V3)

---

## 3. Analyse concurrentielle

| Critère | **Nocely** | Zola | The Knot | WithJoy | Wix Wedding | SayYes |
|---|---|---|---|---|---|---|
| **Marché cible** | 🇫🇷 France | 🇺🇸 US | 🇺🇸 US | 🇺🇸 US | 🌍 Global | 🇫🇷 France |
| **Langue** | FR natif | EN only | EN only | EN only | Multi (FR basique) | FR natif |
| **Onboarding** | Wizard 7 étapes < 5 min | ~10 min | ~8 min | ~6 min | ~20 min | ~10 min |
| **Templates** | 3 (Classic, Modern, Minimal) | 100+ | 200+ | 50+ | ∞ | 15+ |
| **RSVP intégré** | ✅ avec dashboard | ✅ | ✅ | ✅ | Via formulaire | ✅ |
| **Cagnotte intégrée** | ✅ Stripe Connect 0% | ❌ (registry) | ❌ | ✅ (US only) | ❌ | ✅ (3% com.) |
| **Liste cadeaux** | ✅ | ✅ (core) | ✅ (core) | ✅ | ❌ | ✅ |
| **Live jour J** | ✅ SSE temps réel + blagues | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Mode preview éditable** | ✅ inline WYSIWYG | ❌ | ❌ | ✅ partiel | ✅ (builder complet) | ❌ |
| **Prix** | Freemium + Premium 49€ | Free + $60–200 | Free + $50–170 | Free + $39–99 | $17–36/mois | Free + 59–99€ |
| **Commission cagnotte** | **0%** (Stripe fees only) | N/A | N/A | 2.5% | N/A | 3% |

### Avantages compétitifs Nocely

1. **Seule plateforme FR avec cagnotte à 0% de commission** (Stripe fees uniquement)
2. **Live temps réel** le jour J (contributions + blagues) — feature unique sur le marché
3. **Mode preview éditable** : WYSIWYG inline, pas de builder complexe
4. **Onboarding < 5 min** : wizard guidé vs. page builder intimidant

---

## 4. Proposition de valeur

> **Nocely : créez votre site de mariage en 5 minutes, centralisez vos invités, votre cagnotte et votre jour J — sans commission, sans complexité.**

---

## 5. Priorisation MoSCoW — Scope App

### Must Have (MVP actuel — livré)

| # | Feature | Statut |
|---|---|---|
| M1 | Wizard onboarding 7 étapes (titre, style, photos, galerie, modules, offre, final) | ✅ Livré |
| M2 | Dashboard principal avec KPI RSVP (confirmés, déclinés, en attente) | ✅ Livré |
| M3 | Gestion templates (3 templates : Classic, Modern, Minimal) | ✅ Livré |
| M4 | Éditeur de design (couleurs, polices, boutons, tonalités) | ✅ Livré |
| M5 | Gestion invités : tableau RSVP avec filtre/export | ✅ Livré |
| M6 | Cagnotte Stripe Connect (onboarding OAuth, contributions, webhook) | ✅ Livré |
| M7 | Liste de cadeaux (CRUD + progression prix) | ✅ Livré |
| M8 | Configuration du site (pages, navigation, menu, sections) | ✅ Livré |
| M9 | Mode preview éditable (`/preview/:slug`) avec InlineEditor | ✅ Livré |
| M10 | Authentification locale (email/password + sessions PostgreSQL) | ✅ Livré |
| M11 | Publication du site (`/:slug` public) | ✅ Livré |
| M12 | SSE live contributions temps réel | ✅ Livré |
| M13 | Blagues live configurable (ton, fréquence) | ✅ Livré |
| M14 | Email transactionnels (confirmation RSVP, notification contribution) | ✅ Livré |
| M15 | Pages légales dynamiques | ✅ Livré |

### Should Have (V2 — Prochain sprint)

| # | Feature | Priorité |
|---|---|---|
| S1 | **Dashboard V2** : graphiques de tendances RSVP, timeline d'activité, widget "actions à faire" | Haute |
| S2 | **Onboarding amélioré** : preview live pendant le wizard, pré-remplissage intelligent | Haute |
| S3 | **Templates V2** : 3 nouveaux templates (Garden, Bohème, Art Déco) + meilleur preview | Haute |
| S4 | **Facturation Premium** : page `/billing` avec comparatif Free/Premium, Stripe Checkout, gestion abonnement | Haute |
| S5 | **Export invités** : CSV/PDF avec colonnes configurables | Moyenne |
| S6 | **Envoi invitations email** : campagne d'envoi avec suivi (envoyé/ouvert/RSVP) | Moyenne |
| S7 | **QR Code** : génération QR code pour accès rapide au site de mariage | Moyenne |
| S8 | **SEO/OG** : meta tags dynamiques, Open Graph image par template | Moyenne |
| S9 | **Multi-langue** : FR/EN pour le backoffice et le site public | Moyenne |
| S10 | **Drag & drop sections** : réordonner les sections du site depuis le backoffice | Moyenne |

### Could Have (V3 — Post-lancement)

| # | Feature |
|---|---|
| C1 | Custom domain (CNAME) pour le site de mariage |
| C2 | Mode "Wedding Planner" multi-client |
| C3 | Guest book digital avec modération |
| C4 | Photo upload collaboratif (invités uploadent leurs photos) |
| C5 | Plan de table interactif (drag & drop) |
| C6 | Rappels automatiques (RSVP relance, J-30, J-7, J-1) |
| C7 | Intégration Spotify (playlist collaborative) |
| C8 | Application mobile native (React Native) |
| C9 | Analytics avancés (heatmaps, scroll depth, temps passé) |
| C10 | A/B testing templates pour optimiser les conversions |

### Won't Have (Out of scope)

- Marketplace prestataires (photographes, traiteurs, DJ)
- Plateforme de revente d'articles
- Gestion budgétaire complète du mariage
- Messagerie instantanée entre invités
- Landing page marketing (scope séparé `/marketing`)

---

## 6. User Stories — Backoffice App

### Onboarding & Création

| # | Story | Critères d'acceptation |
|---|---|---|
| US-01 | En tant que couple, je veux créer mon site de mariage en moins de 5 minutes via un wizard guidé | 7 étapes max, preview live à l'étape 2, validation temps réel sur le slug |
| US-02 | En tant que couple, je veux choisir un template parmi 3 styles visuels distincts avant de m'engager | Cards template avec preview image, badge "Populaire" sur Classic, switch instantané |
| US-03 | En tant que couple, je veux uploader mes photos (hero + couple) pendant l'onboarding | Compression JPEG auto < 2.8 MB, preview instantanée, possibilité de skip |
| US-04 | En tant que couple, je veux activer/désactiver les modules (cagnotte, cadeaux, blagues, live) pendant l'onboarding | Toggle switch pour chaque module, description 1 ligne, état persisté |

### Dashboard & Vue d'ensemble

| # | Story | Critères d'acceptation |
|---|---|---|
| US-05 | En tant que couple, je veux voir un dashboard avec les KPI principaux dès ma connexion | Confirmés / Déclinés / En attente en cards, refresh auto, lien vers gestion invités |
| US-06 | En tant que couple, je veux voir une checklist d'onboarding qui me guide vers les actions importantes | 6 étapes (profil, template, photos, RSVP, cagnotte, publication), progress bar, checkmarks |
| US-07 | En tant que couple, je veux accéder au preview de mon site directement depuis le dashboard | Bouton "Voir mon site" + bouton "Éditeur visuel" avec lien vers `/preview/:slug` |

### Templates & Design

| # | Story | Critères d'acceptation |
|---|---|---|
| US-08 | En tant que couple, je veux changer de template à tout moment sans perdre mon contenu | Switch instantané, tous les textes/images conservés, confirmation dialog |
| US-09 | En tant que couple, je veux personnaliser les couleurs, polices et styles de boutons de mon site | Color picker avec preset tones, font selector (serif/sans), button style (solid/outline/ghost), button radius (pill/rounded/square) |
| US-10 | En tant que couple, je veux éditer le contenu de mon site en mode WYSIWYG depuis le preview | Click-to-edit sur tous les textes, upload image inline, sauvegarde auto |

### Gestion invités

| # | Story | Critères d'acceptation |
|---|---|---|
| US-11 | En tant que couple, je veux voir la liste complète de mes RSVP avec statut et détails | Tableau avec colonnes : nom, email, statut, taille du groupe, date de réponse |
| US-12 | En tant que couple, je veux filtrer mes invités par statut (confirmé/décliné/en attente) | Filtres en tabs ou dropdown, compteurs par statut, tri par date |
| US-13 | En tant que couple, je veux supprimer un RSVP en cas d'erreur ou de doublon | Action delete avec confirmation dialog, mise à jour immédiate du compteur |
| US-14 | En tant que couple, je veux envoyer une invitation par email à un invité spécifique | Formulaire d'envoi avec prénom, email, message personnalisé, tracking envoi/échec |

### Contributions & Cagnotte

| # | Story | Critères d'acceptation |
|---|---|---|
| US-15 | En tant que couple, je veux connecter mon compte Stripe pour recevoir les contributions en direct | OAuth Stripe Connect, redirection callback, badge "Connecté" dans settings |
| US-16 | En tant que couple, je veux suivre les contributions reçues en temps réel | Total cumulé, liste des contributeurs (nom, montant, message), SSE live update |
| US-17 | En tant que couple, je veux pouvoir utiliser une cagnotte externe (Leetchi, PayPal, etc.) au lieu de Stripe | Toggle mode "externe", champ URL, lien redirigé sur le site public |

### Cadeaux

| # | Story | Critères d'acceptation |
|---|---|---|
| US-18 | En tant que couple, je veux créer une liste de cadeaux avec images, descriptions et prix | Formulaire CRUD : nom (requis), description, prix, image (upload + compression), statut réservé |
| US-19 | En tant que couple, je veux voir la progression des réservations de cadeaux | Progress bar par cadeau, badge "Réservé" quand >= prix, total liste cadeaux |

### Live & Jour J

| # | Story | Critères d'acceptation |
|---|---|---|
| US-20 | En tant que couple, je veux configurer les blagues/messages live qui s'afficheront le jour J | CRUD blagues : texte, ton (drôle/émouvant/neutre), fréquence, toggle actif/inactif, ajout manuel contribution au flux live |

---

## 7. Métriques de succès

### 7.1 Activation onboarding

| Métrique | Définition | Target MVP | Target V2 |
|---|---|---|---|
| **Taux de complétion wizard** | % d'utilisateurs qui terminent les 7 étapes | 45% | 65% |
| **Time-to-first-preview** | Temps entre inscription et premier preview du site | < 5 min | < 3 min |
| **Drop-off par étape** | % d'abandon à chaque étape du wizard | < 20% par étape | < 12% par étape |
| **Taux de publication** | % de sites passés en "publié" après onboarding | 30% | 50% |

### 7.2 Conversion Premium

| Métrique | Définition | Target MVP | Target V2 |
|---|---|---|---|
| **Taux de conversion Free → Premium** | % d'utilisateurs gratuits qui passent Premium | 5% | 12% |
| **ARPU** | Revenu moyen par utilisateur | 2.45€ | 5.88€ |
| **Revenue par mariage** | Revenu total par mariage (Premium + commission cagnotte) | 49€ | 65€ |
| **Churn Premium** | % de désabonnement Premium mensuel | < 8% | < 5% |

### 7.3 Usage preview

| Métrique | Définition | Target MVP | Target V2 |
|---|---|---|---|
| **Sessions preview /mois** | Nombre de sessions en mode `/preview/:slug` | 4/mois | 8/mois |
| **Éditions inline /session** | Nombre de modifications par session preview | 3 | 6 |
| **Templates switchés** | % d'utilisateurs qui essaient > 1 template | 25% | 45% |
| **Temps moyen en preview** | Durée moyenne d'une session preview | 4 min | 7 min |

### 7.4 Rétention J7

| Métrique | Définition | Target MVP | Target V2 |
|---|---|---|---|
| **Rétention J1** | % d'utilisateurs qui reviennent le lendemain | 40% | 55% |
| **Rétention J7** | % d'utilisateurs actifs 7 jours après inscription | 25% | 40% |
| **Rétention J30** | % d'utilisateurs actifs 30 jours après inscription | 15% | 30% |
| **NPS** | Net Promoter Score | — | > 50 |

### Instrumentation requise

- **Mixpanel/PostHog** : Events tracking (signup, onboarding_step_N, template_selected, preview_opened, inline_edit, publish, premium_checkout)
- **Stripe Dashboard** : Revenue, MRR, churn, LTV
- **Custom dashboard** : KPI RSVP, contributions cumulées, taux de publication

---

## 8. Scope MVP actuel vs Scope V2

### MVP actuel (livré)

```
┌─────────────────────────────────────────────────────────────┐
│  NOCELY MVP — Livré                                         │
│                                                             │
│  ✅ Auth locale (email/password + sessions)                 │
│  ✅ Wizard onboarding 7 étapes                              │
│  ✅ 3 templates (Classic, Modern, Minimal)                  │
│  ✅ Design editor (couleurs, polices, boutons, tones)       │
│  ✅ Site public multi-tenant (/:slug)                       │
│  ✅ Mode preview éditable (/preview/:slug)                  │
│  ✅ Dashboard KPI RSVP                                      │
│  ✅ Gestion invités (tableau + filtre + delete)             │
│  ✅ Cagnotte Stripe Connect (OAuth + webhooks)              │
│  ✅ Liste cadeaux (CRUD + images + progression)             │
│  ✅ SSE live contributions + blagues                        │
│  ✅ Config site (pages, navigation, menus)                  │
│  ✅ Emails transactionnels (RSVP + contribution)            │
│  ✅ Pages légales dynamiques                                │
│  ✅ Pages custom (CMS léger)                                │
│  ✅ Check-in invités                                        │
│  ✅ QR code invité personnalisé                             │
│                                                             │
│  Architecture :                                             │
│  - React 18 + TypeScript + Vite                             │
│  - Express.js + Drizzle ORM                                 │
│  - PostgreSQL (Neon) + Stripe Connect                       │
│  - Design system tokens (3 templates)                       │
│  - 9 section components modulaires                          │
│  - TemplateRenderer composable                              │
│  - InlineEditor WYSIWYG                                     │
└─────────────────────────────────────────────────────────────┘
```

### V2 — Objectifs Q2 2026

```
┌─────────────────────────────────────────────────────────────┐
│  NOCELY V2 — Roadmap Q2 2026                                │
│                                                             │
│  🔨 Dashboard V2                                            │
│     → Graphiques tendances RSVP (sparklines)                │
│     → Timeline d'activité (contributions, RSVP, éditions)   │
│     → Widget "Actions à faire" contextuel                   │
│     → Notifications in-app                                  │
│                                                             │
│  🔨 Onboarding V2                                           │
│     → Preview live split-screen pendant le wizard           │
│     → Auto-suggestion slug depuis le titre                  │
│     → Import photos depuis Instagram/Google Photos          │
│     → Score de complétion du site                           │
│                                                             │
│  🔨 Templates V2                                            │
│     → 3 nouveaux templates (Garden, Bohème, Art Déco)       │
│     → Preview plein écran interactive                       │
│     → Filtre par style/ambiance                             │
│     → Badge "Nouveau" / "Populaire"                         │
│                                                             │
│  🔨 Invités V2                                              │
│     → Import CSV / copier-coller                            │
│     → Campagne email (envoi groupé + tracking)              │
│     → Tags et groupes (famille, amis, collègues)            │
│     → Export CSV/PDF configurable                           │
│                                                             │
│  🔨 Contributions V2                                        │
│     → Objectif cagnotte avec progress bar                   │
│     → Remerciements automatiques personnalisés              │
│     → Historique contributions avec graphique               │
│     → Multi-devises (EUR, USD, GBP)                         │
│                                                             │
│  🔨 Facturation Premium                                     │
│     → Comparatif Free vs Premium                            │
│     → Stripe Checkout (one-time ou mensuel)                 │
│     → Gestion abonnement (upgrade/downgrade/cancel)         │
│     → Feature gating (templates premium, custom domain)     │
│                                                             │
│  🔨 Preview V2                                              │
│     → Device switcher (desktop/tablet/mobile)               │
│     → Drag & drop section ordering                          │
│     → Undo/redo sur les éditions inline                     │
│     → Historique des versions                               │
│                                                             │
│  Architecture V2 :                                          │
│  - Analytics (PostHog/Mixpanel)                             │
│  - Feature flags (LaunchDarkly ou custom)                   │
│  - i18n (FR/EN)                                             │
│  - CDN images (Cloudinary ou R2)                            │
│  - Rate limiting API                                        │
│  - Error monitoring (Sentry)                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Description wireframes

### 9.1 Wizard Onboarding (`/app/onboarding`)

```
┌──────────────────────────────────────────────────────────────┐
│  ♥ Nocely                                    Étape 2/7       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░  28%             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │        Choisissez votre style                        │    │
│  │        Le template définit l'ambiance visuelle       │    │
│  │        de votre site. Vous pourrez le changer        │    │
│  │        à tout moment.                                │    │
│  │                                                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │    │
│  │  │          │  │          │  │          │           │    │
│  │  │ CLASSIC  │  │ MODERN   │  │ MINIMAL  │           │    │
│  │  │          │  │          │  │          │           │    │
│  │  │ preview  │  │ preview  │  │ preview  │           │    │
│  │  │ image    │  │ image    │  │ image    │           │    │
│  │  │          │  │          │  │          │           │    │
│  │  ├──────────┤  ├──────────┤  ├──────────┤           │    │
│  │  │Classique │  │ Moderne  │  │ Minimal  │           │    │
│  │  │Élégant & │  │ Épuré &  │  │Audacieux │           │    │
│  │  │intemporel│  │minimalist│  │ & chic   │           │    │
│  │  │  ✅ Actif │  │ Choisir  │  │ Choisir  │           │    │
│  │  └──────────┘  └──────────┘  └──────────┘           │    │
│  │                                                      │    │
│  │  ┌───────────────────────────────────────────┐       │    │
│  │  │ Palette de couleurs                       │       │    │
│  │  │ ● Golden    ● Rose    ● Sage    ● Navy   │       │    │
│  │  │ ● Midnight  ● Terracotta  ● Custom       │       │    │
│  │  └───────────────────────────────────────────┘       │    │
│  │                                                      │    │
│  │  [ ← Retour ]                    [ Continuer → ]    │    │
│  │                                                      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Comportement** :
- Progress bar animée, 7 segments
- Étape 1 : titre + slug (auto-suggest) + date mariage
- Étape 2 : choix template + palette couleurs
- Étape 3 : upload photo hero + photo couple (compression auto)
- Étape 4 : galerie (max 6 images, drag & drop)
- Étape 5 : modules activables (cagnotte, cadeaux, blagues, live)
- Étape 6 : choix plan Free/Premium (cards comparatives)
- Étape 7 : récapitulatif + bouton "Créer mon site"
- Animation Framer Motion entre chaque étape (fade + slide)
- Validation par étape (pas de passage à l'étape N+1 sans validation N)

---

### 9.2 Dashboard principal (`/app/:weddingId/dashboard`)

```
┌──────────────────────────────────────────────────────────────┐
│  ◀ Nocely         Mon Mariage         👤 Léa T.    ⚙️       │
│  ─────────────────────────────────────────────────────────── │
│  │ Dashboard │ Invités │ Cadeaux │ Live │ Design │ ⋯ │     │
│  ━━━━━━━━━━━                                                │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │   ✅ 42      │ │   ❌ 8       │ │   ⏳ 23      │            │
│  │  Confirmés  │ │  Déclinés   │ │  En attente  │            │
│  │  57%        │ │  11%        │ │  32%         │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                              │
│  ┌──────────────────────────┐ ┌────────────────────────┐     │
│  │ 📋 Checklist onboarding  │ │ 📊 Activité récente    │     │
│  │                          │ │                        │     │
│  │ ✅ Profil complété       │ │ • Marie a RSVP ✅  2h  │     │
│  │ ✅ Template choisi       │ │ • 50€ cagnotte    3h   │     │
│  │ ✅ Photos uploadées      │ │ • Paul a RSVP ❌  5h   │     │
│  │ ⬜ Premier RSVP reçu    │ │ • Site publié     1j   │     │
│  │ ⬜ Cagnotte configurée  │ │ • Template changé 2j   │     │
│  │ ⬜ Site publié          │ │                        │     │
│  │                          │ │                        │     │
│  │ Progression: 50% ━━━░░░ │ │                        │     │
│  └──────────────────────────┘ └────────────────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 🔗 Liens rapides                                     │    │
│  │                                                      │    │
│  │ [👁 Voir mon site]  [✏️ Éditeur visuel]  [📤 Partager] │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Comportement** :
- KPI cards avec compteurs animés au chargement
- Checklist persistante jusqu'à 100% complétée
- Feed d'activité en temps réel (SSE)
- Liens rapides contextuels selon l'état du site
- Responsive : cards stack en colonne sur mobile

---

### 9.3 Écran Templates (`/app/:weddingId/templates`)

```
┌──────────────────────────────────────────────────────────────┐
│  Templates                                                   │
│  Choisissez le design de votre site de mariage               │
│                                                              │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐   │
│  │                │ │                │ │                │   │
│  │   ★ Populaire  │ │                │ │   ✨ Nouveau    │   │
│  │                │ │                │ │                │   │
│  │   [preview]    │ │   [preview]    │ │   [preview]    │   │
│  │   [image ]     │ │   [image ]     │ │   [image ]     │   │
│  │   [      ]     │ │   [      ]     │ │   [      ]     │   │
│  │                │ │                │ │                │   │
│  ├────────────────┤ ├────────────────┤ ├────────────────┤   │
│  │ Classique      │ │ Moderne        │ │ Minimal        │   │
│  │ Élégant &      │ │ Épuré &        │ │ Audacieux &    │   │
│  │ intemporel     │ │ minimaliste    │ │ chic           │   │
│  │                │ │                │ │                │   │
│  │ [✅ Actif     ]│ │ [  Appliquer  ]│ │ [  Appliquer  ]│   │
│  └────────────────┘ └────────────────┘ └────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Preview live                               🔄 ↗️    │    │
│  │  ┌──────────────────────────────────────────────┐    │    │
│  │  │                                              │    │    │
│  │  │      iframe /preview/:slug?t=timestamp       │    │    │
│  │  │                                              │    │    │
│  │  │      (preview du template sélectionné)       │    │    │
│  │  │                                              │    │    │
│  │  └──────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  │  [  Ouvrir l'éditeur visuel  →  ]                   │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Comportement** :
- Cards template avec image preview et badge
- "Appliquer" déclenche confirmation dialog avant switch
- Preview iframe rafraîchi après chaque switch (token timestamp)
- Lien vers éditeur visuel (`/preview/:slug`) dans la même fenêtre
- Loading skeleton pendant le switch de template

---

### 9.4 Écran Invités (`/app/:weddingId/guests`)

```
┌──────────────────────────────────────────────────────────────┐
│  Invités                                     [+ Inviter]     │
│  Gérez les réponses de vos invités                           │
│                                                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Tous 73 │ │ ✅ 42    │ │ ❌ 8     │ │ ⏳ 23    │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                              │
│  🔍 Rechercher un invité...            [📥 Exporter CSV]     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Nom            │ Email           │ Statut │ Nb │ Date│    │
│  │────────────────│─────────────────│────────│────│─────│    │
│  │ Marie Dupont   │ marie@mail.com  │ ✅ Oui │ 2  │ 15/2│    │
│  │ Paul Martin    │ paul@mail.com   │ ❌ Non │ 1  │ 14/2│    │
│  │ Sophie Lambert │ sophie@mail.com │ ✅ Oui │ 2  │ 13/2│    │
│  │ Jean Bernard   │ jean@mail.com   │ ⏳ —   │ —  │  —  │    │
│  │ ...            │                 │        │    │     │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Affichage 1-20 sur 73          [ ← ] Page 1/4  [ → ]       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Comportement** :
- Tabs de filtre par statut avec compteur dynamique
- Recherche full-text (nom, email)
- Tableau triable par colonne (nom, date, statut)
- Action row : envoyer invitation email, supprimer (avec confirmation)
- Export CSV avec colonnes sélectionnables
- Pagination 20 résultats/page
- Badge party size (Solo = 1, Couple = 2)

---

### 9.5 Écran Contributions (`/app/:weddingId/dashboard` + Settings)

```
┌──────────────────────────────────────────────────────────────┐
│  Cagnotte & Contributions                                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  💰 Total cagnotte                                    │    │
│  │                                                      │    │
│  │      1 250,00 €                                      │    │
│  │      ━━━━━━━━━━━━━━━━━━━━░░░░░░░░  62%               │    │
│  │      Objectif : 2 000 €                               │    │
│  │                                                      │    │
│  │  12 contributions · Dernière il y a 2h               │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Contributeur      │ Montant │ Message         │ Date │    │
│  │───────────────────│─────────│─────────────────│──────│    │
│  │ Marie & Pierre    │ 150 €   │ Félicitations ! │ 15/2 │    │
│  │ Famille Dupont    │ 200 €   │ Avec amour ♥    │ 14/2 │    │
│  │ Sophie L.         │  50 €   │ Bon voyage !    │ 13/2 │    │
│  │ ...               │         │                 │      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─ Configuration ──────────────────────────────────────┐    │
│  │ Mode :  ● Stripe Connect   ○ Cagnotte externe       │    │
│  │ Statut Stripe : ✅ Connecté (acct_1N...)             │    │
│  │ [Déconnecter Stripe]                                 │    │
│  │                                                      │    │
│  │ ☑ Autoriser contributions manuelles (live)           │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Comportement** :
- Total cagnotte avec progress bar vers objectif (configurable)
- Tableau contributeurs avec tri et pagination
- Configuration Stripe Connect : bouton connect/disconnect OAuth
- Mode externe : champ URL avec validation
- Toggle contributions manuelles pour le feed live
- SSE : nouvelles contributions apparaissent en temps réel avec animation

---

### 9.6 Écran Facturation (`/app/:weddingId/billing`)

```
┌──────────────────────────────────────────────────────────────┐
│  Votre offre                                                 │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐          │
│  │                      │  │  ★ RECOMMANDÉ         │          │
│  │  GRATUIT             │  │                      │          │
│  │                      │  │  PREMIUM             │          │
│  │  0 €                 │  │                      │          │
│  │                      │  │  49 € unique         │          │
│  │  ✅ 3 templates       │  │                      │          │
│  │  ✅ Site publié       │  │  ✅ Tout le gratuit   │          │
│  │  ✅ RSVP illimité     │  │  ✅ Templates premium │          │
│  │  ✅ Cagnotte 0%       │  │  ✅ Custom domain     │          │
│  │  ❌ Custom domain     │  │  ✅ SEO avancé        │          │
│  │  ❌ SEO avancé        │  │  ✅ Analytics         │          │
│  │  ❌ Analytics         │  │  ✅ Support prioritaire│         │
│  │  ❌ Support prioritaire│  │  ✅ Export PDF invités│          │
│  │                      │  │                      │          │
│  │  [Plan actuel ✅]     │  │  [Passer Premium →]  │          │
│  │                      │  │                      │          │
│  └──────────────────────┘  └──────────────────────┘          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ Historique de facturation                             │    │
│  │                                                      │    │
│  │ (Aucune facture pour le moment)                      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  💬 Une question ? Contactez-nous à support@nocely.fr        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Comportement** :
- Comparatif 2 colonnes Free vs Premium
- Badge "Recommandé" sur Premium
- Bouton "Passer Premium" ouvre Stripe Checkout (one-time payment)
- Feature gating : les features premium sont visibles mais verrouillées en Free
- Historique factures si Premium (invoice Stripe)
- Responsive : cards stack verticalement sur mobile
- Upsell contextuel dans d'autres pages (ex: "Débloquez le custom domain avec Premium")

---

### 9.7 Mode Preview (`/preview/:slug`)

```
┌──────────────────────────────────────────────────────────────┐
│  ┌─ Toolbar éditeur ────────────────────────────────────┐    │
│  │ ✏️ Mode édition ON    │ 📱 💻 🖥 │ ↩ Undo │ Dashboard │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │  ╔══════════════════════════════════════════════╗     │    │
│  │  ║                                              ║     │    │
│  │  ║        [click-to-edit subtitle]              ║     │    │
│  │  ║                                              ║     │    │
│  │  ║     [click-to-edit HERO TITLE]               ║     │    │
│  │  ║                                              ║     │    │
│  │  ║        [click-to-edit date]                  ║     │    │
│  │  ║                                              ║     │    │
│  │  ║     [ click-to-edit CTA button ]             ║     │    │
│  │  ║                                              ║     │    │
│  │  ║  📷 Changer l'image hero                     ║     │    │
│  │  ╚══════════════════════════════════════════════╝     │    │
│  │                                                      │    │
│  │  ┌─ RSVP ─────────────────────────────────────┐     │    │
│  │  │ [click-to-edit title]                       │     │    │
│  │  │ [click-to-edit description]                 │     │    │
│  │  │                                             │     │    │
│  │  │   Formulaire RSVP (non-éditable)            │     │    │
│  │  └─────────────────────────────────────────────┘     │    │
│  │                                                      │    │
│  │  ┌─ Notre Histoire ───────────────────────────┐     │    │
│  │  │ [click-to-edit story text]                  │     │    │
│  │  │ 📷 Changer la photo couple                  │     │    │
│  │  └─────────────────────────────────────────────┘     │    │
│  │                                                      │    │
│  │  ... (toutes les sections éditables inline) ...      │    │
│  │                                                      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Comportement** :
- Toolbar fixe en haut avec toggle mode édition
- PublicEditContext fournit `canEdit` et `editMode` à tous les composants enfants
- InlineEditor : click sur n'importe quel texte → input inline → sauvegarde au blur
- Upload image inline : bouton discret sous chaque image éditable
- Sauvegarde automatique via `updateWedding.mutateAsync` (pas de bouton "Enregistrer")
- Toast de confirmation après chaque sauvegarde ("Modifications enregistrées")
- Fallback gracieux : si la sauvegarde échoue, toast d'erreur + texte restauré
- URL partageable : `/preview/:slug` accessible uniquement au propriétaire connecté
- Toutes les sections (Hero, RSVP, Story, Gallery, Locations, Schedule, Gifts, Cagnotte) sont éditables
- Les sections peuvent être réordonnées via la configuration navigation (backoffice, pas drag & drop en preview MVP)

---

## 10. Dépendances techniques

| Composant | Technologie | Notes |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Port 5000, Tailwind CSS, Shadcn/ui |
| Backend | Express.js + TypeScript | API REST, Passport-local, SSE |
| Base de données | PostgreSQL (Neon) | Drizzle ORM, sessions server-side |
| Paiements | Stripe Connect | OAuth, webhooks, Stripe Checkout (V2) |
| Email | Resend | RSVP confirmation, contribution notification |
| Auth | express-session + bcrypt | Session PostgreSQL-backed |
| Animations | Framer Motion | Hero parallax, transitions wizard |
| State | TanStack Query | Cache, invalidation, optimistic updates |
| Forms | React Hook Form + Zod | Validation runtime |

---

## 11. Risques & mitigations

| Risque | Impact | Probabilité | Mitigation |
|---|---|---|---|
| Stripe Connect OAuth échoue | Bloquant cagnotte | Faible | Fallback mode externe, retry auto |
| Images trop lourdes (data URL en JSON) | Slow config saves, quota DB | Moyen | Compression JPEG agressive, CDN V2, limites strictes |
| Templates insuffisants (3 seulement) | Churn utilisateurs exigeants | Moyen | V2 : 3 nouveaux templates, marketplace templates V3 |
| Multi-tenant slug collision | Site inaccessible | Faible | Unicité slug (DB constraint + validation wizard) |
| Compétition US (Zola, WithJoy) arrive en FR | Perte de marché | Moyen | Avancer vite sur proposition valeur FR + cagnotte 0% |
| RGPD non-compliance | Légal | Faible | Pages légales dynamiques déjà en place, DPO V2 |

---

## 12. Timeline

| Phase | Dates | Livrables |
|---|---|---|
| **MVP** (livré) | Nov 2025 – Fév 2026 | Core app, 3 templates, RSVP, cagnotte, gifts, live, preview |
| **V2 Alpha** | Mars 2026 | Dashboard V2, onboarding amélioré, 2 nouveaux templates |
| **V2 Beta** | Avril 2026 | Facturation Premium, export invités, campagne email |
| **V2 GA** | Mai 2026 | Preview V2 (device switcher, undo/redo), analytics, i18n |
| **V3 Planning** | Juin 2026 | Custom domain, mode wedding planner, app mobile |

---

*Document rédigé pour l'équipe produit et engineering Nocely. À mettre à jour après chaque sprint review.*
