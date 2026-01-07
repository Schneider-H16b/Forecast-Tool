# Forecast-Tool

Monorepo with client (Vite + React + TypeScript) and server (Node + Express + TypeScript + SQLite via sql.js). Clean layers (repos/services/routes), strict typing, and a small, testable core.

Philosophy: small files, clear responsibilities, tests first, environment-driven configuration.

Quickstart
- Install: `npm install`
- Dev (client + server): `npm run dev`
- Build all: `npm run build`
- Start backend (built): `npm run start`
- Test all workspaces: `npm test`
- Lint all workspaces: `npm run lint`

Workspace scripts
- Server only: `npm run dev --prefix ./server` | `npm run build --prefix ./server` | `npm start --prefix ./server` | `npm test --prefix ./server` | `npm run lint --prefix ./server`
- Client only: `npm run dev --prefix ./client` | `npm run build --prefix ./client` | `npm run preview --prefix ./client` | `npm test --prefix ./client` | `npm run lint --prefix ./client`

API overview (server)
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

Database
- SQLite (sql.js) file created at `server/dev.db` by default. Schema: `docs/schema.sql`.
- Migration CLI (from localStorage dump):
	- Dry-run: `npm run migrate --prefix ./server -- --dump server/example-localstorage-dump.json --dry-run`
	- Apply: `npm run migrate --prefix ./server -- --dump server/example-localstorage-dump.json --no-dry-run`
	- Options: `--db <path>` to specify DB file.

Testing & linting
- Tests: Vitest across workspaces. Run `npm test` at root.
- Lint: ESLint across workspaces. Run `npm run lint` at root.
- Typecheck: `npm run typecheck`.

Notes
- Windows PowerShell: chain commands with `;` (not `&&`).
- TypeScript pinned to 5.3.x for consistency.

See docs/schema.sql for the authoritative database schema and comments.

API examples
- Health
	```bash
	curl -s http://localhost:4000/health
	```
- List events
	```bash
	curl -s http://localhost:4000/api/events
	```
- Create event
	```bash
	curl -s -X POST http://localhost:4000/api/events \
		-H "Content-Type: application/json" \
		-d '{
			"kind": "production",
			"orderId": "ORDER-123",
			"startDate": "2026-01-08",
			"endDate": "2026-01-08",
			"totalMinutes": 240,
			"travelMinutes": 0,
			"employeeIds": ["emp-1"]
		}'
	```
- Capacity (remaining minutes)
	```bash
	curl -s "http://localhost:4000/api/capacity?kind=production&date=2026-01-08"
	```
- Run AutoPlan
	```bash
	curl -s -X POST http://localhost:4000/api/autoplan/run \
		-H "Content-Type: application/json" \
		-d '{
			"startDate": "2026-01-08",
			"endDate": "2026-01-31",
			"includeProduction": true,
			"includeMontage": true,
			"overwriteExisting": false
		}'
	```
- Dashboard metrics/KPIs
	```bash
	curl -s "http://localhost:4000/api/dashboard/metrics?from=2026-01-01&to=2026-01-31"
	curl -s "http://localhost:4000/api/dashboard/kpis?from=2026-01-01&to=2026-01-31"
	```

API collections
- REST Client: see [docs/api/requests.http](docs/api/requests.http). Install the "REST Client" VS Code extension to send requests directly from the file.
- Postman: import [docs/api/Forecast-Tool.postman_collection.json](docs/api/Forecast-Tool.postman_collection.json) and set `baseUrl` if the server runs on a different port.
