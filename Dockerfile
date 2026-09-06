# Multi-stage build for Node.js + Vite + Express app
FROM node:22-alpine AS builder

WORKDIR /app

# Accept build arguments for Vite (client-side variables)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm install --no-audit --no-fund

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
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

# Copy compiled build artifacts and public assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/avatar-proxy.cjs ./avatar-proxy.cjs

# Expose port 3000
EXPOSE 3000

# Run production server with the isolated profile-media proxy preloaded.
CMD ["node", "--max-http-header-size=65536", "-r", "./avatar-proxy.cjs", "dist/server.cjs"]
