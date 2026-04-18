FROM node:22-alpine
# Node 22 pour AWS SDK (>= 20)

RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Installer les dépendances en premier (cache layer)
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY . .

# Générer le client Prisma pour linux
RUN npx prisma generate

# Compiler le worker TypeScript → JavaScript (évite esbuild darwin au runtime)
RUN npx tsc --project tsconfig.server.json || \
    npx tsc src/server/queue/worker.ts \
      --outDir dist/server \
      --module commonjs \
      --target es2020 \
      --moduleResolution node \
      --esModuleInterop true \
      --skipLibCheck true \
      --resolveJsonModule true 2>/dev/null || \
    echo "Worker TS compile skipped — using tsx fallback"

# Build Next.js
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "dev"]
