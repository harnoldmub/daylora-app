# 💍 Golden Love 2026 - Marie & Julien Wedding Website

[![CI Status](https://github.com/harnoldmub/mariage-AR/actions/workflows/ci.yml/badge.svg)](https://github.com/harnoldmub/mariage-AR/actions/workflows/ci.yml)
[![Deploy Status](https://github.com/harnoldmub/mariage-AR/actions/workflows/deploy.yml/badge.svg)](https://github.com/harnoldmub/mariage-AR/actions/workflows/deploy.yml)

Site web de mariage élégant et moderne pour Marie & Julien - Célébration 2026

## ✨ Caractéristiques

### 🌐 Page Publique
- **Design luxueux** : Palette or et ivoire (#C8A96A) avec typographie élégante (Playfair Display, Lato)
- **Hero Section** : Noms élégants avec image de fond subtile
- **Notre Histoire** : Présentation des mariés avec portraits et citation romantique
- **Dates du Mariage** : 19 et 21 Mars 2026 avec compte à rebours interactif
- **Galerie Photo** : Grille 3 colonnes avec lightbox et partage social
- **Formulaire RSVP** : Collecte des réponses avec validation (nom, email, nombre de personnes, disponibilité)

### 🔐 Dashboard Admin
- **Authentification locale** : Connexion sécurisée (username: AR2026_Admin)
- **Gestion des RSVPs** : Voir, modifier, supprimer les réponses
- **Attribution de tables** : Assigner les invités à des tables
- **Statistiques** : Total invités, confirmations, répartition par date
- **Export CSV** : Télécharger les données des invités
- **Envoi d'invitations** : Emails personnalisés avec Resend

## 🛠️ Stack Technique

### Frontend
- **React 18** + TypeScript
- **Vite** : Build tool et dev server
- **Tailwind CSS** : Styling avec design system personnalisé
- **Shadcn/ui** : Composants UI basés sur Radix
- **TanStack Query** : Gestion d'état serveur
- **Wouter** : Routing client-side

### Backend
- **Node.js** + Express
- **PostgreSQL** : Base de données (Neon serverless)
- **Drizzle ORM** : ORM type-safe
- **Passport.js** : Authentication locale
- **Resend** : Service d'emailing

### DevOps
- **GitHub Actions** : CI/CD automatique
- **Replit** : Hébergement et déploiement
- **TypeScript** : Type safety complète

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 20.x
- npm ou pnpm
- PostgreSQL (ou compte Neon)

### Installation

```bash
# Cloner le repository
git clone https://github.com/harnoldmub/mariage-AR.git
cd mariage-AR

# Installer les dépendances
npm install

# Configurer les variables d'environnement
# Créer un fichier .env avec :
# DATABASE_URL=your_postgresql_url
# SESSION_SECRET=your_secret_key
# RESEND_API_KEY=your_resend_key

# Initialiser la base de données
npm run db:push

# Lancer en développement
npm run dev
```

L'application sera accessible sur `http://localhost:5000`

## 📝 Scripts Disponibles

```bash
npm run dev          # Lancer le serveur de développement
npm run build        # Build pour production
npm run db:push      # Synchroniser le schéma DB
npm run db:studio    # Ouvrir Drizzle Studio
```

## 🔄 Workflow de Développement

### Branches
- `main` : Production (déploiement automatique)
- `develop` : Développement
- `feature/*` : Nouvelles fonctionnalités
- `fix/*` : Corrections de bugs

### Conventions de Commits

Nous utilisons [Conventional Commits](https://www.conventionalcommits.org/) :

```bash
feat: Ajouter fonctionnalité X
fix: Corriger bug Y
docs: Mettre à jour documentation
refactor: Refactoriser composant Z
chore: Mettre à jour dépendances
```

### CI/CD Automatique

✅ **Sur chaque Push/PR** :
- Vérification TypeScript
- Build du projet
- Audit de sécurité

🚀 **Sur Push vers main** :
- Build de production
- Déploiement automatique sur Replit
- Notifications de déploiement

Pour plus de détails, consultez [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📂 Structure du Projet

```
mariage-AR/
├── client/               # Frontend React
│   ├── src/
│   │   ├── components/  # Composants UI
│   │   ├── pages/       # Pages (Landing, Admin, Login)
│   │   └── lib/         # Utilitaires
├── server/              # Backend Express
│   ├── routes.ts       # API endpoints
│   ├── storage.ts      # Interface de données
│   └── localAuth.ts    # Configuration auth
├── shared/             # Code partagé
│   └── schema.ts       # Schémas DB et validation
├── .github/
│   └── workflows/      # CI/CD GitHub Actions
├── attached_assets/    # Images et médias
└── db/                 # Migrations Drizzle
```

## 🔐 Sécurité

- **Mots de passe** : Hashés avec bcrypt
- **Sessions** : Stockées dans PostgreSQL
- **Secrets** : Gérés via Replit Secrets
- **Validation** : Zod pour validation runtime

⚠️ **Important** : Ne jamais commiter de secrets dans Git !

## 📊 Monitoring

- **Build Status** : [GitHub Actions](https://github.com/harnoldmub/mariage-AR/actions)
- **Production** : Déployé sur Replit
- **Database** : Neon PostgreSQL

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez [CONTRIBUTING.md](./CONTRIBUTING.md) pour :
- Guide de développement
- Workflow Git
- Standards de code
- Process de review

## 📧 Contact

Pour toute question :
- Email : contact@ar2k26.com
- GitHub Issues : [Créer une issue](https://github.com/harnoldmub/mariage-AR/issues)

## 📄 License

Ce projet est privé et réservé à l'usage du mariage Marie & Julien 2026.

---

Fait avec ❤️ pour Marie & Julien | Golden Love 2026
