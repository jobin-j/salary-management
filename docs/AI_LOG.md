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