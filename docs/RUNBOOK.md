# Runbook — Local Development

1) Copy env file:
   cp server/.env.example server/.env

2) Install deps and start dev servers (from project root):
   npm ci
   npm run dev

3) Health checks:
   - Server: curl http://localhost:4000/health -> { ok: true }
   - Client: open http://localhost:5173 and see "API Status: ✅ API OK"

4) Run tests:
   npm test

5) Build for production:
   npm run build

Notes:
- DB: SQLite file `server/dev.db` (created by Prisma migrate). To migrate: `npm run prisma:migrate --prefix ./server`.
