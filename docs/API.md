# API

Base URL: http://localhost:4000

GET /health
- Response: 200 { ok: true }

Notes:
- All endpoints must validate input (use zod) and return consistent error shapes.
- Routes should be small and delegate business logic to `services/` modules.
