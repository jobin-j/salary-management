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

## 2026-10-23 — Employee list (GET /employees)
- **Tool / model:** Claude Code, Sonnet 4.6
- **Prompt:** Paginated, filterable GET /employees per decision 011:
  page/page_size (max 100), case-insensitive name search, exact filters
  on country/department/job_title, indexes on filtered columns. Six
  tests, one at a time.
- **Process change:** Approved agent steps without per-step review to
  save time; reviewed the full `git diff` before committing instead.
- **Corrections made:**
  1. Search built an `ilike` pattern from raw input, so `%` matched every
     employee and `_` matched any character. Added a failing test
     (`assert 1 == 0`), fixed with `icontains(search, autoescape=True)`.
  2. Minimum-of-1 limits on page/page_size had no tests. Added two guard
     tests (passed on first run, as expected).
  3. My chat advisor said a `# noqa: B008` comment was unused; removing
     it made ruff fail, and the agent showed B008 is active in ruff's
     defaults. Resolved by switching `db` to FastAPI's `Annotated` style,
     removing both suppressions instead of adding a config exception.
- **Agent-reported TDD deviation:** Offset logic was written during test
  1, so test 2 passed on first run. Agent removed the offset to confirm
  test 2 fails without it (`[1, 2] == [3]`), then restored it.
- **Red steps:** list `405`; country, combined filters and search
  returned too many items; page_size 101 returned `200` instead of 422;
  `%` search `assert 1 == 0`.
- **Outcome:** 16 tests passing, ruff clean.
- **Lesson:** Verify advice against the tools, including a reviewer's.
  Linter defaults vary by version; ruff's own output settled it.

## 2026-10-23 — Read, update, delete (GET / PATCH / DELETE /employees/{id})
- **Tool / model:** Claude Code, Sonnet 4.6
- **Prompt:** 12 behaviours per decision 012, one at a time. Included a
  test for explicit null on PATCH, anticipating that a null would hit
  the NOT NULL constraint and be misreported as a duplicate email.
- **What happened:** All 12 tests went red then green. The explicit-null
  test exposed exactly that bug (a null returned 409 "Email already
  exists"); fixed so it returns 422. Agent added a 13th test (invalid
  email on PATCH) so `EmailStr` on update is covered; kept it.
- **Refactors:** Hire-date rule became one shared `HireDate` type used by
  create and update; country lookup became a shared `_currency_for()`.
- **Corrections made:** Agent's proposed commit message credited
  "Claude Opus 5.5"; Claude Code ran on Sonnet 4.6. Dropped the trailer;
  AI involvement is documented here instead.
- **Trade-off noted:** Update fields use `str = None` (non-nullable type,
  None default) so explicit null fails validation while omitted fields
  stay unset. A type checker would flag it; the alternative was a model
  validator, more code for the same behaviour.
- **Outcome:** 29 tests passing, ruff clean.

## 2026-10-23 — Seed script (10,000 employees)
- **Tool / model:** Claude Code, Sonnet 4.6
- **Prompt:** Pure `generate_employees(count, seed)` plus `seed_database`
  per decision 013; six tests one at a time. Required a fixed reference
  date instead of `date.today()` so output stays deterministic.
- **What happened:** All six tests went red then green. For the
  title-to-department test, the agent wrote the expected mapping out in
  the test rather than importing it from seed.py, so the test checks
  something independent.
- **Corrections made:** Titles were picked uniformly, giving as many
  managers as engineers, which no real company looks like. Added title
  weights (Engineering about 41% of headcount); a re-run landed every
  title within 0.4 points of its target.
- **Not covered by tests:** country and employment-type weights, base
  salaries, the ±15% spread, part-time pro-rating and the hire-date
  range. Verified in a 10,000-row run instead (e.g. IN 3,495 / US 2,002;
  8,489 full-time). The run used a scratch database so local data was
  untouched.
- **Outcome:** 35 tests passing, ruff clean, 10,000 employees seeded in
  0.14s (target: under 5s).

## 2026-10-23 — Salary insights (per country, per job title)
- **Tool / model:** Claude Code, Sonnet 4.6
- **Prompt:** Two insights endpoints per decision 014, with an
  employment-type filter (full-time by default); seven tests with exact
  expected numbers; then time both endpoints against 10,000 seeded
  employees.
- **What happened:** Tests 1, 2, 3, 5 and 6 went red then green. Tests 4
  and 7 passed on first run; to prove test 4 detects a wrong median, the
  agent briefly swapped in `median_high` (it failed: 300001 == 250000),
  then reverted.
- **Corrections made:** The insights service imported the private
  `_currency_for` from another module; renamed it to `currency_for` now
  that it's shared. A supported country with no employees had no test;
  added a guard test.
- **Performance:** at 10,000 employees, median response 8–19 ms per
  endpoint (target: under 500 ms).
- **Noted, left as is:** halves round to the nearest even number
  (Python's `round`), pinned by test 4. `app/seed.py` doesn't match
  `ruff format`; left for a separate clean-up commit.
- **Outcome:** 43 tests passing, ruff clean.

## 2026-10-23 — CORS and filter options (GET /options)
- **Tool / model:** Claude Code, Sonnet 4.6
- **Prompt:** CORS origins from a `CORS_ORIGINS` env var via a testable
  parser, no wildcard; `GET /options` returning countries with
  currencies, departments, job titles and employment types, per
  decision 015. Six tests one at a time.
- **What happened:** Tests 1, 3, 4 and 5 went red then green. Tests 2
  and 6 passed on first run; the agent proved test 2 works by briefly
  switching to a wildcard origin (it failed), then reverted.
- **Corrections made:** Added a parser test for trailing slashes and
  empty entries. An origin pasted from a hosting dashboard as
  `https://app.example/` would never match the browser's
  `https://app.example`, making every API call fail silently in
  production. Written test first.
- **Noted:** a blank `CORS_ORIGINS` now blocks all cross-origin requests
  rather than falling back to the default. This fails closed, which is
  the safe direction.
- **Outcome:** 50 tests passing, ruff clean.

## 2026-10-23 — Employee table (frontend)
- **Tool / model:** Claude Code, Sonnet 4.6
- **Prompt:** Server-paginated MUI DataGrid with a custom filter toolbar
  and debounced search, per decision 016. Six behaviours, one at a time,
  with `fetch` stubbed and a fresh QueryClient (retries off) per test.
  Called out two common server-table bugs up front: 0-based grid pages
  vs the API's 1-based pages, and not resetting to page 1 on filter
  change.
- **What happened:** All six tests went red then green. The agent reset
  the page only when the filters actually sent to the API change (after
  the debounce), avoiding a wasted request per keystroke. Search
  placeholder says "Name" because the API only searches names.
- **Verified manually:** ran the real backend (10,000 seeded employees)
  and frontend together: full total shown, country filter and search
  work, pagination moves through pages, and CORS works between the two
  servers.
- **Noted, left as is:** production bundle is ~305 kB gzipped (DataGrid
  is most of it). Acceptable for an internal tool; code-splitting comes
  with navigation.
- **Outcome:** 7 frontend tests passing, oxlint clean, build succeeds.

## 2026-10-26 — Deployment readiness (Neon Postgres, Vercel)
- **Tool / model:** Claude Code, Sonnet 4.6
- **Prompt:** Add the psycopg driver; normalise `DATABASE_URL` test-first
  (Neon's `postgresql://` would otherwise select a different driver);
  `NullPool` with pre-ping for Postgres only; minimal Vercel config with
  the function region in Singapore, per decision 017. The database URL
  was kept out of the agent's context entirely.
- **What happened:** Normaliser and `make_engine` added with tests.
  The agent checked Vercel's current docs: only `regions: ["sin1"]` was
  needed, and Vercel installs from `uv.lock`, so no requirements.txt.
  It flagged that Vercel runs Python 3.12–3.14, not the local 3.11.
- **Corrections made:** The agent flagged the httpx2 dev dependency as a
  possible typosquat and recommended replacing it. Checked the sources:
  httpx2 is the Pydantic-maintained continuation of httpx, published by
  httpx's original author, and is what Starlette's TestClient requests.
  Kept it. (I had doubted httpx2 on day one too; both times the real
  sources settled it.)
- **Accepted:** pinned Python 3.12 locally so tests run on the same
  version as production; updated CLAUDE.md to match.
- **Outcome:** 58 tests passing on Python 3.12.15, ruff clean.

## 2026-10-26 — Deployment (Neon Postgres, Vercel)
- **Tool:** Claude (chat) for the deployment plan and step-by-step
  review; all steps performed by hand. The coding agent was deliberately
  given no access to cloud accounts or the database credentials.
- **Setup:** Neon Postgres (Singapore, pooled connection); backend and
  frontend as two Vercel projects from the same repo (backend function
  region sin1, matching the database).
- **Secrets:** the database URL never went to Claude Code or into the
  repo. It was entered in Vercel's settings and, for seeding, typed at
  a hidden terminal prompt (`read -s`) so it stayed out of shell
  history. A `git diff --cached | grep neon.tech` check confirmed no URL
  was staged.
- **Steps:** seeded 10,000 employees into Neon from the laptop (0.99s);
  deployed the backend and verified `/health` and `/employees` in a
  private window (total 10,000); deployed the frontend with
  `VITE_API_URL`; set `CORS_ORIGINS` to the frontend's address on the
  backend and redeployed.
- **Issues avoided:** used the production domain rather than a
  deployment-specific URL, which Vercel protects behind a login by
  default, so reviewers would have hit a login page. Skipped Neon's
  optional Auth and Data API to keep the database's attack surface
  minimal.
- **Outcome:** live at https://salary-management-app-ivory.vercel.app
  (API: https://salary-management-weld.vercel.app).

## 2026-10-26 — CORS for write requests (backend fix)
- **Tool / model:** Claude Code, Sonnet 4.6
- **Found by:** the agent, while building the employee forms. Decision
  015 (my chat advisor's design) set only `allow_origins`; Starlette's
  defaults then allow only GET and no request headers, so the browser's
  preflight check would reject every POST, PATCH and DELETE with a JSON
  body. All tests passed, because tests don't go through a browser.
- **Fix:** test first. A preflight test from http://localhost:5173
  failed with 400, then passed after setting `allow_methods` (GET, POST,
  PATCH, DELETE) and `allow_headers` (Content-Type).
- **Verified manually:** create, edit, delete and the duplicate-email
  error all worked in a real browser against the local backend.
- **Pattern:** third time green tests hid a real-world failure (after
  the missing `create_all` and the CORS trailing slash). Each was caught
  by running the real thing, which is why every task now ends with a
  manual check.
- **Outcome:** 59 backend tests passing, ruff clean.

## 2026-10-26 — Employee create, edit and delete (frontend)
- **Tool / model:** Claude Code, Sonnet 4.6
- **Prompt:** One form dialog for create and edit, delete confirmation,
  row actions, per decision 018; no new dependencies; seven tests one at
  a time. `validateEmployee` takes `today` as a parameter so tests are
  deterministic.
- **What happened:** All seven went red then green. The agent added two
  tests my list missed (a 422 mapped to a field, and a 422 shown as a
  general message) rather than leave that behaviour untested. It used
  inline SVG icons instead of adding an icon library, keeping to the
  no-new-dependencies rule. PATCH sends only changed fields; the fetch
  client handles 204 responses and throws an `ApiError` with the parsed
  body for field-level error mapping.
- **Issue surfaced:** the backend CORS gap, fixed in a separate commit
  (see the previous entry).
- **Verified manually:** create, edit, delete (cancel and confirm) and
  the duplicate-email error in a real browser.
- **Known limitation:** the server checks "hire date not in the future"
  in UTC, so between 00:00 and 05:30 IST a hire date of today is
  rejected. Rare; noted rather than fixed.
- **Outcome:** 20 frontend tests passing, oxlint clean, build succeeds.