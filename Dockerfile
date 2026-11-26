FROM oven/bun:1.2-alpine

WORKDIR /app

# Copy dependency manifests
COPY package.json bun.lock* ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN bun install
RUN bunx prisma generate

# Copy all source files
COPY . .

# Expose default backend port
EXPOSE 3001

ENV PORT=3001

# Run migrations/push and start Hono backend server
CMD ["sh", "-c", "bunx prisma db push --accept-data-loss && bun run src/seed.ts && bun run src/index.ts"]
