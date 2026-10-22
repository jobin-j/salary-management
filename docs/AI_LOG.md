# AI Log

How AI tools were used in this project: what was asked, what was
kept, and what was corrected.

## 2026-10-22 — Requirements doc
- **Tool / model:** Claude (chat), Sonnet
- **Prompt:** Draft a one-page requirements doc from the brief, with
  open questions marked as pending.
- **Outcome:** Kept structure. Removed "payroll, tax, benefits" from
  out-of-scope — the brief never mentions it, so listing it added noise.
  Reviewed performance targets before accepting them.

## 2026-10-22 — Backend scaffold (FastAPI + health check)
- **Tool / model:** Claude Code, Sonnet 4.6
- **Prompt:** Scaffold backend/ as a uv project (Python 3.11) with
  FastAPI; write a failing test for GET /health first, then the minimum
  code to pass. No database yet.
- **Corrections made:**
  1. `uv init` generated a library-style `src/` layout, which Claude Code
     then deleted and rewrote. `uv init --app` would have avoided this.
  2. Rewritten `pyproject.toml` removed `[build-system]` without making the
     app importable by tests. Caught in diff review; added
     `pythonpath = ["."]` so the red step fails for the right reason.
  3. First test used `@pytest.mark.asyncio` without pytest-asyncio
     installed (false red risk). Rejected; switched to FastAPI's
     synchronous `TestClient`.
  4. `.gitignore` was missing `.env` (future DB credentials) and
     `.ruff_cache/`. Added both.
  5. pytest showed a Starlette deprecation warning recommending httpx2
     over httpx. Verified the warning text, then swapped the dependency.
  6. Agent hand-edited `pyproject.toml` with a guessed
     `httpx2>=0.28.0` constraint instead of using `uv remove` /
     `uv add`. It resolved, but `uv add` is the correct workflow.
- **Outcome:** Red: `ModuleNotFoundError: No module named 'app.main'`.
  Green: 1 passed in 0.19s. Ruff: clean after import-grouping fix.
  After httpx2 swap: 1 passed in 0.19s, no warnings; ruff clean.
- **Lesson:** Review every diff and read actual tool output rather than
  the agent's summary. I initially doubted the agent's httpx2 claim;
  the real warning text confirmed it.

## 2026-10-22 — Frontend scaffold (Vite + React + TS + MUI + Vitest)
- **Tool / model:** Claude Code, Sonnet 4.6
- **Prompt:** Scaffold frontend/ with the react-ts template, MUI core
  and Vitest + React Testing Library; failing test for a "Salary
  Management" heading first, then the minimum code to pass. Remove
  demo code.
- **Corrections made:**
  1. `vite.config.ts` imported `defineConfig` from 'vite' with
     `globals: true`. The `test` block would be untyped and break
     `tsc -b` in the build. Switched to 'vitest/config', globals off,
     explicit vitest imports.
  2. Setup file used plain `@testing-library/jest-dom`, which needs a
     global `expect`. Switched to `@testing-library/jest-dom/vitest`.
  3. With globals off, RTL's auto-cleanup doesn't run, so DOM would leak
     between tests. Added explicit `afterEach(() => cleanup())`.
- **Outcome:** Red: test command failed against the Vite demo App (which
  has a "Get started" heading, not "Salary Management"); error text not
  captured. Green: 1 passed in 703ms; oxlint 0 warnings; `tsc -b && vite
  build` succeeds.
- **Lesson:** One decision (`globals: false`) had three knock-on effects
  the agent didn't follow through. Config choices need to be traced
  through every file they touch. Also: capture red-step output
  immediately (Ctrl+O) rather than relying on the agent's summary.

## 2026-10-22 — Employee model and POST /employees
- **Tool / model:** Claude Code, Sonnet 4.6
- **Prompt:** Database setup, Employee model and POST /employees (create
  only), test-first one behaviour at a time. Design decisions given up
  front (decisions 008–010).
- **Corrections made:**
  1. Agent planned to write all five tests before implementing any.
     Stopped it; enforced one test → red → green at a time.
  2. Agent hand-edited pyproject.toml again; switched to `uv add`.
     Both rules then added to CLAUDE.md.
  3. Test fixture used `with TestClient(app)`, which runs app startup
     and would create a real salary.db during tests. Removed the
     with-block; verified no .db file appears after a test run.
  4. `main.py` omitted `create_all` entirely. Tests passed (fixture
     creates its own tables) but the real app would have no table.
     Added a lifespan handler; verified manually via /docs (POST
     returned 201 with currency INR).
  5. Schema used `EmailStr` with no test driving it. Switched to plain
     `str`, then added an invalid-email test later and reintroduced
     `EmailStr` against a red test.
  6. Router error detail was just "FR"; made it readable
     ("Unsupported country: FR") and chained with `from e`.
  7. Strengthened the unsupported-country test to assert the detail
     message, since any 422 would otherwise pass it.
  8. Salary rule implemented as a `field_validator`; replaced with
     `Field(gt=0)` (one line, visible in the OpenAPI schema).
- **Red steps:** create `404 == 201`; unsupported country
  `KeyError: 'FR'`; salary `201 == 422`; hire date, duplicate email and
  invalid email confirmed red by the agent, output not captured.
- **Outcome:** 7 tests passing (6 employee + health), ruff clean.
- **Lesson:** Tests can pass while the real app is broken (correction 4).
  Behaviour the tests can't see needs a manual check.