# Stage 1: Dependencies and Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies required for build)
RUN npm install --legacy-peer-deps

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

# Copy only what the production image needs
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/.output ./.output

# Use the lockfile exactly in production. Do not run lifecycle scripts here:
# the application is already fully built and the runtime does not need dev tooling.
RUN npm ci --legacy-peer-deps --omit=dev --ignore-scripts

EXPOSE 3000

CMD ["npm", "run", "start"]
