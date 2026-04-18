FROM node:22-alpine
# Utilisation de Node 22 pour satisfaire les prérequis AWS SDK (>= 20)

RUN apk add --no-cache libc6-compat
WORKDIR /app

# On copie uniquement package.json dans un premier temps 
# ou on s'assure de forcer un npm install neuf pour éviter les erreurs d'architecture croisée (ex: esbuild darwin-arm64 vs linux-x64)
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000
