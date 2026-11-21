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

# Ensure SQLite database is initialized and seeded
RUN bunx prisma db push && bun run src/seed.ts

# Expose default backend port
EXPOSE 3001

ENV PORT=3001
ENV DATABASE_URL="file:./dropu.db"

# Start Hono backend server
CMD ["bun", "run", "src/index.ts"]
