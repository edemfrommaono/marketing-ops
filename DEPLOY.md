# Guide de Déploiement — Maono Ops Marketing Operations Platform

> Version: 1.0 — Avril 2026  
> Stack: Next.js 14 · TypeScript · Prisma 5 / PostgreSQL · NextAuth v5 · BullMQ · Redis · MinIO · Docker

---

## Table des matières

1. [Architecture de production](#1-architecture-de-production)
2. [Recommandations serveur](#2-recommandations-serveur)
3. [Docker Compose (production)](#3-docker-compose-production)
4. [Dockerfile multi-étapes](#4-dockerfile-multi-étapes)
5. [Configuration Nginx](#5-configuration-nginx)
6. [Variables d'environnement de production](#6-variables-denvironnement-de-production)
7. [Processus de déploiement initial](#7-processus-de-déploiement-initial)
8. [Mise à jour sans interruption de service](#8-mise-à-jour-sans-interruption-de-service)
9. [Sauvegardes](#9-sauvegardes)
10. [SSL avec Let's Encrypt](#10-ssl-avec-lets-encrypt)
11. [Monitoring recommandé](#11-monitoring-recommandé)
12. [Déploiement Railway (alternative simplifiée)](#12-déploiement-railway-alternative-simplifiée)

---

## 1. Architecture de production

```
                          ┌─────────────────────────────────────────────────────┐
                          │                    SERVEUR VPS / CLOUD              │
                          │                                                     │
  Navigateur              │  ┌──────────┐      ┌─────────────────────────┐     │
  client     ──HTTPS──►  │  │  Nginx   │──►  │   Next.js App            │     │
                          │  │ :80/:443 │      │   (port 3000)            │     │
                          │  └──────────┘      │                         │     │
                          │       │            │  • Rendu SSR/RSC         │     │
                          │       │            │  • API Routes            │     │
                          │       │            │  • NextAuth v5 JWT       │     │
                          │       │            │  • /client/[token]       │     │
                          │       │            └────────┬────────┬────────┘     │
                          │       │                     │        │              │
                          │       │            ┌────────▼─┐  ┌───▼────────┐   │
                          │       │            │PostgreSQL │  │  Redis     │   │
                          │       │            │ :5432     │  │  :6379     │   │
                          │       │            └──────────┘  └─────┬──────┘   │
                          │       │                                 │          │
                          │       │            ┌────────────────────▼────────┐ │
                          │       │            │   BullMQ Worker (process    │ │
                          │       │            │   séparé)                   │ │
                          │       │            │                             │ │
                          │       │            │  ──► Odoo API (HTTP)        │ │
                          │       │            │  ──► SMTP (emails)          │ │
                          │       │            └─────────────────────────────┘ │
                          │       │                                             │
                          │       └──────────► ┌──────────────────────────┐   │
                          │   (assets S3)       │   MinIO Object Storage   │   │
                          │                     │   :9000 (API)            │   │
                          │                     │   :9001 (Console)        │   │
                          │                     └──────────────────────────┘   │
                          └─────────────────────────────────────────────────────┘

  Flux portail client :
  Client ──HTTPS──► Nginx ──► Next.js App ──► /client/[token] (page SSR)
```

**Réseau interne Docker** : PostgreSQL, Redis et MinIO sont isolés sur le réseau `internal` — ils ne sont pas exposés à l'extérieur. Seuls Nginx (80/443) et MinIO console (optionnel, 9001) sont accessibles depuis l'extérieur.

---

## 2. Recommandations serveur

### Dimensionnement

| Profil | vCPU | RAM | Stockage | Utilisateurs |
|--------|------|-----|----------|--------------|
| Minimum | 2 vCPU | 4 GB | 50 GB SSD | < 10 |
| Recommandé | 4 vCPU | 8 GB | 100 GB SSD | 10 – 50 |
| Large | 8 vCPU | 16 GB | 200 GB SSD + CDN | 50+ |

### Système d'exploitation recommandé

**Ubuntu 22.04 LTS** (support jusqu'en avril 2027 + avril 2032 ESM).

### Fournisseurs cloud recommandés

| Fournisseur | Instance | Coût estimé/mois | Commentaire |
|-------------|----------|-------------------|-------------|
| **Hetzner Cloud** | CX21 / CX31 | 5–10 € | Meilleur rapport qualité/prix — datacenter EU |
| **OVHcloud** | VPS Value / Comfort | 6–14 € | Opérateur français, conformité RGPD facilitée |
| **AWS** | t3.medium / t3.large | 30–60 $ | Écosystème riche, facturation à l'usage |
| **Railway.app** | Starter / Pro | 5–20 $ | Déploiement le plus simple, voir section 12 |

> **Conseil** : Pour les équipes européennes, Hetzner (Nuremberg ou Helsinki) offre une latence optimale et des tarifs imbattables.

### Prérequis logiciels

```bash
# Versions minimum requises
Docker       >= 24.0
Docker Compose >= 2.20
Git          >= 2.34
```

---

## 3. Docker Compose (production)

Créez le fichier `docker-compose.prod.yml` à la racine du projet :

```yaml
# docker-compose.prod.yml
# Maono Ops — Stack de production complète

version: "3.9"

networks:
  internal:
    driver: bridge
    internal: true
  external:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  minio_data:
  nginx_certs:

services:

  # ─────────────────────────────────────────
  # Base de données PostgreSQL
  # ─────────────────────────────────────────
  db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-maono}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-maono_ops}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-maono} -d ${POSTGRES_DB:-maono_ops}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  # ─────────────────────────────────────────
  # Cache Redis (BullMQ + sessions)
  # ─────────────────────────────────────────
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - internal
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  # ─────────────────────────────────────────
  # Stockage objet MinIO (compatible S3)
  # ─────────────────────────────────────────
  minio:
    image: minio/minio:latest
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    volumes:
      - minio_data:/data
    networks:
      - internal
      - external
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3
      start_period: 30s

  # ─────────────────────────────────────────
  # Application Next.js
  # ─────────────────────────────────────────
  app:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    restart: unless-stopped
    env_file:
      - .env.prod
    environment:
      NODE_ENV: production
      PORT: 3000
    networks:
      - internal
      - external
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      minio:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # ─────────────────────────────────────────
  # Worker BullMQ (processus séparé)
  # ─────────────────────────────────────────
  worker:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    restart: unless-stopped
    command: ["node", "src/server/queue/worker.js"]
    env_file:
      - .env.prod
    environment:
      NODE_ENV: production
    networks:
      - internal
    depends_on:
      redis:
        condition: service_healthy
      db:
        condition: service_healthy

  # ─────────────────────────────────────────
  # Reverse proxy Nginx
  # ─────────────────────────────────────────
  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - nginx_certs:/etc/nginx/certs:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    networks:
      - external
    depends_on:
      - app
```

> **Note** : le service `nginx` monte `/etc/letsencrypt` en lecture seule depuis l'hôte, là où Certbot dépose les certificats (voir section 10).

---

## 4. Dockerfile multi-étapes

Créez le fichier `Dockerfile` à la racine du projet :

```dockerfile
# ─────────────────────────────────────────────────────────────────
# Maono Ops — Dockerfile multi-étapes (Next.js standalone output)
# ─────────────────────────────────────────────────────────────────

# ── Étape 1 : Installation des dépendances ──────────────────────
FROM node:18-alpine AS deps

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci --only=production --ignore-scripts \
    && npm ci --ignore-scripts

# ── Étape 2 : Build de l'application ────────────────────────────
FROM node:18-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Génération du client Prisma
RUN npx prisma generate

# Build Next.js en mode standalone
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ── Étape 3 : Image de production (runner) ──────────────────────
FROM node:18-alpine AS runner

RUN apk add --no-cache curl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copie du build standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copie du client Prisma généré
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copie du worker BullMQ
COPY --from=builder /app/src/server ./src/server

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

> **Prérequis** : votre `next.config.js` doit contenir `output: "standalone"` :
> ```js
> // next.config.js
> module.exports = {
>   output: "standalone",
> };
> ```

---

## 5. Configuration Nginx

Créez le répertoire et le fichier de configuration :

```bash
mkdir -p nginx
```

Créez le fichier `nginx/nginx.conf` :

```nginx
# ─────────────────────────────────────────────────────────────────
# Maono Ops — Configuration Nginx (reverse proxy + SSL)
# ─────────────────────────────────────────────────────────────────

user  nginx;
worker_processes  auto;
error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
    use epoll;
    multi_accept on;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # ── Logging ──────────────────────────────────────────────────
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';
    access_log  /var/log/nginx/access.log  main;

    # ── Performance ───────────────────────────────────────────────
    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    # ── Compression Gzip ──────────────────────────────────────────
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_min_length 256;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/x-javascript
        application/xml
        application/xml+rss
        application/vnd.ms-fontobject
        application/x-font-ttf
        font/opentype
        image/svg+xml
        image/x-icon;

    # ── En-têtes de sécurité ──────────────────────────────────────
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # ── Upstream Next.js ──────────────────────────────────────────
    upstream nextjs_app {
        server app:3000;
        keepalive 32;
    }

    # ── Redirection HTTP → HTTPS ──────────────────────────────────
    server {
        listen 80;
        listen [::]:80;
        server_name _;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # ── Serveur HTTPS principal ────────────────────────────────────
    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;

        # Remplacez votre-domaine.com par votre vrai domaine
        server_name votre-domaine.com www.votre-domaine.com;

        # ── Certificats SSL (Let's Encrypt via Certbot) ───────────
        ssl_certificate     /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

        # ── Paramètres SSL modernes ───────────────────────────────
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 1d;
        ssl_session_tickets off;
        ssl_stapling on;
        ssl_stapling_verify on;

        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

        # ── Cache des fichiers statiques Next.js ──────────────────
        location /_next/static/ {
            proxy_pass http://nextjs_app;
            proxy_cache_valid 200 365d;
            add_header Cache-Control "public, max-age=31536000, immutable";
            proxy_http_version 1.1;
        }

        # ── Fichiers publics statiques ────────────────────────────
        location /static/ {
            proxy_pass http://nextjs_app;
            add_header Cache-Control "public, max-age=86400";
            proxy_http_version 1.1;
        }

        # ── Support WebSocket (HMR / live updates) ────────────────
        location /_next/webpack-hmr {
            proxy_pass http://nextjs_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # ── Proxy principal vers Next.js ──────────────────────────
        location / {
            proxy_pass http://nextjs_app;
            proxy_http_version 1.1;

            # En-têtes WebSocket
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';

            # En-têtes de forwarding
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;

            proxy_cache_bypass $http_upgrade;
            proxy_buffering off;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }
    }
}
```

> **Remplacez** toutes les occurrences de `votre-domaine.com` par votre vrai nom de domaine avant de déployer.

---

## 6. Variables d'environnement de production

Créez le fichier `.env.prod` à la racine du projet (ne jamais le committer dans Git) :

```bash
# Ajoutez .env.prod à .gitignore
echo ".env.prod" >> .gitignore
```

### Tableau des variables

| Variable | Exemple / Commande | Obligatoire | Description |
|----------|--------------------|-------------|-------------|
| `NODE_ENV` | `production` | Oui | Mode d'exécution Node.js |
| `AUTH_SECRET` | `$(openssl rand -base64 32)` | **Critique** | Clé de signature JWT NextAuth — doit être aléatoire et secrète |
| `NEXTAUTH_URL` | `https://votre-domaine.com` | **Critique** | URL publique exacte de l'application |
| `DATABASE_URL` | `postgresql://user:pass@db:5432/maono_ops?schema=public` | Oui | Connexion Prisma vers PostgreSQL |
| `REDIS_URL` | `redis://redis:6379` | Oui | Connexion BullMQ et cache Redis |
| `POSTGRES_USER` | `maono` | Oui | Identifiant PostgreSQL (aussi utilisé par le service db) |
| `POSTGRES_PASSWORD` | *(mot de passe fort)* | Oui | Mot de passe PostgreSQL |
| `POSTGRES_DB` | `maono_ops` | Oui | Nom de la base de données |
| `MINIO_ROOT_USER` | `maono_admin` | Oui | Identifiant admin MinIO |
| `MINIO_ROOT_PASSWORD` | *(mot de passe fort)* | Oui | Mot de passe admin MinIO |
| `MINIO_ENDPOINT` | `http://minio:9000` | Oui | Endpoint interne MinIO |
| `MINIO_BUCKET` | `maono-assets` | Oui | Nom du bucket par défaut |
| `ODOO_URL` | `https://odoo.votre-domaine.com` | Conditionnel | URL de l'instance Odoo |
| `ODOO_DB` | `odoo_production` | Conditionnel | Base de données Odoo |
| `ODOO_USERNAME` | `admin` | Conditionnel | Identifiant Odoo |
| `ODOO_PASSWORD` | *(mot de passe fort)* | Conditionnel | Mot de passe Odoo |
| `SMTP_HOST` | `smtp.sendgrid.net` | Oui | Serveur SMTP pour les emails |
| `SMTP_PORT` | `587` | Oui | Port SMTP |
| `SMTP_USER` | `apikey` | Oui | Identifiant SMTP |
| `SMTP_PASSWORD` | *(clé API)* | Oui | Mot de passe / clé API SMTP |
| `SMTP_FROM` | `noreply@votre-domaine.com` | Oui | Adresse expéditeur par défaut |
| `DEV_AUTH_BYPASS` | *(absent ou `false`)* | Non | **Ne jamais mettre `true` en production** |

### Génération de `AUTH_SECRET`

```bash
openssl rand -base64 32
```

Exemple de fichier `.env.prod` complet :

```dotenv
# ─── Application ──────────────────────────────────────────────
NODE_ENV=production
AUTH_SECRET=REMPLACEZ_PAR_openssl_rand_-base64_32
NEXTAUTH_URL=https://votre-domaine.com

# ─── Base de données ─────────────────────────────────────────
POSTGRES_USER=maono
POSTGRES_PASSWORD=MotDePasseTresSecurise123!
POSTGRES_DB=maono_ops
DATABASE_URL=postgresql://maono:MotDePasseTresSecurise123!@db:5432/maono_ops?schema=public

# ─── Redis ────────────────────────────────────────────────────
REDIS_URL=redis://redis:6379

# ─── MinIO ────────────────────────────────────────────────────
MINIO_ROOT_USER=maono_admin
MINIO_ROOT_PASSWORD=MotDePasseMinIO456!
MINIO_ENDPOINT=http://minio:9000
MINIO_BUCKET=maono-assets

# ─── Odoo ─────────────────────────────────────────────────────
ODOO_URL=https://odoo.votre-domaine.com
ODOO_DB=odoo_production
ODOO_USERNAME=admin
ODOO_PASSWORD=MotDePasseOdoo789!

# ─── Email SMTP ───────────────────────────────────────────────
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.votre_cle_sendgrid
SMTP_FROM=noreply@votre-domaine.com
```

> **Avertissement `DATABASE_URL` et connection pooling** : En production avec de nombreuses connexions simultanées, ajoutez le suffixe `?pgbouncer=true` si vous utilisez PgBouncer en frontal, ou configurez Prisma avec `connection_limit=1` pour le worker :
> ```
> DATABASE_URL=postgresql://maono:pass@pgbouncer:6432/maono_ops?pgbouncer=true&connection_limit=1
> ```

> **Avertissement `DEV_AUTH_BYPASS`** : Cette variable doit être **absente** ou définie à `false` en production. La laisser à `true` désactive entièrement l'authentification.

> **Avertissement `AUTH_SECRET`** : Ne jamais utiliser une valeur par défaut ou un mot de passe mémorisable. Générez toujours avec `openssl rand -base64 32` et stockez la valeur dans un gestionnaire de secrets (Vault, AWS Secrets Manager, etc.).

---

## 7. Processus de déploiement initial

### Étape 1 — Provisionner le serveur

```bash
# Depuis votre machine locale : copier votre clé SSH publique sur le serveur
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@ADRESSE_IP_SERVEUR

# Se connecter au serveur
ssh root@ADRESSE_IP_SERVEUR

# Mettre à jour le système
apt update && apt upgrade -y

# Créer un utilisateur de déploiement non-root
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Configurer un fichier swap (recommandé pour serveurs < 8 GB RAM)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### Étape 2 — Installer Docker et Docker Compose

```bash
# Passer sur l'utilisateur deploy
su - deploy

# Installer Docker (méthode officielle)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter l'utilisateur deploy au groupe docker
sudo usermod -aG docker deploy
newgrp docker

# Vérifier l'installation
docker --version
docker compose version
```

### Étape 3 — Cloner le dépôt

```bash
# Sur le serveur, en tant qu'utilisateur deploy
cd /opt
sudo mkdir -p maono-ops
sudo chown deploy:deploy maono-ops
cd maono-ops

git clone https://github.com/votre-org/maono-ops.git .
# Ou avec SSH :
# git clone git@github.com:votre-org/maono-ops.git .
```

### Étape 4 — Configurer les variables d'environnement

```bash
# Copier le template et l'éditer
cp .env.example .env.prod

# Générer AUTH_SECRET automatiquement
AUTH_SECRET=$(openssl rand -base64 32)
sed -i "s/REMPLACEZ_PAR_openssl_rand_-base64_32/$AUTH_SECRET/" .env.prod

# Éditer les autres variables
nano .env.prod
```

Vérifiez que les points suivants sont corrects dans `.env.prod` :
- `NEXTAUTH_URL` correspond exactement à l'URL publique avec le bon protocole (`https://`)
- `DATABASE_URL` utilise le nom de service Docker `db` (pas `localhost`)
- `REDIS_URL` utilise le nom de service Docker `redis`
- `DEV_AUTH_BYPASS` est absent ou `false`

### Étape 5 — Créer la structure Nginx

```bash
mkdir -p nginx
# Copier la configuration nginx (cf. section 5)
# Remplacer votre-domaine.com par votre vrai domaine
nano nginx/nginx.conf
```

### Étape 6 — Construire les images Docker

```bash
docker compose -f docker-compose.prod.yml build
```

> **Note** : Ce build peut prendre 5 à 15 minutes lors de la première exécution. Les builds suivants seront plus rapides grâce au cache Docker.

### Étape 7 — Démarrer les services

```bash
# Démarrer tous les services en arrière-plan
docker compose -f docker-compose.prod.yml up -d

# Vérifier que tous les services sont démarrés
docker compose -f docker-compose.prod.yml ps
```

Tous les services doivent afficher le statut `running` (sauf si `healthy` est configuré, auquel cas attendez que le healthcheck passe).

### Étape 8 — Exécuter les migrations Prisma

```bash
# Appliquer les migrations de schéma (TOUJOURS utiliser migrate deploy en production)
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

> **Important** : N'utilisez jamais `prisma db push` en production — cette commande peut supprimer des données. Utilisez exclusivement `prisma migrate deploy`.

### Étape 9 — Initialiser les données (seed)

```bash
# Créer les données initiales (utilisateurs admin, données de référence, etc.)
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

### Étape 10 — Vérifier les logs

```bash
# Logs en temps réel de tous les services
docker compose -f docker-compose.prod.yml logs -f

# Logs d'un service spécifique
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f worker
docker compose -f docker-compose.prod.yml logs -f nginx

# Vérifier l'état des healthchecks
docker compose -f docker-compose.prod.yml ps
```

L'application doit être accessible sur `https://votre-domaine.com`.

---

## 8. Mise à jour sans interruption de service

Voici la procédure de mise à jour recommandée (zero-downtime) :

```bash
# 1. Récupérer les dernières modifications du dépôt
git pull origin main

# 2. Reconstruire uniquement les services modifiés (app et worker)
docker compose -f docker-compose.prod.yml build app worker

# 3. Redémarrer uniquement app et worker sans toucher aux autres services
docker compose -f docker-compose.prod.yml up -d --no-deps app worker

# 4. Appliquer les nouvelles migrations de base de données
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# 5. Vérifier que les services sont sains
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=50 app worker
```

> **Conseil** : L'option `--no-deps` redémarre uniquement les services `app` et `worker` sans toucher à PostgreSQL, Redis, MinIO ou Nginx. Cela minimise l'interruption de service.

### Script de déploiement automatisé

Vous pouvez créer un script `deploy.sh` à la racine :

```bash
#!/bin/bash
set -e

echo "==> Pulling latest changes..."
git pull origin main

echo "==> Building updated images..."
docker compose -f docker-compose.prod.yml build app worker

echo "==> Restarting app services..."
docker compose -f docker-compose.prod.yml up -d --no-deps app worker

echo "==> Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T app npx prisma migrate deploy

echo "==> Checking service health..."
docker compose -f docker-compose.prod.yml ps

echo "==> Deploy complete!"
```

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 9. Sauvegardes

### PostgreSQL — Sauvegarde quotidienne

```bash
# Créer le répertoire de sauvegardes
mkdir -p /opt/maono-ops/backups/postgres

# Test manuel d'un dump PostgreSQL
docker compose -f /opt/maono-ops/docker-compose.prod.yml exec -T db \
  pg_dump -U maono maono_ops | gzip > /opt/maono-ops/backups/postgres/backup-$(date +%Y%m%d-%H%M%S).sql.gz

# Configurer une tâche cron (chaque jour à 2h00)
crontab -e
```

Ajoutez la ligne suivante dans le crontab :

```cron
0 2 * * * docker compose -f /opt/maono-ops/docker-compose.prod.yml exec -T db pg_dump -U maono maono_ops | gzip > /opt/maono-ops/backups/postgres/backup-$(date +\%Y\%m\%d-\%H\%M\%S).sql.gz 2>> /var/log/maono-backup.log
```

Ajoutez également une rotation des sauvegardes (conservation 30 jours) :

```cron
0 3 * * * find /opt/maono-ops/backups/postgres/ -name "*.sql.gz" -mtime +30 -delete
```

### Restauration PostgreSQL

```bash
# Restaurer depuis une sauvegarde
gunzip -c /opt/maono-ops/backups/postgres/backup-20260418-020000.sql.gz | \
  docker compose -f /opt/maono-ops/docker-compose.prod.yml exec -T db \
  psql -U maono maono_ops
```

### MinIO — Synchronisation vers un bucket distant

Installez le client MinIO `mc` sur l'hôte :

```bash
curl https://dl.min.io/client/mc/release/linux-amd64/mc -o /usr/local/bin/mc
chmod +x /usr/local/bin/mc

# Configurer l'alias pour MinIO local
mc alias set maono-local http://localhost:9000 MINIO_ROOT_USER MINIO_ROOT_PASSWORD

# Configurer l'alias pour le stockage distant (ex: AWS S3)
mc alias set maono-remote https://s3.amazonaws.com AWS_ACCESS_KEY AWS_SECRET_KEY

# Test de synchronisation manuelle
mc mirror maono-local/maono-assets maono-remote/maono-assets-backup

# Cron quotidien à 3h30
0 3 30 * * * mc mirror maono-local/maono-assets maono-remote/maono-assets-backup >> /var/log/maono-minio-backup.log 2>&1
```

### Redis — Snapshots RDB

Redis génère automatiquement des snapshots RDB dans le volume Docker `redis_data`. Pour une sauvegarde manuelle :

```bash
# Forcer un snapshot immédiat
docker compose -f docker-compose.prod.yml exec redis redis-cli BGSAVE

# Copier le dump.rdb depuis le conteneur
docker cp $(docker compose -f docker-compose.prod.yml ps -q redis):/data/dump.rdb \
  /opt/maono-ops/backups/redis-dump-$(date +%Y%m%d).rdb
```

> **Conseil** : Redis stocke uniquement des données temporaires (files BullMQ, cache). La perte des données Redis est récupérable — concentrez vos efforts de sauvegarde sur PostgreSQL et MinIO.

---

## 10. SSL avec Let's Encrypt

### Installation de Certbot

```bash
# Ubuntu 22.04
sudo apt update
sudo apt install -y certbot

# Générer un certificat (mode standalone — Nginx doit être arrêté)
sudo docker compose -f /opt/maono-ops/docker-compose.prod.yml stop nginx

sudo certbot certonly \
  --standalone \
  --preferred-challenges http \
  --email votre@email.com \
  --agree-tos \
  --no-eff-email \
  -d votre-domaine.com \
  -d www.votre-domaine.com

# Redémarrer Nginx après obtention du certificat
sudo docker compose -f /opt/maono-ops/docker-compose.prod.yml start nginx
```

Les certificats sont déposés dans `/etc/letsencrypt/live/votre-domaine.com/` et montés dans le conteneur Nginx via le volume défini dans `docker-compose.prod.yml`.

### Renouvellement automatique

Certbot installe automatiquement un timer systemd. Vérifiez-le :

```bash
# Vérifier le timer de renouvellement automatique
systemctl status certbot.timer

# Test de renouvellement (dry-run)
sudo certbot renew --dry-run
```

Si le timer n'est pas actif, ajoutez un cron manuel :

```bash
crontab -e
```

```cron
0 0 1,15 * * certbot renew --quiet --deploy-hook "docker compose -f /opt/maono-ops/docker-compose.prod.yml exec -T nginx nginx -s reload"
```

> **Note** : Certbot renouvelle les certificats 30 jours avant expiration. Les certificats Let's Encrypt sont valides 90 jours.

---

## 11. Monitoring recommandé

### Logs en temps réel

```bash
# Tous les services
docker compose -f docker-compose.prod.yml logs -f

# Application Next.js uniquement
docker compose -f docker-compose.prod.yml logs -f app

# Worker BullMQ uniquement
docker compose -f docker-compose.prod.yml logs -f worker

# Dernières 100 lignes sans suivre
docker compose -f docker-compose.prod.yml logs --tail=100 app worker
```

### Uptime Kuma (monitoring de disponibilité — auto-hébergé)

```bash
# Démarrer Uptime Kuma sur le même serveur (port 3001)
docker run -d \
  --name uptime-kuma \
  --restart unless-stopped \
  -p 3001:3001 \
  -v uptime-kuma-data:/app/data \
  louislam/uptime-kuma:latest
```

Accédez à `http://ADRESSE_IP:3001` et configurez des moniteurs pour :
- `https://votre-domaine.com` (HTTP/HTTPS)
- `https://votre-domaine.com/api/health` (API health check)

Alternatives hébergées : **Better Uptime** (betteruptime.com) ou **UptimeRobot**.

### Administration PostgreSQL — Adminer

```bash
# Démarrer Adminer (interface web légère pour PostgreSQL)
docker run -d \
  --name adminer \
  --restart unless-stopped \
  -p 8080:8080 \
  --network maono-ops_internal \
  adminer:latest
```

> **Attention** : N'exposez Adminer qu'en interne ou via VPN — jamais directement sur Internet.

### Administration Redis — Redis Commander

```bash
docker run -d \
  --name redis-commander \
  --restart unless-stopped \
  -p 8081:8081 \
  --network maono-ops_internal \
  -e REDIS_HOSTS=local:redis:6379 \
  rediscommander/redis-commander:latest
```

### Résumé des outils de monitoring

| Outil | Usage | Port par défaut |
|-------|-------|-----------------|
| `docker compose logs` | Logs applicatifs | — |
| Uptime Kuma | Disponibilité + alertes | 3001 |
| Better Uptime | Disponibilité (SaaS) | — |
| Adminer | Interface PostgreSQL | 8080 |
| Redis Commander | Interface Redis | 8081 |
| MinIO Console | Interface MinIO | 9001 |

---

## 12. Déploiement Railway (alternative simplifiée)

Railway.app est l'option la plus simple pour les petites équipes qui veulent éviter la gestion d'un serveur.

### Stack recommandée sur Railway

| Service | Solution Railway |
|---------|-----------------|
| Application Next.js | Railway (déploiement depuis GitHub) |
| Base de données | Supabase (PostgreSQL managé) ou Railway PostgreSQL |
| Redis | Upstash Redis (serverless, gratuit jusqu'à 10K req/jour) |
| Stockage fichiers | Cloudflare R2 (compatible S3, moins cher qu'AWS S3) |

### Instructions de déploiement Railway

```bash
# 1. Installer la CLI Railway
npm install -g @railway/cli

# 2. Authentification
railway login

# 3. Initialiser le projet
railway init

# 4. Lier à un dépôt GitHub
# (configurez via l'interface web Railway : railway.app/new)

# 5. Configurer les variables d'environnement
railway variables set NODE_ENV=production
railway variables set AUTH_SECRET=$(openssl rand -base64 32)
railway variables set NEXTAUTH_URL=https://votre-app.up.railway.app
# ... autres variables

# 6. Déployer
railway up
```

### Variables spécifiques à l'environnement Railway

```dotenv
# Railway injecte automatiquement DATABASE_URL si vous utilisez leur PostgreSQL
# Pour Supabase :
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1

# Pour Upstash Redis :
REDIS_URL=rediss://:[password]@[host].upstash.io:6379

# Pour Cloudflare R2 (endpoint compatible S3) :
MINIO_ENDPOINT=https://[account-id].r2.cloudflarestorage.com
MINIO_ROOT_USER=[R2_ACCESS_KEY_ID]
MINIO_ROOT_PASSWORD=[R2_SECRET_ACCESS_KEY]
```

### Limitations de Railway

- Pas de contrôle total sur l'infrastructure
- Le worker BullMQ doit être déployé comme un service séparé (via `railway.json`)
- Les plans gratuits ont des limites d'utilisation strictes (500h/mois)

Exemple de `railway.json` pour déployer le worker comme service séparé :

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node src/server/queue/worker.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

> **Conseil** : Railway convient parfaitement pour un MVP ou une équipe de moins de 5 personnes. Passez sur un VPS Hetzner dès que vous dépassez 10 utilisateurs actifs ou que vous avez besoin d'un contrôle fin sur les performances.

---

## Annexe — Commandes utiles

### Gestion des conteneurs

```bash
# État de tous les services
docker compose -f docker-compose.prod.yml ps

# Redémarrer un service
docker compose -f docker-compose.prod.yml restart app

# Arrêter tous les services
docker compose -f docker-compose.prod.yml down

# Arrêter et supprimer les volumes (DESTRUCTIF — efface toutes les données)
docker compose -f docker-compose.prod.yml down -v

# Accéder au shell d'un conteneur
docker compose -f docker-compose.prod.yml exec app sh
docker compose -f docker-compose.prod.yml exec db psql -U maono maono_ops
docker compose -f docker-compose.prod.yml exec redis redis-cli
```

### Prisma en production

```bash
# Appliquer les migrations (safe — production uniquement)
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Vérifier l'état des migrations
docker compose -f docker-compose.prod.yml exec app npx prisma migrate status

# Ouvrir Prisma Studio (interface web — à utiliser avec précaution en prod)
docker compose -f docker-compose.prod.yml exec app npx prisma studio
```

### Nettoyage Docker

```bash
# Supprimer les images non utilisées
docker image prune -f

# Supprimer les images de build intermédiaires
docker builder prune -f

# Vue d'ensemble de l'utilisation disque Docker
docker system df
```

---

*Document généré le 18 avril 2026 — Maono Ops Marketing Operations Platform*
