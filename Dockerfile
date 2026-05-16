# Build stage
FROM node:22-slim AS builder
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install 2>&1
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN echo '=== PRISMA GEN ===' && npx prisma generate 2>&1
RUN echo '=== NEXT BUILD ===' && npm run build 2>&1

# Production stage
FROM node:22-slim AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/hangar5.db
ENV HOSTNAME=0.0.0.0
ENV NEXT_PUBLIC_URL=""

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma.config.ts ./

# Remove .env from build output (production uses env vars)
RUN rm -f .env

EXPOSE 3000

# IMPORTANT: unset HOSTNAME so Next.js defaults to 0.0.0.0
# Railway sets HOSTNAME to container hostname, breaking bind
CMD ["sh", "-c", "mkdir -p /app/data && node server.js &
sleep 2
node node_modules/prisma/build/index.js db push"]
