# Guide Administrateur Daylora

## Accès

- **URL** : `https://daylora.app/admin/login`
- **Identifiants** : Email et mot de passe fournis par le responsable technique
- Au premier login, vous devrez changer votre mot de passe

---

## Navigation

Une fois connecté, un bandeau rouge **"Mode Super Admin"** s'affiche en haut. Le menu latéral donne accès aux pages suivantes :

| Page | Description |
|------|-------------|
| Tableau de bord | Vue d'ensemble avec les chiffres clés |
| Mariages | Liste et gestion de tous les sites de mariage |
| Conversations | Support utilisateur (chat) |
| Codes promos | Gestion des codes promotionnels |
| Logs d'audit | Historique de toutes les actions admin |
| Parametres | Changement de mot de passe |

---

## 1. Tableau de bord

Le tableau de bord affiche 5 indicateurs en temps reel :

- **Nombre total de mariages** (sites crees sur la plateforme)
- **Mariages Premium** (ceux qui ont souscrit a un plan payant)
- **Nombre d'utilisateurs** inscrits
- **Nombre total de RSVP** (reponses des invites)
- **Montant total des contributions** (cagnotte, en euros)

---

## 2. Mariages (Gestion des tenants)

### Liste des mariages

- Recherchez par **slug**, **titre** ou **email du proprietaire**
- La liste affiche : slug, titre, proprietaire, plan (Gratuit/Premium), statut (Publie/Brouillon), date de creation
- Cliquez sur une ligne pour voir le detail

### Detail d'un mariage

Vous y trouverez :
- **Infos du proprietaire** : nom, email, date d'inscription
- **Statut de l'abonnement** Stripe
- **Statistiques** : nombre de RSVP, montant des contributions

### Actions disponibles

| Action | Description |
|--------|-------------|
| **Changer le plan** | Basculer entre Gratuit et Premium manuellement |
| **Publier / Depublier** | Controler la visibilite du site public |
| **Modifier le slug** | Changer l'URL du site (ex: daylora.app/nouveau-slug). Le systeme verifie que le slug est unique |
| **Ouvrir le site** | Lien direct vers le site public du couple |

Toutes ces actions sont enregistrees dans les logs d'audit.

---

## 3. Conversations (Support)

C'est le centre de support client. Les utilisateurs peuvent envoyer des messages depuis leur espace Daylora.

### Fonctionnement

- Un **bot automatique** repond en premier aux questions courantes (FAQ)
- Si le bot ne sait pas repondre, ou si l'utilisateur demande un humain, la conversation est **escaladee**
- Vous recevez un indicateur de messages non lus dans le menu

### Ce que vous pouvez faire

- **Voir toutes les conversations** avec filtres par statut : Ouvert, En attente, Repondu, Ferme
- **Lire les messages** et voir la page ou l'utilisateur se trouvait quand il a ecrit
- **Repondre** directement a l'utilisateur
- **Changer le statut** : marquer comme repondu, fermer ou reouvrir une conversation

---

## 4. Codes promos

Vous pouvez creer des codes promotionnels pour offrir des reductions sur les plans Premium.

### Creer un code promo

Cliquez sur le bouton de creation et remplissez :

| Champ | Description |
|-------|-------------|
| **Code** | Le texte que l'utilisateur saisira (ex: MARIAGE2026) |
| **Type** | Pourcentage (ex: 20%) ou Montant fixe (ex: 30 euros) |
| **Valeur** | Le chiffre correspondant (20 pour 20%, ou 3000 pour 30 euros en centimes) |
| **Utilisations max** | Nombre total de fois que le code peut etre utilise (laisser vide = illimite) |
| **Date de debut** | Quand le code devient actif |
| **Date de fin** | Quand le code expire (optionnel) |
| **Actif** | Activer ou desactiver le code |

### Gerer les codes existants

- **Modifier** : changez les parametres d'un code existant
- **Desactiver** : le code ne sera plus accepte par le systeme

Le nombre d'utilisations s'incremente automatiquement a chaque achat reussi.

---

## 5. Logs d'audit

Chaque action importante est enregistree automatiquement :

- **Qui** a fait l'action (quel admin)
- **Quoi** : connexion, changement de plan, publication, creation de promo, etc.
- **Sur quoi** : quel mariage, quel code promo
- **Quand** : date et heure precise
- **Details** : informations complementaires (ancien plan, nouveau plan, etc.)

Vous pouvez filtrer par type d'action et parcourir l'historique page par page.

---

## 6. Parametres

- **Changer votre mot de passe** : saisissez l'ancien mot de passe, puis le nouveau (deux fois pour confirmer)
- Si c'est votre premiere connexion, vous serez automatiquement redirige ici

---

## Bonnes pratiques

1. **Changez votre mot de passe** des la premiere connexion
2. **Verifiez le tableau de bord** regulierement pour suivre la croissance
3. **Repondez aux conversations** escaladees rapidement — les utilisateurs attendent une reponse humaine
4. **Utilisez les logs d'audit** en cas de doute sur une action passee
5. **Testez les codes promos** avant de les communiquer aux utilisateurs
6. **Ne modifiez le plan d'un mariage** que si necessaire (ex: geste commercial). Toute modification est tracee

---

## En cas de probleme

Si vous n'arrivez pas a vous connecter ou si une fonctionnalite ne repond pas, contactez le responsable technique.
