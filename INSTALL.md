# Guide d'installation — Maono Ops

> **Plateforme** : Marketing Operations Platform  
> **Stack** : Next.js 14 · TypeScript · Prisma 5 / PostgreSQL · NextAuth v5 · TailwindCSS · BullMQ + Redis · MinIO  
> **Temps estimé** : ~15 min (local) · ~30 min (serveur)

---

## Checklist de démarrage rapide

Cochez chaque étape avant de lancer l'application :

- [ ] Node.js 18+ et npm 9+ installés
- [ ] PostgreSQL 15+ disponible (local ou Docker)
- [ ] Redis 7+ disponible (local ou Docker)
- [ ] Dépôt cloné et `npm install` exécuté
- [ ] Fichier `.env` créé et configuré
- [ ] Migrations Prisma appliquées (`npx prisma migrate deploy`)
- [ ] Client Prisma généré (`npx prisma generate`)
- [ ] Données de départ chargées (`npx prisma db seed`)
- [ ] Serveur de développement démarré (`npm run dev`)
- [ ] Worker BullMQ démarré dans un second terminal (`npm run worker`)
- [ ] Accès confirmé sur [http://localhost:3000](http://localhost:3000)

---

## Table des matières

1. [Prérequis](#1-prérequis)
2. [Installation rapide](#2-installation-rapide)
3. [Services externes — PostgreSQL et Redis](#3-services-externes--postgresql-et-redis)
4. [MinIO (optionnel)](#4-minio-optionnel)
5. [Base de données](#5-base-de-données)
6. [Premier démarrage](#6-premier-démarrage)
7. [Vérification](#7-vérification)
8. [Configuration des variables d'environnement](#8-configuration-des-variables-denvironnement)
9. [Recommandations pour l'environnement de développement](#9-recommandations-pour-lenvironnement-de-développement)
10. [Résolution des problèmes courants](#10-résolution-des-problèmes-courants)

---

## 1. Prérequis

### Logiciels requis

| Outil | Version minimale | Vérification |
|---|---|---|
| Node.js | 18.x LTS ou supérieur | `node --version` |
| npm | 9.x ou supérieur | `npm --version` |
| Git | 2.x ou supérieur | `git --version` |
| Docker *(recommandé)* | 24.x ou supérieur | `docker --version` |

### Services requis

| Service | Version minimale | Rôle |
|---|---|---|
| PostgreSQL | 15+ | Base de données principale |
| Redis | 7+ | File d'attente BullMQ |
| MinIO | Dernière stable | Stockage d'assets *(optionnel)* |

### Installer Node.js (si nécessaire)

**Via nvm (recommandé) :**

```bash
# Installer nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Recharger le shell
source ~/.zshrc   # ou ~/.bashrc selon votre shell

# Installer et activer Node 18 LTS
nvm install 18
nvm use 18
nvm alias default 18
```

**Via le site officiel :**  
Télécharger l'installeur LTS sur [https://nodejs.org](https://nodejs.org).

---

## 2. Installation rapide

### 2.1 Cloner le dépôt

```bash
git clone <URL_DU_DEPOT> maono-ops
cd maono-ops
```

### 2.2 Installer les dépendances

```bash
npm install
```

> Cette commande installe toutes les dépendances listées dans `package.json`, y compris Next.js, Prisma, NextAuth, BullMQ, TailwindCSS et bcryptjs.

### 2.3 Créer le fichier d'environnement

```bash
cp .env.example .env
```

### 2.4 Configurer le fichier `.env`

Ouvrir `.env` dans votre éditeur et renseigner les valeurs. La section [Configuration des variables d'environnement](#8-configuration-des-variables-denvironnement) détaille chaque paramètre.

```bash
# Exemple avec VS Code
code .env
```

Exemple de contenu minimal pour démarrer en local :

```dotenv
# Auth
AUTH_SECRET="remplacez-par-une-chaine-aleatoire-de-32-caracteres-minimum"
NEXTAUTH_URL="http://localhost:3000"

# Base de données
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/maono_ops"

# Redis
REDIS_URL="redis://localhost:6379"

# Dev uniquement — contourne l'authentification JWT
DEV_AUTH_BYPASS="true"
```

> **Générer un `AUTH_SECRET` sécurisé :**
> ```bash
> openssl rand -base64 32
> ```

---

## 3. Services externes — PostgreSQL et Redis

### 3.1 PostgreSQL avec Docker

Démarrer un conteneur PostgreSQL 15 :

```bash
docker run -d \
  --name maono-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=maono_ops \
  -p 5432:5432 \
  postgres:15-alpine
```

Vérifier que le conteneur est actif :

```bash
docker ps | grep maono-postgres
```

Tester la connexion :

```bash
docker exec -it maono-postgres psql -U postgres -d maono_ops -c "\l"
```

### 3.2 Redis avec Docker

Démarrer un conteneur Redis 7 :

```bash
docker run -d \
  --name maono-redis \
  -p 6379:6379 \
  redis:7-alpine
```

Vérifier que Redis répond :

```bash
docker exec -it maono-redis redis-cli ping
# Résultat attendu : PONG
```

### 3.3 Démarrer les deux services ensemble (Docker Compose)

Si vous préférez utiliser Docker Compose, créez un fichier `docker-compose.dev.yml` à la racine du projet :

```yaml
version: "3.9"
services:
  postgres:
    image: postgres:15-alpine
    container_name: maono-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: maono_ops
    ports:
      - "5432:5432"
    volumes:
      - maono_pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: maono-redis
    ports:
      - "6379:6379"

volumes:
  maono_pgdata:
```

Puis lancer les services :

```bash
docker compose -f docker-compose.dev.yml up -d
```

Arrêter les services :

```bash
docker compose -f docker-compose.dev.yml down
```

---

## 4. MinIO (optionnel)

MinIO est nécessaire uniquement si vous travaillez avec l'upload d'assets (images, fichiers). En mode développement sans MinIO, les fonctionnalités d'upload seront désactivées mais le reste de l'application fonctionnera normalement.

### 4.1 Démarrer MinIO avec Docker

```bash
docker run -d \
  --name maono-minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  -v maono_minio_data:/data \
  minio/minio server /data --console-address ":9001"
```

### 4.2 Créer le bucket

**Option A — Via l'interface web :**

1. Ouvrir [http://localhost:9001](http://localhost:9001)
2. Se connecter avec `minioadmin` / `minioadmin`
3. Aller dans **Buckets** → **Create Bucket**
4. Nommer le bucket `maono-assets`
5. Cliquer **Create Bucket**

**Option B — Via le client mc (MinIO Client) :**

```bash
# Installer mc
brew install minio/stable/mc   # macOS
# ou : curl https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc && chmod +x /usr/local/bin/mc

# Configurer l'alias
mc alias set local http://localhost:9000 minioadmin minioadmin

# Créer le bucket
mc mb local/maono-assets

# Vérifier
mc ls local
```

### 4.3 Configurer `.env` pour MinIO

```dotenv
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="maono-assets"
```

---

## 5. Base de données

Assurez-vous que PostgreSQL est démarré et que `DATABASE_URL` est correctement défini dans `.env` avant de continuer.

### 5.1 Appliquer les migrations

```bash
npx prisma migrate deploy
```

> Cette commande applique toutes les migrations présentes dans `prisma/migrations/` sans en créer de nouvelles. Elle est idéale pour les environnements de développement et de production.

Résultat attendu :

```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "maono_ops" at "localhost:5432"

N migrations found in prisma/migrations

Applying migration `<timestamp>_<nom_migration>`...

All migrations have been successfully applied.
```

### 5.2 Générer le client Prisma

```bash
npx prisma generate
```

> Cette commande génère le client TypeScript Prisma à partir du schéma. Elle doit être relancée à chaque modification du fichier `prisma/schema.prisma`.

### 5.3 Charger les données de départ (seed)

```bash
npx prisma db seed
```

Le script `prisma/seed.ts` crée les comptes utilisateurs initiaux :

| Rôle | Email | Mot de passe | Permissions |
|---|---|---|---|
| Administrateur | `admin@maono-ops.com` | `Admin1234!` | Accès complet (ADMIN) |
| Éditeur | `editor@maono-ops.com` | `Editor1234!` | Planification de contenu (CONTENT_PLANNER) |

> **Important :** Changez ces mots de passe immédiatement en production.

### 5.4 Inspecter la base de données (optionnel)

```bash
# Ouvrir Prisma Studio — interface graphique pour la BDD
npx prisma studio
```

Prisma Studio sera disponible sur [http://localhost:5555](http://localhost:5555).

---

## 6. Premier démarrage

Maono Ops nécessite **deux processus** qui tournent en parallèle. Ouvrez deux fenêtres de terminal.

### Terminal 1 — Serveur Next.js

```bash
npm run dev
```

Résultat attendu :

```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Environments: .env

 ✓ Starting...
 ✓ Ready in Xs
```

### Terminal 2 — Worker BullMQ

```bash
npm run worker
```

> Ce processus traite les tâches en arrière-plan (envois d'emails, exports, traitements asynchrones) via la file d'attente Redis.

### Mode de contournement d'authentification (développement)

En développement, si `DEV_AUTH_BYPASS=true` est défini dans `.env`, le middleware d'authentification JWT est désactivé. Vous pouvez accéder à l'application sans vous authentifier, ce qui facilite le développement et les tests.

> **Ne jamais activer `DEV_AUTH_BYPASS=true` en production.**

---

## 7. Vérification

Une fois les deux processus démarrés, vérifiez les points suivants :

### URLs à ouvrir

| Service | URL | Résultat attendu |
|---|---|---|
| Application principale | [http://localhost:3000](http://localhost:3000) | Page d'accueil Maono Ops |
| Page de connexion | [http://localhost:3000/login](http://localhost:3000/login) | Formulaire de connexion |
| Prisma Studio | [http://localhost:5555](http://localhost:5555) | Interface BDD (si lancée) |
| MinIO Console | [http://localhost:9001](http://localhost:9001) | Interface MinIO (si lancée) |

### Test de connexion

1. Ouvrir [http://localhost:3000/login](http://localhost:3000/login)
2. Se connecter avec `admin@maono-ops.com` / `Admin1234!`
3. Vérifier que le tableau de bord s'affiche correctement

### Vérification des services en ligne de commande

```bash
# Vérifier que Next.js répond
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Résultat attendu : 200

# Vérifier Redis
redis-cli -u redis://localhost:6379 ping
# Résultat attendu : PONG

# Vérifier PostgreSQL
psql postgresql://postgres:postgres@localhost:5432/maono_ops -c "SELECT version();"
```

---

## 8. Configuration des variables d'environnement

Voici la liste complète des variables d'environnement supportées par Maono Ops.

### Authentification

| Variable | Requis | Description | Exemple |
|---|---|---|---|
| `AUTH_SECRET` | **Requis** | Clé secrète pour signer les tokens JWT NextAuth. Minimum 32 caractères. | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | **Requis** | URL publique de l'application. Doit correspondre exactement au domaine utilisé. | `http://localhost:3000` |

### Base de données

| Variable | Requis | Description | Exemple |
|---|---|---|---|
| `DATABASE_URL` | **Requis** | URL de connexion PostgreSQL complète au format `postgresql://USER:PASS@HOST:PORT/DB`. | `postgresql://postgres:postgres@localhost:5432/maono_ops` |

### Redis

| Variable | Requis | Description | Exemple |
|---|---|---|---|
| `REDIS_URL` | **Requis** | URL de connexion Redis. Utilisé par BullMQ pour les files d'attente. | `redis://localhost:6379` |

### Stockage S3 / MinIO

| Variable | Requis | Description | Exemple |
|---|---|---|---|
| `S3_ENDPOINT` | Optionnel | URL du point d'entrée S3 ou MinIO. | `http://localhost:9000` |
| `S3_ACCESS_KEY` | Optionnel | Clé d'accès S3 / identifiant MinIO. | `minioadmin` |
| `S3_SECRET_KEY` | Optionnel | Clé secrète S3 / mot de passe MinIO. | `minioadmin` |
| `S3_BUCKET` | Optionnel | Nom du bucket S3/MinIO à utiliser pour les assets. | `maono-assets` |

### Développement

| Variable | Requis | Description | Exemple |
|---|---|---|---|
| `DEV_AUTH_BYPASS` | Optionnel | Si `true`, contourne le middleware d'authentification JWT. **Dev uniquement.** | `true` |

### Fichier `.env` complet de référence

```dotenv
# ============================================================
# MAONO OPS — Configuration d'environnement
# Copier ce fichier en .env et adapter les valeurs
# ============================================================

# --- Authentification (REQUIS) ---
AUTH_SECRET="remplacez-par-une-chaine-aleatoire-de-32-caracteres-minimum"
NEXTAUTH_URL="http://localhost:3000"

# --- Base de données PostgreSQL (REQUIS) ---
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/maono_ops"

# --- Redis / BullMQ (REQUIS) ---
REDIS_URL="redis://localhost:6379"

# --- Stockage S3 / MinIO (OPTIONNEL) ---
# Laisser vides pour désactiver l'upload d'assets
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="maono-assets"

# --- Développement uniquement (NE PAS activer en production) ---
DEV_AUTH_BYPASS="true"
```

---

## 9. Recommandations pour l'environnement de développement

### Système d'exploitation

| OS | Support | Notes |
|---|---|---|
| macOS (Sonoma/Sequoia) | Recommandé | Développement et tests effectués sur macOS |
| Linux (Ubuntu 22.04+, Debian 12+) | Recommandé | Idéal pour les environnements CI/CD et serveurs |
| Windows 11 + WSL2 | Supporté | Utiliser WSL2 avec Ubuntu ; éviter PowerShell natif |

### Éditeur recommandé — VS Code

Télécharger [Visual Studio Code](https://code.visualstudio.com/).

### Extensions VS Code recommandées

Installer via le marketplace VS Code ou via la ligne de commande :

```bash
# Prisma — coloration syntaxique et autocomplétion pour les schémas Prisma
code --install-extension Prisma.prisma

# ESLint — linting TypeScript/JavaScript en temps réel
code --install-extension dbaeumer.vscode-eslint

# Tailwind CSS IntelliSense — autocomplétion des classes Tailwind
code --install-extension bradlc.vscode-tailwindcss

# Prettier — formatage automatique du code
code --install-extension esbenp.prettier-vscode

# DotENV — coloration syntaxique pour les fichiers .env
code --install-extension mikestead.dotenv

# Thunder Client — client HTTP intégré pour tester les API
code --install-extension rangav.vscode-thunder-client
```

### Paramètres VS Code suggérés

Créer ou modifier `.vscode/settings.json` à la racine du projet :

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Outils complémentaires utiles

```bash
# TablePlus ou DBeaver — client graphique PostgreSQL
brew install --cask tableplus    # macOS

# RedisInsight — interface graphique Redis
brew install --cask redisinsight  # macOS
```

---

## 10. Résolution des problèmes courants

### Erreur : Port 3000 déjà utilisé

**Symptôme :**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution :**

```bash
# Identifier le processus qui utilise le port 3000
lsof -ti:3000

# Terminer le processus (remplacer <PID> par le numéro obtenu)
kill -9 <PID>

# Ou, en une seule commande
kill -9 $(lsof -ti:3000)

# Alternative : utiliser un autre port
PORT=3001 npm run dev
```

---

### Erreur : Client Prisma non généré

**Symptôme :**
```
Error: @prisma/client did not initialize yet. Please run "prisma generate"
```
ou
```
Cannot find module '@prisma/client'
```

**Solution :**

```bash
# Générer le client Prisma
npx prisma generate

# Si l'erreur persiste, supprimer node_modules et réinstaller
rm -rf node_modules/.prisma
npm install
npx prisma generate
```

---

### Erreur : AUTH_SECRET manquant

**Symptôme :**
```
[next-auth][error][NO_SECRET]
MissingSecret: Please define a `secret` [...]
```
ou l'application redirige en boucle vers `/login`.

**Solution :**

1. Vérifier que `.env` existe et contient `AUTH_SECRET`
2. Générer une valeur sécurisée :
   ```bash
   openssl rand -base64 32
   ```
3. Copier le résultat dans `.env` :
   ```dotenv
   AUTH_SECRET="le-resultat-de-la-commande-ci-dessus"
   ```
4. Redémarrer le serveur de développement

---

### Erreur : Connexion à la base de données refusée

**Symptôme :**
```
PrismaClientInitializationError: Can't reach database server at `localhost:5432`
```
ou
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution :**

```bash
# Vérifier que PostgreSQL tourne
docker ps | grep postgres
# ou, si installé localement :
pg_isready -h localhost -p 5432

# Si le conteneur Docker est arrêté, le redémarrer
docker start maono-postgres

# Vérifier que DATABASE_URL dans .env est correct
# Format : postgresql://USER:PASS@HOST:PORT/DATABASE
# Exemple : postgresql://postgres:postgres@localhost:5432/maono_ops

# Tester la connexion manuellement
psql postgresql://postgres:postgres@localhost:5432/maono_ops -c "\conninfo"
```

Si la base de données `maono_ops` n'existe pas :

```bash
docker exec -it maono-postgres psql -U postgres -c "CREATE DATABASE maono_ops;"
```

---

### Erreur : Redis non disponible

**Symptôme :**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
ou le worker BullMQ ne démarre pas.

**Solution :**

```bash
# Vérifier que Redis tourne
docker ps | grep redis
# ou, si installé localement :
redis-cli ping

# Si le conteneur Docker est arrêté, le redémarrer
docker start maono-redis

# Vérifier que REDIS_URL dans .env est correct
# Format : redis://HOST:PORT
# Exemple : redis://localhost:6379

# Tester la connexion
redis-cli -u redis://localhost:6379 ping
# Résultat attendu : PONG
```

---

### Erreur : Migration Prisma échoue

**Symptôme :**
```
Error: P3005: The database schema is not empty.
```
ou conflits de migrations.

**Solution :**

```bash
# Pour un environnement de développement — réinitialiser complètement la BDD
npx prisma migrate reset
# (Attention : supprime toutes les données)

# Puis relancer les migrations et le seed
npx prisma migrate deploy
npx prisma db seed
```

---

### Le worker BullMQ ne traite pas les jobs

**Symptôme :** Les tâches s'accumulent dans la file sans être traitées.

**Solution :**

```bash
# Vérifier que le worker tourne dans un terminal séparé
npm run worker

# Vérifier que REDIS_URL est identique dans .env pour Next.js et le worker
# Les deux processus doivent pointer vers le même serveur Redis

# Inspecter les queues via RedisInsight ou redis-cli
redis-cli -u redis://localhost:6379 keys "bull:*"
```

---

## Annexe — Commandes de référence rapide

```bash
# Démarrer tous les services Docker
docker start maono-postgres maono-redis maono-minio

# Arrêter tous les services Docker
docker stop maono-postgres maono-redis maono-minio

# Voir les logs d'un service
docker logs -f maono-postgres
docker logs -f maono-redis

# Réinitialiser la base de données (dev uniquement)
npx prisma migrate reset

# Mettre à jour le schéma après modification de prisma/schema.prisma
npx prisma migrate dev --name "description_de_la_migration"
npx prisma generate

# Ouvrir Prisma Studio
npx prisma studio

# Vérifier les variables d'environnement chargées par Next.js
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"

# Construire l'application pour la production
npm run build

# Démarrer en mode production (après build)
npm run start
```

---

*Documentation générée pour Maono Ops — Marketing Operations Platform.*  
*Pour toute question, consulter le dépôt du projet ou contacter l'équipe technique.*
