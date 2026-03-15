# LinkForge

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

LinkForge is a production-oriented URL shortener SaaS API built with NestJS.
It includes authentication, plans and quotas, redirect handling, analytics collection, rate limiting, and admin operations.

## Table of Contents

- [Why This Project Exists](#why-this-project-exists)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Why These Technology Choices](#why-these-technology-choices)
- [Project Structure](#project-structure)
- [Requirements](#requirements)
- [Environment Variables](#environment-variables)
- [Quick Start (Recommended)](#quick-start-recommended)
- [Manual Local Setup](#manual-local-setup)
- [Running with Docker](#running-with-docker)
- [API Endpoints for First Validation](#api-endpoints-for-first-validation)
- [Testing](#testing)
- [Script Reference](#script-reference)
- [Operational Notes](#operational-notes)
- [License](#license)

## Why This Project Exists

The goal is to provide a practical backend foundation for a short-link product that is:

- Secure by default (JWT auth, role checks, URL safety validation)
- Scalable in behavior (Redis rate limiting, async analytics queue)
- Observable and testable (health endpoint, Swagger docs, automated tests)
- Easy to run locally and in containers

## Core Features

- User authentication: register, login, refresh, logout
- Role-based access control: USER and ADMIN
- Link management: create, list, get, disable, enable, delete
- Redirect endpoint by slug
- Click analytics with metadata extraction and async processing
- Plan limits and optional per-user overrides
- Multi-layer rate limiting (global, IP, user action, slug)
- Swagger documentation at /api/docs
- Health checks at /health

## Tech Stack

- Runtime: Node.js
- Framework: NestJS (TypeScript)
- Database: PostgreSQL
- ORM: Prisma
- Cache and rate-limit state: Redis
- Queue: BullMQ
- Auth: Passport + JWT
- API docs: Swagger (OpenAPI)
- Tests: Jest
- Containers: Docker + Docker Compose

## Why These Technology Choices

- NestJS: structured modules, dependency injection, and clean separation for a growing backend
- Prisma: type-safe data access and straightforward schema evolution
- PostgreSQL: strong relational consistency for users, plans, links, and click events
- Redis: low-latency counters and TTL-based rate limiting
- BullMQ: decouples redirect latency from analytics persistence
- Swagger: fast API exploration and easier handoff to frontend/integration consumers

## Project Structure

- src: application modules, controllers, services, and common components
- prisma: Prisma schema and seed
- scripts: helper scripts (setup and analytics load generation)
- docker-compose.yml: local infra and container orchestration

## Requirements

- Node.js 20+ (Node 25 works)
- pnpm 10+
- Docker and Docker Compose
- A running Docker daemon with permission to access /var/run/docker.sock

## Environment Variables

Copy .env.example to .env and adjust values as needed.

Important variables:

- PORT: API port (default 3000)
- APP_BASE_URL: public base URL used to build shortUrl responses
- DATABASE_URL: PostgreSQL connection string
- REDIS_HOST and REDIS_PORT: Redis connection
- JWT_ACCESS_SECRET and JWT_REFRESH_SECRET: strong secrets in production
- Rate limit vars (RATE_LIMIT_*): tune per environment

Notes:

- Keep .env private and never commit it.
- Keep .env.example committed as the template.

## Quick Start (Recommended)

Run the setup script:

```bash
bash scripts/setup.sh
```

Then start the API:

```bash
pnpm start:dev
```

## Manual Local Setup

1. Install dependencies:

```bash
pnpm install
```

2. Start infrastructure:

```bash
docker compose up -d postgres redis
```

3. Generate Prisma client:

```bash
pnpm prisma:generate
```

4. Apply migrations:

```bash
pnpm prisma:migrate
```

5. Seed data:

```bash
pnpm prisma:seed
```

6. Start API in dev mode:

```bash
pnpm start:dev
```

## Running with Docker

Build and run with Compose:

```bash
docker compose up --build
```

For infra-only local development:

```bash
docker compose up -d postgres redis
```

## API Endpoints for First Validation

- Swagger: http://localhost:3000/api/docs
- Health: http://localhost:3000/health
- Redirect pattern: http://localhost:3000/{slug}

## Testing

Run unit tests:

```bash
pnpm test
```

Watch mode:

```bash
pnpm test:watch
```

Coverage:

```bash
pnpm test:cov
```

## Script Reference

- pnpm build: compile TypeScript
- pnpm start: start Nest app
- pnpm start:dev: start in watch mode
- pnpm start:debug: debug + watch
- pnpm start:prod: run compiled app from dist
- pnpm lint: run ESLint with auto-fix
- pnpm format: run Prettier
- pnpm test: run tests
- pnpm test:watch: test watch mode
- pnpm test:cov: test coverage
- pnpm test:debug: debug tests
- pnpm test:e2e: run e2e suite config
- pnpm prisma:generate: generate Prisma client
- pnpm prisma:migrate: create/apply dev migration
- pnpm prisma:deploy: apply existing migrations (deploy)
- pnpm prisma:studio: open Prisma Studio
- pnpm prisma:seed: seed the database
- pnpm prisma:reset: reset database
- pnpm analytics:load: generate concurrent redirect traffic for analytics

Analytics load example:

```bash
pnpm analytics:load -- --slugs my-link,my-links --requests 2000 --concurrency 80
```

## Operational Notes

- If Docker commands fail with permission denied on docker.sock, fix user permissions for the docker group.
- If Prisma types look broken after reinstalling dependencies, run pnpm prisma:generate.
- BigInt values are serialized safely in API responses, so counters are returned as strings.

## License

MIT
