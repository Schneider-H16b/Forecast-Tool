# Repo Contracts (v7)

This document lists the repository interfaces and the expected behaviour for the core Repos used by the application. Implementations should obey these contracts to be swappable (sql.js, better-sqlite3, in-memory).

## SettingsRepo
- getAppSetting(key) -> value | null
- setAppSetting(key, value)
- listItems() -> array of items
- upsertItem(item) -> void
- listEmployees() -> array of employees
- upsertEmployee(emp) -> returns id
- listBlockers(filter?) -> array of blockers
- upsertBlocker(b) -> id
- deleteBlocker(id) -> void

## OrdersRepo
- upsertOrders(orders[])
- upsertOrderLines(lines[])
- listOrders(filter?)
- getOrderWithLines(orderId)
- updateOrderMeta(orderId, meta)

## PlanningRepo
- createEvent(event) -> id
- updateEvent(event) -> void
- deleteEvent(eventId) -> void
- listEvents(kind?, dateRange?) -> array
- getRemainingCapacity(kind, date, employeeIds?) -> int

## KpiRepo
- monthlyCapacity(role, monthRange)
- monthlyDemand(status, monthRange)
- quarterlyRollup(params)

## ImportRepo
- createImport(meta) -> id
- attachImportToOrders(importId, orderIds)


Implementation notes:
- Methods should be transactional where required (e.g., import upserts).
- Error handling: throw descriptive errors; do not return ambiguous nulls unless documented.
- All IDs are strings (UUID or deterministic ids computed from source ids).
