# Migration Plan: localStorage (v6) → SQLite (v7)

Purpose: Provide an idempotent, auditable migration path from in-browser localStorage keys to the new v7 SQLite schema.

Overview:
- Strategy: *Shadow-write* mode → run one-time *migration script* (dry-run first) → verify → enable DB fully → deprecate localStorage
- Scope: items, employees, blockers, app_settings, order_meta (distanceKm, forecast_miss, miss_days), optionally plan events where present.

Steps:

1) PREP: Backup localStorage & existing DB
- For desktop: copy `kapa.db` to `kapa.db.bak`.
- For browser: export current localStorage keys and DB blob (if any) via UI/export tool.

2) SHADOW-WRITE MODE (safety)
- Implement a compatibility layer that implements the existing Repo interfaces but performs both:
  - reads from localStorage (legacy) when serving the UI
  - writes to SQLite in parallel (shadow write) on mutations
- Run app in SHADOW-WRITE for at least one user-flow cycle and validate parity.

3) ONE-TIME MIGRATION SCRIPT
- Script location: `server/scripts/migrate.ts`
- Usage:
  ```bash
  # Dry-run mode (default):
  npm run migrate -- --dump path/to/localstorage.json --db path/to/dev.db

  # Apply migration:
  npm run migrate -- --dump path/to/localstorage.json --db path/to/dev.db --no-dry-run --backup

  # Without backup:
  npm run migrate -- --dump path/to/localstorage.json --db path/to/dev.db --no-dry-run --no-backup
  ```
- Dry-run: reads legacy keys, computes counts, checksums and shows potential conflicts (duplicate IDs, schema mismatches), but doesn't write.
- Apply: runs migration; writes records in transaction; stores a migration summary row in `autoplan_runs` or a dedicated migrations table.
- Backup: script automatically backs up DB file before write (with timestamp).

4) VALIDATION & RECONCILIATION
- Compare checksum of sample queries across legacy read (replay) and DB: sample counts, sum of efforts per order, sample order fields.
- Use a small sample dataset / acceptance tests to ensure behaviour matches v6 for critical calculations.

5) SWITCHOVER
- After verification, flip the compatibility layer so that reads come from DB, but keep localStorage import button available for legacy restores.
- Monitor for a release cycle before fully removing localStorage support.

6) ROLLBACK PLAN
- If discrepancies found, revert to the backup DB and report details; DO NOT remove backups

7) CHANGELOG & RUNBOOK
- Document in docs/MIGRATION_PLAN.md and docs/RUNBOOK.md exact commands and checks.

8) AUTOMATION & CI
- Add an automated migration dry-run check to CI for release candidate builds (runs migration in dry-run against sample dataset and asserts counts unchanged).

---

Notes on Idempotency & Duplicates:
- Use stable IDs where possible (normalize order id from ext_id), otherwise generate deterministic UUIDs based on ext_id/hash.
- If order already exists by id, the migration should update metadata fields rather than insert duplicate rows.

Safety checks performed by script:
- pre-check for existing records (by id)
- checksum or hash comparisons
- row counts & key diffs

