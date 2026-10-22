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

## 004 — UI components: MUI + MUI X DataGrid (free)
- **Why:** The employee table needs server-side pagination, sorting and
  filtering over 10,000 rows; DataGrid's server mode handles this with
  minimal custom code.
- **Alternatives:** shadcn/ui + TanStack Table (more control, more code).
- **Trade-off:** Heavier bundle, more generic look.

## 005 — Python packages: uv
- **Why:** Lockfile (`uv.lock`) gives reproducible installs across
  machines and deployment; manages the virtual environment automatically.
- **Alternatives:** pip + venv with pinned requirements.txt (familiar,
  but lockfile management is manual).
- **Trade-off:** Small learning curve.

## 006 — Global styles: MUI CssBaseline, no custom CSS
- **Why:** Template demo CSS removed; CssBaseline is MUI's standard
  browser-style reset, keeping all styling in one system.
- **Trade-off:** Small bundle increase; negligible at this stage.

## 007 — Frontend linter: oxlint (template default)
- **Why:** Ships with the current Vite react-ts template; fast, zero
  configuration needed for this project's size.
- **Alternatives:** ESLint (more plugins and rules, more setup).