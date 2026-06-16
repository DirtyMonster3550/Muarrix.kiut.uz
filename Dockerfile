# Build stage — compile native addons (better-sqlite3)
FROM node:24-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Runtime stage
FROM node:24-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Persistent dirs (mounted as volumes)
RUN mkdir -p db uploads public/archives && chown -R node:node /app

USER node
ENV NODE_ENV=production PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
