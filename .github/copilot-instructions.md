# Copilot Instructions for Forecast-Tool

Purpose
- Short, actionable guidance to help AI coding agents be immediately productive in this repository.

Quick summary
- I couldn't find an existing `README.md` or other AGENT/AI instruction files in the repo; this is a starter file. Please update the placeholders below with project-specific commands and file paths.

Big picture (what to look for) ✅
- Typical components:
  - `data/` or `datasets/` — raw & processed input pipelines and schema definitions
  - `src/` or `app/` — service code: training, forecasting, API endpoints
  - `models/` or `artifacts/` — saved model binaries or weights
  - `cli/` — command-line utilities for ETL, training or evaluation
  - `tests/` — unit/integration tests
- Data flow to check: ingestion -> preprocessing -> model training -> model export -> inference/API
- If the repository uses multiple services, identify the boundary between `training` (batch) and `serving` (online/HTTP) components.

Developer workflows (concrete, replace placeholders) 🔧
- Setup: document exact commands to install deps and set up envs. Example placeholders:
  - Windows/Powershell: `python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt`
  - Container: `docker build -t forecast-tool . && docker run -it forecast-tool`
- Run tests: provide exact test command. Example: `pytest tests/ -q` (replace with project's test invocation)
- Run local API: `uvicorn src.api.app:app --reload --port 8000` or `flask run` depending on framework
- Training/inference commands: `python src/train.py --config configs/train.yaml` and `python src/infer.py --model models/latest.pkl --input data/sample.csv`
- Common debug steps: run small subset of dataset (`--sample 100`), use logging at DEBUG level, run tests for one module (`pytest tests/test_thing.py::TestFoo -q`)

Project-specific conventions to document here (examples to replace) 📋
- File naming: `snake_case` Python modules, `CamelCase` class names, test files named `test_*.py`.
- Config: YAML under `configs/` with environment overrides via `ENV_` variables; secrets via OS env only.
- Data schema: expected CSV columns and types found in `data/schema.yml` or `src/data/schema.py` (add exact path)
- Model artifacts: saved as `models/<model_name>_<YYYYMMDD>.pkl` or in `artifacts/` S3 path—state exact location

Integration & external systems 🔗
- Databases: note connection patterns (SQLAlchemy URI in `src/db.py` or `alembic.ini`) and migration usage.
- Storage: local filesystem vs S3/GCS. Example: `S3_BUCKET` env var used by `src/storage.py`.
- External APIs: list service endpoints and auth method (API key, OAuth, etc.) and where keys are read from (env file or secret manager).

Patterns & anti-patterns to preserve
- Prefer deterministic preprocessing pipelines with fixed seeds (look for `random.seed` / `numpy.random.seed` usage)
- Tests should be fast and not rely on real external services; use recorded responses or test fixtures located under `tests/fixtures/`
- For large-data operations, prefer streaming or chunked processing to avoid OOM

What AI agents are allowed & expected to do ✅
- Make small, well-tested changes with accompanying unit tests and clear commit messages.
- Add TODOs when required info is missing and raise PR comments stating the assumption.
- Do not commit secrets, credentials, or large model binaries (>50MB). Upload large artifacts to artifact storage and reference with metadata.

Items I need you to fill in (placeholders you should edit) ⚠️
- Exact install command(s)
- Exact test command(s)
- Static paths to important files: main app file, training script, schema file, model artifact location
- Any non-standard steps (e.g., database migrations, pretraining data downloads, special env vars)

How to update this file
- If this file exists, merge changes by preserving specific commands and examples, and move to the top-level `README.md` if content overlaps.

Contact & feedback
- If something in this file is incorrect or incomplete, please add a short note at the top of the file and/or invite AI agents to open a short PR that adds missing commands and small tests.

---
*Generated as a starter; please replace the placeholder snippets with exact commands and file paths from this repository.*
