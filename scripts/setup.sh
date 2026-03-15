#!/usr/bin/env bash
# LinkForge - Local Development Setup Script
# Run this script after cloning to start all services and run the API locally

set -e

echo "=== LinkForge - Development Setup ==="

# 1. Copy .env if it doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✓ .env file created from .env.example"
fi

# 2. Install dependencies
echo "→ Installing dependencies..."
pnpm install

# 3. Start infrastructure (Docker)
echo "→ Starting PostgreSQL and Redis..."
docker compose up -d postgres redis

# 4. Wait for PostgreSQL to be ready
echo "→ Waiting for PostgreSQL..."
until docker compose exec -T postgres pg_isready -U linkforge -d linkforge > /dev/null 2>&1; do
  sleep 1
done
echo "✓ PostgreSQL is ready"

# 5. Wait for Redis
echo "→ Waiting for Redis..."
until docker compose exec -T redis redis-cli ping > /dev/null 2>&1; do
  sleep 1
done
echo "✓ Redis is ready"

# 6. Generate Prisma client
echo "→ Generating Prisma client..."
pnpm prisma:generate

# 7. Run migrations
echo "→ Running database migrations..."
pnpm prisma:migrate

# 8. Seed database
echo "→ Seeding database..."
pnpm prisma:seed

# 9. Run tests
echo "→ Running tests..."
pnpm test

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Start the dev server with:"
echo "  pnpm start:dev"
echo ""
echo "API available at:    http://localhost:3000"
echo "Swagger docs at:     http://localhost:3000/api/docs"
echo "Health check at:     http://localhost:3000/health"
