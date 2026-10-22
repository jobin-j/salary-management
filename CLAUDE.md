# CLAUDE.md

## Project
Salary management web app for an HR Manager handling ~10,000 employees across multiple countries.
Read `docs/REQUIREMENTS.md` for scope and `docs/DECISIONS.md` for decisions already made. Do not build anything listed as out of scope.

## Stack
- **Backend** (`backend/`): Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic v2, pytest. Packages managed with **uv**.
- **Database:** SQLite locally and in tests; Postgres in deployment (via `DATABASE_URL`).
- **Frontend** (`frontend/`): Vite + React + TypeScript, MUI + MUI X DataGrid, TanStack Query, Vitest + React Testing Library.

## Backend structure
- `app/models/` — SQLAlchemy models
- `app/schemas/` — Pydantic request/response schemas
- `app/services/` — business logic (no FastAPI imports here)
- `app/api/` — FastAPI routers (thin: validate, call service, return)
- `tests/` — mirrors `app/`

## Commands
- Backend tests: `cd backend && uv run pytest`
- Backend dev server: `cd backend && uv run uvicorn app.main:app --reload`
- Lint: `cd backend && uv run ruff check .`
- Seed: `cd backend && uv run python -m app.seed`
- Frontend dev: `cd frontend && npm run dev`
- Frontend tests: `cd frontend && npm test`
- Frontend lint: `cd frontend && npm run lint` (oxlint)
- Frontend build: `cd frontend && npm run build` (includes type-check)

## Workflow rules
1. **Test first.** Write a failing test, confirm it fails, write the minimum code to pass, then refactor.
2. **One small task at a time.** Stop after each task so it can be reviewed and committed.
3. **Ask before** adding a dependency, changing the database schema, or touching files outside the current task.
4. **No speculative features.** Build only what the current task requires.
5. Tests must be fast and deterministic: in-memory SQLite, fixed random seeds, no network calls.
6. Never load all employees into memory or the browser; list endpoints are always paginated.
7. Commit messages follow Conventional Commits (`feat:`, `test:`, `fix:`, `refactor:`, `docs:`, `chore:`).
8. At the end of each task, propose a short `docs/AI_LOG.md` entry (task, prompt summary, outcome). Do not write it yourself — the developer edits and commits it.