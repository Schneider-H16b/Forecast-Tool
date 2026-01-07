# Copilot Instructions for Forecast-Tool

Purpose
- Short, actionable guidance so AI coding agents can be productive in this repository immediately.

Big picture
- Monorepo with server (Node/Express/TypeScript) and client (Vite/React). Persistence via SQLite (sql.js) with a v7 schema. Repos + services architecture, Vitest for tests, ESLint-clean TypeScript.
- Data flow: CSV import → normalized orders/items → planning (events, capacity) → AutoPlan → KPIs/Dashboard.

Repo layout
- server/ — Express app, repos, services, routes, tests
- client/ — Vite React app (UI for planning/KPIs)
- docs/schema.sql — authoritative DB schema (v7)
- data/ — CSV samples or local data files (optional)

Developer workflows
- Prereqs: Node 18+ (LTS), npm (workspaces enabled), Windows PowerShell or bash. On Windows, prefer PowerShell.

Workspace scripts (run at repo root)
- Install: `npm install`
- Dev (client + server): `npm run dev`
- Build all: `npm run build`
- Start backend only (built): `npm run start`
- Test all (workspaces): `npm test`
- Lint all (workspaces): `npm run lint`
- Typecheck: `npm run typecheck`

Server (backend) scripts
- Dev: `npm run dev --prefix ./server`
- Build: `npm run build --prefix ./server`
- Start: `npm start --prefix ./server`
- Test: `npm test --prefix ./server`
- Lint: `npm run lint --prefix ./server`

Client (frontend) scripts
- Dev: `npm run dev --prefix ./client` (Vite default port 5173)
- Build: `npm run build --prefix ./client`
- Preview: `npm run preview --prefix ./client`
- Test: `npm test --prefix ./client`
- Lint: `npm run lint --prefix ./client`

Database & migrations
- SQLite is embedded via sql.js. Default DB path: `server/dev.db` (created on first run).
- Schema lives in `docs/schema.sql` and is applied by the DB initializer.
- Migration CLI (from localStorage dump to DB):
  - Dry-run: `npm run migrate --prefix ./server -- --dump server/example-localstorage-dump.json --dry-run`
  - Apply: `npm run migrate --prefix ./server -- --dump server/example-localstorage-dump.json --no-dry-run`
  - Options: `--db <path>` to set DB file; backups auto-created when applying if enabled.

Import pipeline (server)
- Import CSV orders: call the ImportService via an API/CLI if present, or add a thin script invoking `ImportRepoSqlite` and `ImportService`.
- Deduping via content-hash; re-import is idempotent.

Key APIs (server)
- Health: `GET /health`
- Planning:
  - `GET /api/events`
  - `POST /api/events`
  - `PUT /api/events/:id`
  - `DELETE /api/events/:id`
  - Capacity: `GET /api/capacity?kind=production|montage&date=YYYY-MM-DD`
- AutoPlan: `POST /api/autoplan/run`
- Dashboard:
  - `GET /api/dashboard/metrics?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - `GET /api/dashboard/kpis?from=YYYY-MM-DD&to=YYYY-MM-DD`

Conventions
- TypeScript strict; avoid `any`. Align types to DB snake_case fields.
- Tests: Vitest; keep unit tests fast and deterministic. Use fixtures under `server/test`.
- Repositories under `server/src/repos/**`; services under `server/src/services/**`.

Troubleshooting
- PowerShell chaining: use `;` instead of `&&`.
- If sqlite adapter complains about readonly arrays, ensure parameter arrays are mutable and of allowed SqlValue types.
- KPI rounding: tests expect rounding to nearest integer for selected metrics.

What agents should do
- Small, focused PRs with tests when changing logic in repos/services.
- Use the migration CLI when schema/setting changes are needed; update `docs/schema.sql` and add tests.
- Do not commit large binaries (>50MB) or secrets.

Maintainer notes
- Backend port defaults via environment `PORT` (if set by index/start). DB path defaults to `server/dev.db` and can be overridden in code via `initDB({ dbPath })`.
- TypeScript pinned to 5.3.x across workspaces.

Contact & feedback
- If anything here is incorrect or missing, please open a PR updating commands and, if logic changed, add minimal tests.
