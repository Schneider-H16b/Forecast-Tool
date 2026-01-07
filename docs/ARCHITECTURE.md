# Architecture

Monorepo with two main packages:

- /server — Express + TypeScript + Prisma (SQLite for dev). Layers: routes -> services -> db.
- /client — Vite + React + TypeScript. Single-page app that talks to REST API.

Key decisions:
- Keep files small and focused (~200 lines max).
- Use environment variables for configuration (`.env` / `.env.example`) to support later deploys on Linux/Hetzner.
- SQLite in dev with Prisma; swap to Postgres in production via changing DATABASE_URL and running migrations.

Health endpoint:
- GET /health -> { ok: true }

Testing:
- Vitest for both client and server to stay consistent.
