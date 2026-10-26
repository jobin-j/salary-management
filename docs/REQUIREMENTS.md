# Salary Management — Requirements

## Goal
Replace ACME's spreadsheet-based salary management with a web application that lets the HR Manager manage salary data for ~10,000 employees across multiple countries, and answer questions about how the organisation pays people.

## User
**HR Manager** — a single, trusted user who maintains employee salary records and needs quick answers about pay across the organisation.

## Problems today
- Editing salaries in Excel is slow, unvalidated and error-prone.
- Answering pay questions ("What do engineers earn in Germany?") requires manual filtering and pivot tables.

## In scope

### 1. Manage employees
- Browse employees in a paginated table (server-side, never loading all 10,000 rows into the browser).
- Search by name; filter by country, job title and department.
- Add, edit and delete an employee, with validation (required fields, salary greater than zero).
- Employee fields: full name, email (unique), job title, department,
  country, currency (derived from country), employment type
  (full-time / part-time / contract), annual salary, hire date.
  *(Assumed — Q3, see Open questions)*
- Salary is stored in the employee's local currency (ISO 4217 code).

### 2. Salary insights
- **By country:** headcount, minimum, maximum, average and median salary, in local currency.
- **By job title within a country:** the same metrics, so the HR Manager can compare roles fairly.
- *(Assumed — Q2, see Open questions)*

### 3. Seed data
- A seed script that generates 10,000 realistic employees across several countries.
- Reproducible (fixed random seed) so tests and demos are consistent.

## Deliberately left out (and why)

| Left out | Reason |
|---|---|
| Currency conversion / cross-country totals | Comparing salaries within a country is accurate; FX conversion adds rate-source and date decisions that change the answer. *(Assumed — Q1, see Open questions)* |
| Authentication & roles | Single trusted persona; a production deployment would sit behind company SSO. *(Assumed — Q4, see Open questions)* |
| Salary history / audit trail | Current salary answers the stated problem; history changes the data model significantly. *(Assumed — Q5, see Open questions)* |
| Excel import / export | Valuable for migrating off spreadsheets, but not required to demonstrate the core. First candidate for a follow-up. |
| Natural-language (AI) querying | Hard to test deterministically and needs query-safety guardrails; structured insights answer the core questions reliably. *(Assumed — Q2, see Open questions)* |

## Success criteria
- The employee list returns any page, search or filter combination quickly (target: under 300 ms) with 10,000 employees.
- Insight queries return in under 500 ms.
- Core business logic is covered by fast, deterministic unit tests (full backend suite under 10 seconds).
- The application is deployed, seeded with 10,000 employees, and demonstrated in a video.

## Open questions
Sent to Incubyte on 22 Oct 2026: currency handling (Q1), expected
insights (Q2), mandatory employee fields (Q3), authentication (Q4),
salary history (Q5), submission timeline (Q6). No reply had arrived by
23 Oct, so I proceeded on the assumptions marked above and sent them to
Incubyte in a follow-up email that day, asking them to flag any they
disagreed with. No reply as of 26 Oct; the assumptions stand.