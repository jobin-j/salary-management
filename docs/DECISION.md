## 001 — Backend: Python + FastAPI
- **Why:** Role is Python/React/AI; FastAPI gives typed request
  validation (Pydantic) and auto-generated API docs.
- **Alternatives:** Django (heavier than needed), Node (off-role).

## 002 — Database: SQLite locally & in tests, Postgres in deployment
- **Why:** SQLite is zero-setup and fast for tests; free hosts wipe
  local files on restart, so the deployed app uses hosted Postgres.
  SQLAlchemy makes the switch a connection-string change.
- **Trade-off:** Minor SQLite/Postgres behaviour differences
  (e.g. case-sensitive search) — covered by testing key queries.

## 003 — Salaries stored in local currency, no FX conversion
- **Why:** Within-country comparison is accurate; FX adds rate-source
  and date decisions. *(Pending Incubyte's answer to Q1)*