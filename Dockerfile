# Multi-stage build for Node.js + Vite + Express app
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for Vite/esbuild/TypeScript)
RUN npm ci

# Copy source code
COPY . .

# Build Vite client assets and bundle server.ts into dist/server.cjs
RUN npm run build

# ==========================================
# Production Runtime Stage
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled build artifacts and public assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Expose port 3000
EXPOSE 3000

# Run production server
CMD ["node", "--max-http-header-size=65536", "dist/server.cjs"]
