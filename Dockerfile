# Dockerfile multi-stage pour le AI Service
FROM node:18-alpine AS base

# Install dependencies nécessaires
RUN apk add --no-cache libc6-compat

# Stage de développement
FROM base AS development

WORKDIR /app

# Copier les fichiers de configuration des dépendances
COPY package*.json ./

# Installer toutes les dépendances (dev + prod)
RUN npm ci

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 3003

# Commande par défaut pour le développement
CMD ["npm", "run", "start:dev"]

# Stage de build
FROM base AS builder

WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Installer toutes les dépendances
RUN npm ci

# Copier le code source
COPY src ./src

# Build de l'application
RUN npm run build

# Stage de production
FROM base AS production

WORKDIR /app

# Créer un utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copier les fichiers de configuration
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm ci --only=production && npm cache clean --force

# Copier les fichiers buildés depuis le stage builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Créer les dossiers de logs avec les bonnes permissions
RUN mkdir -p logs && chown -R nestjs:nodejs logs

# Changer vers l'utilisateur non-root
USER nestjs

# Exposer le port
EXPOSE 3003

# Commande par défaut
CMD ["node", "dist/main"] 