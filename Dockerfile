# Build stage — compile native addons (better-sqlite3)
FROM node:24-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Runtime stage
FROM node:24-alpine
RUN addgroup -g 1000 nodejs && adduser -u 1000 -G nodejs -s /bin/sh -D nodejs
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Persistent dirs (mounted as volumes)
RUN mkdir -p db uploads public/archives && chown -R nodejs:nodejs /app

USER nodejs
ENV NODE_ENV=production PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
