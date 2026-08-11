# Stage 1: Dependencies and Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies deterministically from the lockfile.
RUN npm ci --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Ensure clean build state inside docker
RUN rm -rf .output .vinxi .tanstack .nitro node_modules/.vite node_modules/.cache

# Arguments passed by Coolify
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Set them as ENV variables so they are available during build (Vite requires them)
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build the application
RUN NODE_ENV=production VITE_SUPABASE_URL=$VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY npm run build

# Remove development-only packages before copying the runtime into the final image.
RUN npm prune --omit=dev --ignore-scripts

# Stage 2: Production
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Supabase server functions read these at runtime via process.env.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Copy the already-built application and pruned production dependencies.
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["npm", "run", "start"]
