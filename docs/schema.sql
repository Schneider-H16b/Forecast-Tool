-- v7 SQLite schema for Forecast-Tool

-- 5.1 Settings & Stammdaten
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  sku TEXT PRIMARY KEY,
  name TEXT,
  prod_min_per_unit INTEGER NOT NULL DEFAULT 0,
  mont_min_per_unit INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  weekly_hours REAL NOT NULL,
  days_mask INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  color TEXT
);

CREATE TABLE IF NOT EXISTS blockers (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  date_iso TEXT NOT NULL,
  overnight INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  UNIQUE(employee_id, date_iso)
);

-- 5.2 Import / Orders / Lines
CREATE TABLE IF NOT EXISTS imports (
  id TEXT PRIMARY KEY,
  source TEXT,
  created_at TEXT NOT NULL,
  header_hash TEXT,
  lines_hash TEXT,
  raw_meta_json TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  ext_id TEXT,
  customer TEXT,
  status TEXT NOT NULL,
  forecast_date TEXT,
  sum_total REAL,
  delivered_ratio REAL,
  created_at TEXT,
  updated_at TEXT,
  import_id TEXT,
  distance_km REAL DEFAULT 0,
  forecast_miss INTEGER DEFAULT 0,
  miss_days INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS order_lines (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  sku TEXT,
  qty REAL NOT NULL DEFAULT 0,
  unit_price REAL,
  delivered_qty REAL,
  delivery_date TEXT,
  raw_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_status_forecast ON orders(status, forecast_date);
CREATE INDEX IF NOT EXISTS idx_lines_order ON order_lines(order_id);

-- 5.3 Planung (Events, Assignments)
CREATE TABLE IF NOT EXISTS plan_events (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  order_id TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  total_minutes INTEGER NOT NULL,
  travel_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS plan_event_employees (
  event_id TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  PRIMARY KEY(event_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_events_kind_dates ON plan_events(kind, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_event_order ON plan_events(order_id);

-- 5.4 AutoPlan Runs (Audit/Report)
CREATE TABLE IF NOT EXISTS autoplan_runs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  params_json TEXT NOT NULL,
  summary_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS autoplan_issues (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  type TEXT NOT NULL,
  order_id TEXT,
  date_iso TEXT,
  employee_id TEXT,
  deficit_min INTEGER,
  details_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_autoplan_run ON autoplan_issues(run_id);
