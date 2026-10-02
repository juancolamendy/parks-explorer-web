# Implementation Plan: parks-explorer
_Date: 2026-10-02_
_Input: docs/design/design_spec_parks-explorer-2026-10-02.md (SDD, Human Quality Gate Approved 2026-10-02 16:56; content digest `725dded2aabe`)_

_Plan part: 1 of 2; global phases 1–10_
_Prerequisite: none_
_Next part: docs/plan/tasks_parks-explorer-2026-10-02-part-02-of-02.md_

Sections marked **(plan-set scope)** apply to both parts; Part 2 refers back to them instead of repeating them.

## Summary
Delivers the Parks Explorer from the approved SDD in 18 test-first phases (≈30 min each, ≈9 h): pure data helpers, the fetch hook, the Leaflet map, shared selection state, list/details components, the `/api/parks` route, the page shell, a README with a manual verification checklist, and guard tests for traceability. Part 1 (Phases 1–10) builds the foundation and all non-composed pieces; Part 2 (Phases 11–18) composes them and finishes documentation and guards.

## Design Waiver
- Route: SDD
- Status: N/A
- Decision: `N/A — SDD used`
- Requirement source: docs/requirement/requirements.md (sha256 `9de8b75c23bc`)
- Reused pattern and boundary: N/A — SDD used
- Triage checks: N/A — SDD used
- Technical owner approval: N/A

## High-Risk Items (Scheduled in Phases 2–4) **(plan-set scope)**
- **Untrusted-data boundary and image-URL security** (DES-014, DES-019): Phase 2. Every later component builds on `normalizeParks`, so it comes first.
- **Network failure, timeout, and abort handling** (DES-017): Phase 3.
- **Fetch race conditions** (StrictMode double effects, Retry while in flight, unmount; SDD F1): Phase 4.
- **Dependencies requiring approval**: Vitest and `@types/node` in Phase 1; jsdom and Testing Library in Phase 4. The Leaflet dependencies come in Phase 6 and are gated by risk R-001 (licence).
- **Scheduling note on Leaflet:** the Leaflet client-only, keyboard, and jsdom-feasibility risk (R-002, R-003) is the largest unknown but is not one of the high-risk categories above and depends on Phase 2 types and Phase 5. It lands in Phase 6, where it opens with a timeboxed feasibility check recorded as evidence. SSR safety (AC-014) is proven when the map is wired into the page in Phase 15 and by `npm run build` in Phase 16.

## Testing Strategy **(plan-set scope)**
- **Green for the whole feature:** `npm test` exits 0 with every test below passing; `npm run lint`, `npx tsc --noEmit`, and `npm run build` exit 0; the manual end-to-end checklist in the README (Phase 17) has a recorded pass for each item.
- **Levels** are the SDD's: unit, integration, resilience; end-to-end is manual (owner-run). Component-style tests are integration (SDD §7.2). Contract and performance are N/A.
- **Test naming convention (from Phase 1):** every `describe`/`it` title carries its mapped ID, e.g. `[AC-003] …` or `[DES-019] …`.
- **Fixtures:** `src/lib/fixtures/makePark.ts` (Phase 2) clones a sample record; `parks.sample.json` is never edited.
- **Critical cases:** the invalid-coordinate table; bad/duplicate/whitespace records; non-`http(s)` images; sparse records (`old-mill-botanical-garden`, `highland-dog-park`, `cedar-hill-nature-preserve`); API failure then Retry; stale-response race; tile failure; keyboard Tab/Enter/Space with focus handoff; no `navigator.geolocation` use; 0 and 1 marker maps.
- **Traceability gate:** `npm test` includes `src/traceability.test.ts` (Phase 18), which fails when any `AC-*` in `docs/requirement/requirements.md` has neither a test title carrying its ID nor an entry in the README manual checklist. No CI exists; the gate is the local command. Until Phase 18 the naming convention is enforced by review.

## Integration Points **(plan-set scope)**
- Connects to: `GET /api/parks` (Phase 12) ← `fetchParks` (Phase 3) ← `useParksFetch` (Phase 4) ← `ParksContext` (Phase 7) ← `ParkExplorer` (Phases 14–15) ← `page.tsx` (Phase 16).
- Shared state: `selectedParkId` and `focusRequest` in `ParksContext` are read by `ParkList`, `ParkMap`, `ParkDetails`, and `useFocusOnSelect`.
- External surfaces: OpenStreetMap tile servers; image hosts named in the data.
- Files touched outside new code: `package.json`, `package-lock.json`, `AGENTS.md`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `README.md`.

## Repository Evidence **(plan-set scope)**
- The repository is a create-next-app scaffold with no feature code, so no reusable implementation pattern exists; nothing is invented to fill that gap. Anchors read in this run:
  - `src/app/layout.tsx:15` — `metadata` still "Create Next App" (replaced in Phase 16).
  - `src/app/layout.tsx:20` — `RootLayout` uses the global `LayoutProps<"/">` helper (kept).
  - `src/app/globals.css:15` — `@media (prefers-color-scheme: dark)` block (removed in Phase 16).
  - `src/app/page.tsx` — scaffold demo using `next/image` (replaced in Phase 16).
  - `src/data/parks.sample.json` — 12 records, unique ids (verified).
  - `package.json` — scripts `dev`, `build`, `start`, `lint`; no test script; `@types/node` `^20`.
- Git history consulted: `git log` shows 6 commits (`init`, `requirement analysis`, `design`), documentation only, plain lowercase messages, no ticket prefixes. `N/A — architecture is unambiguous`; no code history exists to mine.
- No mismatch between the SDD and the repository was found.

## Data Flow and Trust Boundaries **(plan-set scope)**
1. `src/data/parks.sample.json` → static import in `route.ts` → HTTP JSON response (server, trusted).
2. Browser `fetchParks` → **trust boundary #1**: response must be `res.ok`, JSON, and an array, else error.
3. `normalizeParks` → **trust boundary #2**: all fields are untrusted; drops unusable records, coerces fields, keeps only absolute `http(s)` image URLs.
4. `ParksContext` → components render only normalized values as React text (no raw HTML).
5. Third parties: OSM tile servers receive tile coordinates and the client IP; image hosts receive requests with `referrerPolicy="no-referrer"`. No credentials, PII, or cookies are sent or stored.
6. No authentication or authorization decisions exist. No sensitive data is handled.

## Contract Diffs **(plan-set scope)**
- New endpoint `GET /api/parks`: `200`, `application/json`, body = the sample file unmodified. No prior contract and no other consumer, so compatibility is not at risk.
- Rollback: delete `src/app/api/parks/route.ts`; the UI then shows its error state.
- No event or schema contracts.

## Migration and Rollback **(plan-set scope)**
N/A: no persistence, schema, or data migration exists. Rollback per phase is `git revert` of the phase commit; dependency phases also run `npm ci` to restore a lockfile-consistent tree.

## Dependencies **(plan-set scope)**
Registry data read in this run (`npm view`).

| Package | Kind | Version | Licence | Purpose | Alternatives considered | Phase |
|---|---|---|---|---|---|---|
| `vitest` | dev | 5.0.3 | MIT | Test runner | Jest (SDD DES-024) | 1 |
| `@types/node` | dev (bump `^20` → `^24`) | n/a | MIT | Vitest 5 peer needs `^22` or `>=24`; Node 24 is installed | none | 1 |
| `jsdom` | dev | 30.1.1 | MIT | DOM for component and hook tests | happy-dom | 4 |
| `@testing-library/react`, `@testing-library/dom` | dev | 16.3.3 / peer `^10` | MIT | Component and hook tests | none | 4 |
| `@testing-library/jest-dom`, `@testing-library/user-event` | dev | 7.0.1 / 14.6.7 | MIT | DOM matchers; Tab/Enter/Space | none | 6 |
| `leaflet` | runtime | 1.9.4 | BSD-2-Clause | Map engine (CON-002) | MapLibre GL (rejected by CON-002) | 6 |
| `react-leaflet` | runtime | 5.0.0 | **Hippocratic-2.1** | React bindings (CON-002); peer `react ^19`, `leaflet ^1.9` | Leaflet used directly in an effect (would change CON-002) | 6 |
| `@types/leaflet` | dev | 1.9.22 | MIT | Types | none | 6 |
| `vitest-axe` | dev | 0.1.0 | MIT | Structural accessibility checks (AC-013 secondary) | `axe-core` directly | 15 |

- Provenance: all from the public npm registry; `dist.integrity` values recorded in this run (e.g. `leaflet` `sha512-nxS1ynzJOmOl…`, `react-leaflet` `sha512-CWbTpr5vcHw5…`); each install phase re-records `npm ls <pkg>` and `npm audit` output as evidence.
- **Licence review (was blocking for Phase 6; resolved):** `react-leaflet` is under the Hippocratic License 2.1, an "ethical source" licence with use restrictions that is not OSI-approved. The other packages are MIT/BSD-2. The technical owner reviewed and agreed with the licence on 2026-10-02 17:09 (risk R-001); the decision is recorded in the Plan Approval gate.
- Approval: Plan Approval below covers the dev dependencies for Phases 1, 4, 6, 15; the runtime dependencies for Phase 6 additionally require the R-001 decision.

## Observability **(plan-set scope)**
Per SDD DES-022: one `console.error` on fetch failure and, in development only, one `console.warn` with the count of dropped records (both in Phase 4). No metrics, traces, alerts, or dashboards. Logs contain no user data and no raw error bodies. Owner: project owner.

## Threat Model and Abuse Cases **(plan-set scope)**
- Assets: user trust in displayed facts; the browser session.
- Entry points: JSON response fields; image URLs inside it; third-party tile and image hosts.
- Abuse cases and mitigations: a malicious or corrupted record with `javascript:`/`data:` image URL → dropped by `normalizeParks` (TEST-005); HTML in text fields → rendered as text only; oversized or odd strings → wrap, no layout break; remote image host tracking → `referrerPolicy="no-referrer"`, `loading="lazy"`.
- Residual risk: third-party hosts still see the client IP. Acceptable for a local assessment; the README lists pre-public work (tile provider, image hosting, security headers).

## Release and Rollback **(plan-set scope)**
N/A: local assessment, no deployment, no feature flag, no rollout stages. Rollback trigger and owner per phase are the phase-level `git revert`. The README (Phase 17) lists next steps before any public release.

## Risks and Unresolved Decisions **(plan-set scope)**
| Risk / decision | Impact | Owner | Required decision or mitigation | Due before |
|---|---|---|---|---|
| R-001 `react-leaflet` is Hippocratic-2.1 licensed | Legal/policy exposure; CON-002 mandates React Leaflet | Technical owner (user) | **Resolved 2026-10-02 17:09:** the user agreed with the licence; use of `react-leaflet` approved. (Alternative, not taken: direct Leaflet use, which would have changed CON-002.) | Phase 6 |
| R-002 Enter/Space activation of Leaflet 1.9.4 markers is unverified | AC-002/AC-012 keyboard path | Implementer | Phase 6 TEST-014 decides; add the SDD-approved `keydown` fallback if Space fails | Phase 6 |
| R-003 Leaflet may not work reliably in jsdom | Marker-level tests (AC-002 secondary, AC-012, AC-015b) | Implementer | Timeboxed (≈15 min) feasibility check at the start of Phase 6, recorded as evidence; fallback per SDD §7.3: stub `ParkMap` in explorer tests and test markers in `ParkMap.test.tsx` only | Phase 6 |
| R-004 `vitest-axe` 0.1.0 is pre-1.0; Vitest 5 compatibility unverified | AC-013 secondary check | Implementer | **Accepted 2026-10-02 17:09.** Verify at Phase 15 install; fall back to `axe-core` directly (small custom matcher) | Phase 15 |
| R-005 `@types/node` bump `^20` → `^24` could change type-checking | Build break | Implementer | Phase 1 runs `tsc --noEmit` and `npm run build` after the bump | Phase 1 |
| R-006 Lockfile excluded from the "fewer than 5 files" count (see Assumptions) | Interpretation of blast radius | Technical owner | **Accepted 2026-10-02 17:09** with the plan approval | Phase 1 |
| R-007 Manual end-to-end checks are owner-run; AC-002, 006, 013, 014 cannot be re-checked automatically | Regressions caught only on next manual run | Product/technical owner (user) | Risk accepted in the SDD; owner runs the README checklist and records results | Final checkpoint |

## Assumptions **(plan-set scope)**
Only what the SDD did not pin.
- A1: `package-lock.json` is generated lockfile churn: it is listed under files affected but excluded from the 5-file blast-radius count and from authored LOC.
- A2: `fetchParks(signal?: AbortSignal)` accepts an optional signal so `useParksFetch` can abort on cleanup (needed by SDD DES-008/DES-017; the SDD fixes the behavior, not the signature).
- A3: `@vitejs/plugin-react` is not installed up front: Vite's esbuild reads `jsx: react-jsx` from `tsconfig.json`. If JSX fails to compile in Phase 4 or 6, adding it requires approval.
- A4: The plan worktree directory is excluded locally through `.git/info/exclude` (no tracked change).
- A5: Exact UI strings the SDD did not fix: "Loading parks…"; "Parks could not be loaded. Check your connection and try again." with a "Retry" button; "No parks available."; "Map tiles could not be loaded. The list and details still work."; "Select a park from the list or map to see its details"; details heading "Park details" when nothing is selected; "Address not provided", "Hours not provided", "Description not provided", "No amenities listed", "No photos provided", "Image could not be loaded"; "Photo {n} of {name}" for alt text. These are labels, not claims about a park.
- A6: Acreage always reads "{n} acres", exactly as REQ-F-012 and Q-004 state, including for 1.
- A7: Test files sit beside the source (`*.test.ts(x)`); component tests select jsdom with `// @vitest-environment jsdom` and import `@testing-library/jest-dom/vitest` themselves, so no setup file is needed.

## Human Quality Gates

### Plan Approval
- Status: Approved
- Required reviewers: Technical owner; product owner. Security owner not required (no auth, PII, secrets).
- Artifact revision: Part 1 content sha256 prefix `df832e549b04` and Part 2 content sha256 prefix `07271dbf4394` (the revisions reviewed, before this approval was recorded); built on SDD `725dded2aabe`, requirements `9de8b75c23bc`, analysis `47b4c2cbed5a`
- Decision and conditions: Approved, no conditions. Decisions recorded with the approval: **R-001** the user agrees with the `react-leaflet` Hippocratic-2.1 licence, so Phase 6 is unblocked on that point; **R-004** accepted (`vitest-axe` 0.1.0, with the `axe-core` fallback); **R-006** accepted (lockfile excluded from the 5-file count).
- Evidence: Recorded user response in conversation: "Approve the plan." with the three decisions above.
- Approved by / at: User (technical and product owner), 2026-10-02 17:09

Any material plan edit resets this approval to `Pending`. `cg-exec` must not start Phase 1 until this gate is approved for the current revision.

### Checkpoint Approvals
| Checkpoint | Prerequisite phases | Status | Artifact revision | Evidence / approver |
|---|---|---|---|---|
| Checkpoint 1 | Phases 1–3 | Pending | — | — |
| Checkpoint 2 | Phases 4–6 | Pending | — | — |
| Checkpoint 3 | Phases 7–8 | Pending | — | — |
| Checkpoint 4 | Phases 9–10 | Pending | — | — |
| Checkpoint 5 | Phases 11–13 | Pending | — | — |
| Checkpoint 6 | Phases 14–15 | Pending | — | — |
| Final Checkpoint | Phases 16–18 | Pending | — | — |

## Layer Coverage **(plan-set scope)**
| Layer | In scope? | Phase(s) |
|-------|-----------|----------|
| Schema / migrations | N/A — no persistence | — |
| Backend / API / services | Y | 3 (client call), 12 (route) |
| Frontend | Y | 2, 4–11, 13–16 |
| Tests (fixtures / e2e) | Y | every phase (TDD); 17 (manual e2e checklist); 18 (guard tests) |
| Docs / AGENTS.md | Y | 1 (AGENTS.md commands), 17 (README) |
| Config / deps | Y | 1, 4, 6, 15 (dependencies); 16 (theme/metadata) |

## Pull Request LOC Validation **(plan-set scope)**
PR slices are review units on the single plan branch (sequential, stacked or merged one after another). Upper bounds de-duplicated; no exception LOC (no migrations, no generated code counted; lockfile churn excluded per A1).

| Proposed PR | Phases | Reviewable authored LOC (upper bound) | Exception LOC | Status / required action |
|---|---|---|---|---|
| PR 1 | 1–2 | 364 | none | Target |
| PR 2 | 3–4 | 329 | none | Target |
| PR 3 | 5–6 | 419 | none | **WARNING: large PR** (marginal; cohesive map slice) |
| PR 4 | 7–8 | 295 | none | Target |
| PR 5 | 9–10 | 240 | none | Target |
| PR 6 | 11–12 | 340 | none | Target |
| PR 7 | 13–14 | 360 | none | Target |
| PR 8 | 15 | 304 | none | Target |
| PR 9 | 16–17 | 280 | none | Target |
| PR 10 | 18 | 130 | none | Target |

- Split or justification: PR 3 is 19 lines over target. Recommended split if the reviewer prefers: Phase 5 alone (115) and Phase 6 alone (304). Not otherwise required (≤800).
- Enhanced review strategy: Not required (no PR above 800).
- Whole plan: ≈3,035 reviewable authored LOC across 10 PRs; no single PR approaches 1,000.

## Task Dependency Graph (Part 1 tasks; Part 2 continues the table)
| Task | Depends on | Inputs supplied by dependencies | Topological order | Delegation / parallelization |
|------|------------|---------------------------------|-------------------|------------------------------|
| TASK-001 | None | — | 1 | Sequential |
| TASK-002 | TASK-001 | Vitest runner, alias | 2 | Sequential |
| TASK-003 | TASK-001 | Vitest runner | 3 | Safe to delegate (no shared files with 5, 9, 12) |
| TASK-004 | TASK-002, TASK-003 | `Park` type, `normalizeParks`, `fetchParks` | 4 | Sequential |
| TASK-005 | TASK-002 | `Park`/`Coordinates` types | 5 | Safe to delegate |
| TASK-006 | TASK-002, TASK-004, TASK-005 | Types, jsdom + Testing Library installed, `getMapView` | 6 | Sequential |
| TASK-007 | TASK-004, TASK-002 | `useParksFetch`, types | 7 | Sequential |
| TASK-008 | TASK-004 | jsdom + Testing Library installed | 8 | Sequential |
| TASK-009 | TASK-002 | `Park` type | 9 | Safe to delegate |
| TASK-010 | TASK-002, TASK-006 | Types; jest-dom and user-event installed | 10 | Sequential |

## Git isolation **(plan-set scope)**
**One worktree per plan** (sequential phases share it). `{WT}` = `.worktree` (neither `.worktree` nor `.worktrees` exists, so create `.worktree`). No ticket ID is inferable.
- One-time setup from `main` (clean, at commit `4523a59`): `printf '.worktree/\n' >> .git/info/exclude` (A4), then `git worktree add .worktree/parks-explorer -b plan/parks-explorer`, then `npm install` inside the worktree (`node_modules` is not shared).
- Extra worktrees: only for Safe-to-parallelize tasks (TASK-003, 005, 009, 012) when run concurrently: `git worktree add .worktree/parks-explorer-p{N} -b plan/parks-explorer-p{N} plan/parks-explorer`. Default is sequential in the single worktree.
- Commit style follows `AGENTS.md`: no ticket prefix; one conventional-type commit per phase. Never push without an explicit request.

## Phase evidence template (plan-set scope)
Every phase's **Completion evidence** records: changed files; red-baseline command, exit status, and expected failure; green commands and exit codes; test counts; evidence anchors; discovered decisions or bounded follow-ups (or `None discovered`); remaining uncertainty. Red baselines use `npm test -- <test file>` once Phase 1 is complete. A red baseline for a new module is a failed import or failed assertion, never a skipped test.

## Phases

### Phase 1 — Test harness
**Goal:** `npm test` runs Vitest with the `@/*` alias and one green sanity test.
**Size:** S
**Files affected:** `package.json`, `vitest.config.ts`, `src/data/parks.sample.test.ts`, `AGENTS.md` (+ generated `package-lock.json`, excluded per A1)
**Task:**
- [ ] TASK-001 — Vitest harness

  **Requirements:** CON-001, CON-004 (enabler for AC-001 to AC-015 evidence)
  **Design:** DES-023, DES-024
  **Changes:** CHG-001 devDependencies `vitest`, `@types/node` bump to `^24`; CHG-002 `vitest.config.ts` (node environment by default, `@/*` alias, include `src/**/*.test.{ts,tsx}`); CHG-003 `package.json` script `"test": "vitest run"`; CHG-004 `AGENTS.md` Commands line "Unit tests" updated to `npm test`
  **Tests:** TEST-001
  **Depends on:** None

  **Outcome:** `npm test` exits 0 and proves the alias and JSON import work and the sample has 12 unique ids.

  **Inputs:** SDD §7.5, §8 DES-024; `package.json` scripts; `src/data/parks.sample.json`; `tsconfig.json` paths.
  **Constraints:** Dev dependencies need approval (covered by Plan Approval). No `jsdom` yet. Test titles carry `[AC-*]`/`[DES-*]` tags.
  **Rollback:** `git revert` the phase commit; `npm ci`.
  **Measurement:** `RESULT-*` for `npm test` summary; `npm run build` exit 0 after the `@types/node` bump (R-005); `npm audit` output recorded.

  **Allowed changes:**
  - `package.json`
  - `vitest.config.ts`
  - `src/data/parks.sample.test.ts`
  - `AGENTS.md`

  **Do not change:** `src/data/parks.sample.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `docs/policy/`, requirements/analysis/SDD files.

  **Implementation steps:**
  1. Write TEST-001; run it to see the red baseline (no `test` script).
  2. Implement CHG-001 to CHG-004.
  3. Run required checks and allocate `RESULT-*` evidence.

  **Expected artifacts:** `vitest.config.ts`, `src/data/parks.sample.test.ts`, updated `package.json`, `AGENTS.md`
  **Expected LOC impact:** production +15–25 (config); tests +10–15; docs/config +8–14; confidence: medium; basis: no repo analogue (greenfield); SDD §7.5 and a standard minimal Vitest config
  **Required checks:** red: `npm test` (exit 1, "Missing script: test"); green: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `npm audit`
  **Policy evidence:** New dev dependency → justification above, alternative Jest (DES-024), provenance and licences in Dependencies, approval via Plan Approval. Permissions, supply-chain artifact, production-facing, contract: N/A (local dev tooling; no release; no API change).
  **Objective-evidence mapping:** enabler (no AC asserted) → UI/none → TEST-001 → `npm test` summary → RESULT-* allocated by `cg-exec`
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-001 | n/a (DES-024 enabler) | unit | Secondary — proves tooling and alias for all ACs; no AC is asserted | `@/data/parks.sample.json` as committed | `npm test` | 12 records, all `id` unique, all `name` non-empty | Assertion fails if the alias does not resolve or the data changes | Alias resolution failure |

  **Completion evidence:** per Phase evidence template.

**Expected authored LOC:** production +15–25; tests +10–15; docs/config +8–14 (de-duplicated: 33–54)
**Success criteria:** `npm test` exits 0 with 1 test passing; `npm run build` exits 0 after the `@types/node` bump.
**Commit message:** `chore: add vitest test harness`
**Git:** plan worktree.

### Phase 2 — Park model and `normalizeParks`
**Goal:** Untrusted records become safe `Park` values; the shared test fixture exists.
**Size:** M
**Files affected:** `src/lib/types.ts`, `src/lib/parks.ts`, `src/lib/fixtures/makePark.ts`, `src/lib/parks.test.ts`
**Task:**
- [ ] TASK-002 — Park type and normalization

  **Requirements:** REQ-F-001, REQ-F-003, REQ-F-005, REQ-F-012, CON-004, AC-003, AC-004, AC-015
  **Design:** DES-002, DES-014, DES-019, DES-030 (§9.1)
  **Changes:** CHG-005 `src/lib/types.ts` (`Park`, `Coordinates`); CHG-006 `src/lib/parks.ts` (`normalizeParks`, `getMarkerParks`); CHG-007 `src/lib/fixtures/makePark.ts` (raw-record builder that clones a sample record with overrides)
  **Tests:** TEST-002, TEST-003, TEST-004, TEST-005
  **Depends on:** TASK-001

  **Outcome:** `normalizeParks(raw)` returns usable parks per the DES-014 table without ever throwing, and `getMarkerParks` returns exactly the parks with valid coordinates.

  **Inputs:** SDD §4.1 (DES-014 table), §9.1; requirements Data Contract and Q-002, Q-003; `src/data/parks.sample.json`.
  **Constraints:** Pure, DOM-free, no `leaflet` import; ≤70-line functions; whitespace-only counts as empty; first duplicate `id` wins; only absolute `http:`/`https:` image URLs kept; input order preserved; unknown fields dropped.
  **Rollback:** `git revert` the phase commit.
  **Measurement:** `RESULT-*` for `npm test -- src/lib/parks.test.ts` (4 tests green) and full `npm test`.

  **Allowed changes:**
  - `src/lib/types.ts`
  - `src/lib/parks.ts`
  - `src/lib/fixtures/makePark.ts`
  - `src/lib/parks.test.ts`

  **Do not change:** `src/data/parks.sample.json`, `vitest.config.ts`, any requirement or SDD text.

  **Implementation steps:**
  1. Write TEST-002 to TEST-005 first and confirm the red baseline.
  2. Implement CHG-005 to CHG-007.
  3. Run required checks and allocate `RESULT-*` evidence.

  **Expected artifacts:** the four files above
  **Expected LOC impact:** production +80–120; tests +110–160 (including +20–30 fixture helper); docs/config +0; confidence: medium; basis: SDD §4.1 table (10 fields) and §9.1 five-step algorithm; no repo analogue
  **Required checks:** red: `npm test -- src/lib/parks.test.ts` (exit 1, unresolved import of `@/lib/parks`); green: same command, `npm test`, `npm run lint`, `npx tsc --noEmit`
  **Policy evidence:** Untrusted-input handling → TEST-005 (security control, DES-019). No dependency, contract, permission, or release change: N/A.
  **Objective-evidence mapping:** AC-003 → UI/marker derivation → TEST-002 → Vitest report → RESULT-*; AC-015 → bad/duplicate records → TEST-003 → same; AC-004 → sparse fields → TEST-004 → same; DES-019 (no AC) → TEST-005.
  **Size note:** the task exceeds 200 authored LOC only because of cohesive table-driven tests (production ≤120); the phase stays under 400.
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-002 | AC-003 | unit | Secondary — exhaustive invalid-coordinate table is cheap here; the integration Primary comes in Phase 14 | `makePark` with `location` mutated | `normalizeParks([record])` | Park returned, `coordinates` is `null` for string, `null`, `NaN`, ±`Infinity`, lat 91, lng -181, missing `location`; ±90/±180 and `0,0` stay valid | A park with invalid coordinates must not be dropped, and must not appear in `getMarkerParks` | Out-of-range and non-numeric values |
  | TEST-003 | AC-015 | unit | Secondary — data-rule table; the Primary is the explorer-level test in Phase 15 | Records with missing/empty/whitespace `id` or `name`; duplicate `id`; non-array input; non-object entries | `normalizeParks(raw)` | Unusable records excluded; duplicate `id` keeps the first; non-array → `[]`; order preserved | No exception; no blank-label park | Malformed input |
  | TEST-004 | AC-004 | unit | Secondary — field coercion; the Primary is Phase 11 | Clones of `old-mill-botanical-garden`, `highland-dog-park`, `cedar-hill-nature-preserve` plus non-string amenities | `normalizeParks` | `description`/`address`/`rating` become `null`; empty arrays preserved; non-string or empty amenities dropped; negative acreage → `null` | No invented values | Null/absent fields |
  | TEST-005 | n/a (DES-019, untrusted data) | unit | Secondary — security control with no AC | Images `javascript:alert(1)`, `data:text/html,x`, `/relative.jpg`, `ftp://x`, valid `https://` | `normalizeParks` | Only absolute `http(s)` URLs kept | Disallowed schemes never reach `images` | Unsafe URL schemes |

  **Completion evidence:** per Phase evidence template.

**Expected authored LOC:** production +80–120; tests +110–160 (fixture included): 190–280, upper bound 310 with fixture margin
**Success criteria:** 4 tests green; `normalizeParks(sample)` returns 12 parks and `getMarkerParks` returns 12.
**Commit message:** `feat: add park model and normalization`
**Git:** plan worktree.

### Phase 3 — `fetchParks` client call
**Goal:** One function that loads the API response or throws on every failure class.
**Size:** S
**Files affected:** `src/lib/api.ts`, `src/lib/api.test.ts`
**Task:**
- [ ] TASK-003 — `fetchParks`

  **Requirements:** REQ-F-009, AC-009
  **Design:** DES-017
  **Changes:** CHG-008 `src/lib/api.ts` (`fetchParks(signal?)`)
  **Tests:** TEST-006, TEST-007
  **Depends on:** TASK-001

  **Outcome:** `fetchParks` resolves with the parsed array or throws on network error, non-2xx, invalid JSON, non-array, timeout, or caller abort.

  **Inputs:** SDD §5.2 (DES-017); assumption A2 (optional `signal`).
  **Constraints:** `GET /api/parks`, `cache: "no-store"`; 10 s timeout via `AbortController`; no retries, no backoff; thrown errors carry no raw response text for display; Node test environment with stubbed `fetch` and fake timers.
  **Rollback:** `git revert` the phase commit.
  **Measurement:** `RESULT-*` for `npm test -- src/lib/api.test.ts` and full `npm test`.

  **Allowed changes:**
  - `src/lib/api.ts`
  - `src/lib/api.test.ts`

  **Do not change:** `src/lib/parks.ts`, `src/lib/types.ts`, API contract (`/api/parks` path).

  **Implementation steps:**
  1. Write TEST-006, TEST-007 and confirm red.
  2. Implement CHG-008.
  3. Run required checks and allocate `RESULT-*`.

  **Expected artifacts:** `src/lib/api.ts`, `src/lib/api.test.ts`
  **Expected LOC impact:** production +25–40; tests +60–90; docs/config +0; confidence: medium; basis: SDD §5.2 bullet list; no repo analogue
  **Required checks:** red: `npm test -- src/lib/api.test.ts` (exit 1, unresolved import); green: same, `npm test`, `npm run lint`, `npx tsc --noEmit`
  **Policy evidence:** N/A — no dependency, contract change beyond the already-planned endpoint, permission, or release change.
  **Objective-evidence mapping:** AC-009 → failure behavior at the client boundary → TEST-006, TEST-007 → Vitest report → RESULT-*
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-006 | AC-009 | resilience | Secondary — failure-class matrix at the call boundary; the Primary is the API test in Phase 12 | Stubbed `fetch` returning 200 + array, 500, 200 + invalid JSON, 200 + object, rejected promise | `fetchParks()` | Array returned for 200 + array; `cache: "no-store"` passed | Every other case throws | Non-2xx, bad body, network error |
  | TEST-007 | AC-009 | resilience | Secondary — timeout and abort are distinct failure modes | Fake timers; never-resolving `fetch`; caller `AbortSignal` | Advance 10 s; abort the caller signal | Throws after 10 s; throws on caller abort | No pending request left after timeout | Timeout, cancellation |

  **Completion evidence:** per Phase evidence template.

**Expected authored LOC:** production +25–40; tests +60–90 (85–130)
**Success criteria:** 2 tests green covering all six failure classes.
**Commit message:** `feat: add fetchParks client call`
**Git:** plan worktree; Safe to parallelize with Phases 5, 9, 12.

### Phase 4 — `useParksFetch` hook
**Goal:** Race-safe loading state machine with Retry and normalized parks.
**Size:** S
**Files affected:** `package.json`, `src/hooks/useParksFetch.ts`, `src/hooks/useParksFetch.test.tsx` (+ generated lockfile)
**Task:**
- [ ] TASK-004 — `useParksFetch`

  **Requirements:** REQ-F-001, REQ-F-009, AC-009, AC-015
  **Design:** DES-008, DES-011, DES-013, DES-022
  **Changes:** CHG-009 devDependencies `jsdom`, `@testing-library/react`, `@testing-library/dom`; CHG-010 `src/hooks/useParksFetch.ts`
  **Tests:** TEST-008, TEST-009, TEST-010
  **Depends on:** TASK-002, TASK-003

  **Outcome:** The hook exposes `status` (`loading`/`ready`/`error`), `parks`, and `retry`; it aborts on cleanup and never applies a superseded response.

  **Inputs:** `fetchParks` (TASK-003), `normalizeParks` (TASK-002); SDD §3.1, §5.2, F1; assumption A5 (error message string).
  **Constraints:** Abort in-flight request on cleanup; ignore stale responses (latest-request guard); Retry is user-initiated only; user-safe error message with no raw error text; `console.error` on failure; in development `console.warn` with the count of dropped records; hook tests mock `@/lib/api`.
  **Rollback:** `git revert` the phase commit; `npm ci`.
  **Measurement:** `RESULT-*` for `npm test -- src/hooks/useParksFetch.test.tsx`; `npm ls jsdom @testing-library/react` and `npm audit` recorded.

  **Allowed changes:**
  - `package.json`
  - `src/hooks/useParksFetch.ts`
  - `src/hooks/useParksFetch.test.tsx`

  **Do not change:** `src/lib/*`, `vitest.config.ts` (use per-file `// @vitest-environment jsdom`).

  **Implementation steps:**
  1. Install the approved dev dependencies, then write TEST-008 to TEST-010 and confirm red.
  2. Implement CHG-010.
  3. Run required checks and allocate `RESULT-*`.

  **Expected artifacts:** `src/hooks/useParksFetch.ts`, `src/hooks/useParksFetch.test.tsx`, updated `package.json`
  **Expected LOC impact:** production +45–65; tests +90–130; docs/config +3–4; confidence: medium; basis: SDD §3.1 sequence and F1; no repo analogue
  **Required checks:** red: `npm test -- src/hooks/useParksFetch.test.tsx` (exit 1, unresolved import); green: same, `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm audit`
  **Policy evidence:** New dev dependencies → justification (hook/component tests), alternative happy-dom, MIT licences and provenance in Dependencies, approval via Plan Approval. Others N/A.
  **Objective-evidence mapping:** AC-009 (UI failure/recovery) → hook states → TEST-008, TEST-009 → Vitest report → RESULT-*; AC-015(a) → empty/all-invalid data → TEST-010 → same.
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-008 | AC-009 | resilience | Secondary — failure and recovery at hook level; Primary is the API test (Phase 12) | Mocked `fetchParks`: success; reject then succeed | Render hook; call `retry` | `loading` → `ready` with normalized parks; `error` then `retry` → `loading` → `ready` | Error message contains no raw error text | Network failure, recovery |
  | TEST-009 | AC-009 | resilience | Secondary — race conditions are a distinct risk (F1) | Controlled promises; `StrictMode`; unmount | Mount in `StrictMode`; unmount; `retry` while first request pending | First request's signal aborted on cleanup; stale response ignored; final state from latest request | No state update after unmount or from a superseded request | Double effects, stale response |
  | TEST-010 | AC-015 | integration | Secondary — hook-level data state; Primary is Phase 15 | `[]` and an all-invalid array | Render hook | `ready` with `parks: []` for both | Not `error` | Empty result |

  **Completion evidence:** per Phase evidence template.

**Expected authored LOC:** production +45–65; tests +90–130; config +3–4 (138–199)
**Success criteria:** 3 tests green; no `act` warnings; StrictMode run makes the second request the only one applied.
**Commit message:** `feat: add race-safe useParksFetch hook`
**Git:** plan worktree.

### Phase 5 — Map view helper
**Goal:** A pure function decides the initial map view for 0, 1, or many points.
**Size:** XS
**Files affected:** `src/lib/mapView.ts`, `src/lib/mapView.test.ts`
**Task:**
- [ ] TASK-005 — `getMapView`

  **Requirements:** REQ-F-004, AC-002, AC-015
  **Design:** DES-026, DES-030 (§9.2)
  **Changes:** CHG-011 `src/lib/mapView.ts`
  **Tests:** TEST-011, TEST-012
  **Depends on:** TASK-002

  **Outcome:** `getMapView(points)` returns `world`, `point`, or `bounds` descriptors per the SDD, with padding and max zoom.

  **Inputs:** SDD §9.2; `Coordinates` type (TASK-002).
  **Constraints:** Pure; no Leaflet import; 0 points → `center [20, 0]`, zoom 2; 1 point or all-identical points → that point at zoom 14; ≥2 distinct points → min/max bounds with padding `[32, 32]` and `maxZoom: 15`.
  **Rollback:** `git revert` the phase commit.
  **Measurement:** `RESULT-*` for `npm test -- src/lib/mapView.test.ts`.

  **Allowed changes:**
  - `src/lib/mapView.ts`
  - `src/lib/mapView.test.ts`

  **Do not change:** `src/lib/types.ts`, `src/lib/parks.ts`.

  **Implementation steps:**
  1. Write TEST-011, TEST-012 and confirm red.
  2. Implement CHG-011.
  3. Run required checks and allocate `RESULT-*`.

  **Expected artifacts:** the two files above
  **Expected LOC impact:** production +30–45; tests +50–70; docs/config +0; confidence: high; basis: SDD §9.2 specifies every case
  **Required checks:** red: `npm test -- src/lib/mapView.test.ts` (exit 1); green: same, `npm test`, `npm run lint`, `npx tsc --noEmit`
  **Policy evidence:** N/A — pure function, no dependency or contract change.
  **Objective-evidence mapping:** AC-015(b) → zero/one marker view → TEST-011 → Vitest report → RESULT-*; AC-002 → bounds contain every marker → TEST-012 → same.
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-011 | AC-015 | unit | Secondary — view rules for 0/1/identical points are a pure-logic risk; Primary is Phase 15 | Empty list; one point; three identical points | `getMapView(points)` | World view `[20, 0]` zoom 2; point view zoom 14 | No zero-area bounds descriptor | 0 and 1 marker |
  | TEST-012 | AC-002 | unit | Secondary — bounds math; Primary is manual (Phase 17) | The 12 sample coordinates; two very close points | `getMapView(points)` | Bounds contain every input point; padding `[32, 32]`; `maxZoom` 15 | No point outside bounds | Close points |

  **Completion evidence:** per Phase evidence template.

**Expected authored LOC:** production +30–45; tests +50–70 (80–115)
**Success criteria:** 2 tests green.
**Commit message:** `feat: add map view helper`
**Git:** plan worktree; Safe to parallelize with Phases 3, 9, 12.

### Phase 6 — `ParkMap` component
**Goal:** A client-only Leaflet map with one accessible marker per valid-coordinate park and a non-blocking tile-failure notice.
**Size:** M
**Files affected:** `package.json`, `src/components/ParkMap.tsx`, `src/components/ParkMap.test.tsx` (+ generated lockfile)
**Task:**
- [ ] TASK-006 — `ParkMap`

  **Requirements:** REQ-F-004, REQ-F-005, REQ-F-006, REQ-NF-003, REQ-NF-005, CON-002, CON-003, AC-002, AC-008
  **Design:** DES-005, DES-013, DES-025, DES-026, DES-028
  **Changes:** CHG-012 runtime `leaflet`, `react-leaflet`; devDependencies `@types/leaflet`, `@testing-library/jest-dom`, `@testing-library/user-event`; CHG-013 `src/components/ParkMap.tsx`
  **Tests:** TEST-013, TEST-014, TEST-015, TEST-016
  **Depends on:** TASK-002, TASK-004, TASK-005

  **Outcome:** `ParkMap` renders OSM tiles with attribution, a `divIcon` marker per park with valid coordinates (unique `title` and hidden name text, selected state with a non-colour cue), calls `onSelect(id)` on click/Enter/Space, and shows a one-time `role="status"` notice on `tileerror`.

  **Inputs:** SDD §2.2, §6 (DES-020 map wrapper), §8 DES-025/026/028, §9.2; `getMapView`; `getMarkerParks`; risks R-001 to R-003; assumption A5 (notice text).
  **Constraints:** **Blocked until R-001 is decided.** Starts with a timeboxed jsdom feasibility check recorded as evidence (R-003). Leaflet imports only in this file; marker icons created once at module level; `className: ""` on `divIcon`; Tailwind classes written as literal strings; `keyboard: true`; map wrapper is a `<section aria-label="Parks map">` with an explicit Tailwind height; the map renders only from props (`parks`, `selectedParkId`, `onSelect`); `leaflet/dist/leaflet.css` imported here.
  **Rollback:** `git revert` the phase commit; `npm ci`.
  **Measurement:** `RESULT-*` for `npm test -- src/components/ParkMap.test.tsx`; `npm ls leaflet react-leaflet @types/leaflet`, `npm audit`; the feasibility-check note.

  **Allowed changes:**
  - `package.json`
  - `src/components/ParkMap.tsx`
  - `src/components/ParkMap.test.tsx`

  **Do not change:** `src/lib/*`, `src/hooks/*`, `vitest.config.ts`.

  **Implementation steps:**
  1. Install the approved dependencies and run the jsdom feasibility check; then write TEST-013 to TEST-016 and confirm red.
  2. Implement CHG-012, CHG-013 (add the `keydown` fallback only if TEST-014 shows Space does not activate).
  3. Run required checks and allocate `RESULT-*`.

  **Expected artifacts:** `src/components/ParkMap.tsx`, `src/components/ParkMap.test.tsx`, updated `package.json`
  **Expected LOC impact:** production +100–140; tests +110–160; docs/config +4; confidence: low; basis: SDD DES-025 detail; Leaflet 1.9.4 key handling and jsdom behavior are unverified (R-002, R-003)
  **Required checks:** red: `npm test -- src/components/ParkMap.test.tsx` (exit 1, unresolved import); green: same, `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm audit`
  **Policy evidence:** New runtime dependencies → justification (CON-002), alternatives in Dependencies, provenance and licences recorded, **named human decision on the `react-leaflet` licence (R-001)** recorded before install; permission, release, contract: N/A. Material risk not resolvable by automation (R-001) → owner: user.
  **Objective-evidence mapping:** AC-002 → one marker per valid park, click/Enter/Space select → TEST-013, TEST-014 → Vitest report → RESULT-*; AC-008 → `tileerror` notice, markers remain → TEST-015 → same; DES-025 → unique accessible name and selected cue → TEST-016.
  **Size note:** task exceeds 200 authored LOC because tests are cohesive; production ≤140.
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-013 | AC-002 | integration | Secondary — marker count and selection regress without a browser; Primary is manual (Phase 17) | 12 sample parks; plus a clone with `coordinates: null` | Render `ParkMap` | 12 markers (or the count of valid parks); none for the null-coordinate park | No marker for invalid coordinates | Invalid coordinates |
  | TEST-014 | AC-002 | integration | Secondary — keyboard activation of markers is unverified (R-002) | Rendered map; `user-event` | Click, Enter, and Space on a marker | `onSelect(id)` called with that park's id for each | No call for other ids | Keyboard path |
  | TEST-015 | AC-008 | resilience | Secondary — notice behavior at component level; Primary is Phase 15 | Rendered map; fire `tileerror` several times | Dispatch `tileerror` on the tile layer | One `role="status"` notice; markers still present and clickable | Notice not duplicated per tile | Tile failure |
  | TEST-016 | n/a (DES-025 design control) | integration | Secondary — accessible name and non-colour selected cue | `selectedParkId` set to one park | Render | Each marker has a unique `title` and hidden park-name text; selected marker has `data-selected="true"` and a distinct size/ring class | Unselected markers lack both | Colour-only selection |

  **Completion evidence:** per Phase evidence template, plus the feasibility-check note and the R-001 decision reference.

**Expected authored LOC:** production +100–140; tests +110–160; config +4 (214–304)
**Success criteria:** 4 tests green; Leaflet is imported only in `ParkMap.tsx`; no SSR crash is introduced (the file is not yet used by the page).
**Commit message:** `feat: add client-only ParkMap with accessible markers`
**Git:** plan worktree.

### Phase 7 — `ParksContext` and `useParks`
**Goal:** Single source of truth for parks, status, selection, and focus requests.
**Size:** S
**Files affected:** `src/contexts/ParksContext.tsx`, `src/hooks/useParks.ts`, `src/contexts/ParksContext.test.tsx`
**Task:**
- [ ] TASK-007 — `ParksContext`

  **Requirements:** REQ-F-001, REQ-F-007, AC-001, AC-012
  **Design:** DES-007, DES-012, DES-015
  **Changes:** CHG-014 `src/contexts/ParksContext.tsx`; CHG-015 `src/hooks/useParks.ts`
  **Tests:** TEST-017, TEST-018
  **Depends on:** TASK-004, TASK-002

  **Outcome:** `ParksProvider` wraps `useParksFetch` and exposes `parks`, `status`, `selectedParkId`, derived `selectedPark`, `selectPark`, `focusRequest`, and `retry`; `useParks()` throws outside a provider.

  **Inputs:** SDD §4.2 (DES-015), §3.2; `useParksFetch`; types.
  **Constraints:** Initial `selectedParkId` is `null` and `focusRequest` is `0`; every `selectPark` call increments `focusRequest` (even for the same id); `selectedPark` is derived by id lookup, never stored; context value and callbacks memoized.
  **Rollback:** `git revert` the phase commit.
  **Measurement:** `RESULT-*` for `npm test -- src/contexts/ParksContext.test.tsx`.

  **Allowed changes:**
  - `src/contexts/ParksContext.tsx`
  - `src/hooks/useParks.ts`
  - `src/contexts/ParksContext.test.tsx`

  **Do not change:** `src/hooks/useParksFetch.ts`, `src/lib/*`.

  **Implementation steps:**
  1. Write TEST-017, TEST-018 and confirm red.
  2. Implement CHG-014, CHG-015.
  3. Run required checks and allocate `RESULT-*`.

  **Expected artifacts:** the three files above
  **Expected LOC impact:** production +50–70; tests +70–100; docs/config +0; confidence: medium; basis: SDD §4.2 table; no repo analogue
  **Required checks:** red: `npm test -- src/contexts/ParksContext.test.tsx` (exit 1); green: same, `npm test`, `npm run lint`, `npx tsc --noEmit`
  **Policy evidence:** N/A — no dependency, contract, permission, or release change.
  **Objective-evidence mapping:** AC-001 → initial no selection, selection updates → TEST-017 → Vitest report → RESULT-*; AC-012 → focus request counter → TEST-017; DES-007 guard → TEST-018.
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-017 | AC-001 | integration | Secondary — state rules at provider level; Primary is Phase 14 | Provider with mocked `useParksFetch` returning 12 parks | `selectPark("prospect-park")`, again, then an unknown id | Initially `selectedParkId` null and `focusRequest` 0; selection sets id; `focusRequest` increments on every call including repeats; unknown id gives `selectedPark` undefined | No selection before any call | Re-selection, unknown id |
  | TEST-018 | n/a (DES-007 guard) | unit | Secondary — misuse and render-stability guard | `useParks` outside a provider; re-render without state change | Render hook | Throws a descriptive error outside provider; context value identity is stable across unrelated re-renders | No silent `undefined` context | Missing provider |

  **Completion evidence:** per Phase evidence template.

**Expected authored LOC:** production +50–70; tests +70–100 (120–170)
**Success criteria:** 2 tests green.
**Commit message:** `feat: add ParksContext for shared selection`
**Git:** plan worktree.

### Phase 8 — `useFocusOnSelect`
**Goal:** Selecting a park moves focus to the details heading and scrolls only when needed, safely in jsdom.
**Size:** XS
**Files affected:** `src/hooks/useFocusOnSelect.ts`, `src/hooks/useFocusOnSelect.test.tsx`
**Task:**
- [ ] TASK-008 — `useFocusOnSelect`

  **Requirements:** REQ-F-007, REQ-NF-002, AC-005, AC-012
  **Design:** DES-009, DES-020, DES-030 (§9.3)
  **Changes:** CHG-016 `src/hooks/useFocusOnSelect.ts`
  **Tests:** TEST-019, TEST-020
  **Depends on:** TASK-004

  **Outcome:** The hook focuses the heading ref whenever `focusRequest` changes to a value above 0, never on mount, and scrolls only when the heading is not fully visible.

  **Inputs:** SDD §9.3, F5, C1; a heading ref and a `focusRequest` number.
  **Constraints:** No-op when `focusRequest` is 0 or the ref is empty; `scrollIntoView` and `matchMedia` are feature-checked; scroll `behavior` is `"auto"` under `prefers-reduced-motion`, else `"smooth"`; skip scrolling when the heading's rect is fully inside the viewport.
  **Rollback:** `git revert` the phase commit.
  **Measurement:** `RESULT-*` for `npm test -- src/hooks/useFocusOnSelect.test.tsx`.

  **Allowed changes:**
  - `src/hooks/useFocusOnSelect.ts`
  - `src/hooks/useFocusOnSelect.test.tsx`

  **Do not change:** `src/contexts/*`.

  **Implementation steps:**
  1. Write TEST-019, TEST-020 and confirm red.
  2. Implement CHG-016.
  3. Run required checks and allocate `RESULT-*`.

  **Expected artifacts:** the two files above
  **Expected LOC impact:** production +25–35; tests +60–90; docs/config +0; confidence: high; basis: SDD §9.3 specifies the rules
  **Required checks:** red: `npm test -- src/hooks/useFocusOnSelect.test.tsx` (exit 1); green: same, `npm test`, `npm run lint`, `npx tsc --noEmit`
  **Policy evidence:** N/A — no dependency, contract, permission, or release change.
  **Objective-evidence mapping:** AC-005 → focus lands on the heading → TEST-019 → Vitest report → RESULT-*; DES-009 guards → TEST-020.
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-019 | AC-005 | integration | Secondary — focus mechanics isolated; Primary is Phase 15 | A rendered `<h2 tabIndex={-1}>`; `focusRequest` 0 → 1 → 2 | Rerender with new request numbers; blur between | Not focused at 0; focused at 1; focused again at 2 after blur | No focus on mount | Re-selection |
  | TEST-020 | n/a (DES-009 guards, F5, C1) | integration | Secondary — environment guards and scroll rules | Stubbed `getBoundingClientRect`; `scrollIntoView` and `matchMedia` present, absent, and "reduce" | Rerender with `focusRequest` 1 | Scroll called with `behavior: "smooth"` when off-screen, `"auto"` under reduced motion; not called when fully visible; no exception when either API is absent | No scroll when the heading is already visible | jsdom missing APIs |

  **Completion evidence:** per Phase evidence template.

**Expected authored LOC:** production +25–35; tests +60–90 (85–125)
**Success criteria:** 2 tests green; no unhandled exceptions with `scrollIntoView` and `matchMedia` undefined.
**Commit message:** `feat: add useFocusOnSelect hook`
**Git:** plan worktree.

### Phase 9 — Format helpers
**Goal:** Display strings are produced only by formatting supplied values.
**Size:** XS
**Files affected:** `src/lib/format.ts`, `src/lib/format.test.ts`
**Task:**
- [ ] TASK-009 — Format helpers

  **Requirements:** REQ-F-012, AC-004, AC-011
  **Design:** DES-004, DES-030 (§9.4)
  **Changes:** CHG-017 `src/lib/format.ts` (`formatAmenity`, `formatAcreage`, `formatRating`, `imageAlt`)
  **Tests:** TEST-021, TEST-022
  **Depends on:** TASK-002

  **Outcome:** Pure helpers return `"Dog run"`-style labels, `"{n} acres"`, `"Rating: {n}"` or `"Rating not provided"`, and `"Photo {n} of {name}"`.

  **Inputs:** SDD §9.4, Q-004, REQ-F-012; assumptions A5, A6.
  **Constraints:** No synonyms or translations; empty labels dropped; `0` is a valid rating; no "/5" or review count; no added units beyond "acres".
  **Rollback:** `git revert` the phase commit.
  **Measurement:** `RESULT-*` for `npm test -- src/lib/format.test.ts`.

  **Allowed changes:**
  - `src/lib/format.ts`
  - `src/lib/format.test.ts`

  **Do not change:** `src/lib/types.ts`, `src/lib/parks.ts`.

  **Implementation steps:**
  1. Write TEST-021, TEST-022 and confirm red.
  2. Implement CHG-017.
  3. Run required checks and allocate `RESULT-*`.

  **Expected artifacts:** the two files above
  **Expected LOC impact:** production +25–35; tests +45–65; docs/config +0; confidence: high; basis: SDD §9.4 and Q-004 give exact outputs
  **Required checks:** red: `npm test -- src/lib/format.test.ts` (exit 1); green: same, `npm test`, `npm run lint`, `npx tsc --noEmit`
  **Policy evidence:** N/A — pure functions.
  **Objective-evidence mapping:** AC-011 → exact formatted strings → TEST-021 → Vitest report → RESULT-*; AC-004 → "not provided" label → TEST-022.
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-021 | AC-011 | unit | Secondary — formatter table; Primary is Phase 11 | Slugs `dog-run`, `wifi`, `kayak-launch`, `a--b`, `-`; acreage 526; rating 4.7 and 0 | Call each helper | "Dog run", "Wifi", "Kayak launch", "A b", dropped; "526 acres"; "Rating: 4.7", "Rating: 0" | No "/5", no extra words | Odd slugs |
  | TEST-022 | AC-004 | unit | Secondary — missing values; Primary is Phase 11 | rating `null` and `undefined`; empty name for alt | Call helpers | "Rating not provided"; alt "Photo 2 of Prospect Park" | No fabricated value | Null values |

  **Completion evidence:** per Phase evidence template.

**Expected authored LOC:** production +25–35; tests +45–65 (70–100)
**Success criteria:** 2 tests green.
**Commit message:** `feat: add display format helpers`
**Git:** plan worktree; Safe to parallelize with Phases 3, 5, 12.

### Phase 10 — `ParkList`
**Goal:** An accessible list of park buttons with a non-colour selected state.
**Size:** S
**Files affected:** `src/components/ParkList.tsx`, `src/components/ParkList.test.tsx`
**Task:**
- [ ] TASK-010 — `ParkList`

  **Requirements:** REQ-F-001, REQ-NF-002, CON-003, AC-001, AC-005
  **Design:** DES-003, DES-020
  **Changes:** CHG-018 `src/components/ParkList.tsx`
  **Tests:** TEST-023, TEST-024
  **Depends on:** TASK-002, TASK-006

  **Outcome:** `ParkList` renders a labelled "Parks" section with a `<ul>` of `<button>` items; the selected item has `aria-current="true"`, a border/weight cue, and `focus-visible:` rings.

  **Inputs:** SDD §6 (DES-020), F6, E5; props `parks`, `selectedParkId`, `onSelect`; `user-event` and `jest-dom` from Phase 6.
  **Constraints:** Native buttons only; no nested scroll container; Tailwind classes as literal strings; long names wrap (`break-words`, `min-w-0`); jsdom environment per file.
  **Rollback:** `git revert` the phase commit.
  **Measurement:** `RESULT-*` for `npm test -- src/components/ParkList.test.tsx`.

  **Allowed changes:**
  - `src/components/ParkList.tsx`
  - `src/components/ParkList.test.tsx`

  **Do not change:** `src/contexts/*`, `src/components/ParkMap.tsx`.

  **Implementation steps:**
  1. Write TEST-023, TEST-024 and confirm red.
  2. Implement CHG-018.
  3. Run required checks and allocate `RESULT-*`.

  **Expected artifacts:** the two files above
  **Expected LOC impact:** production +40–55; tests +60–85; docs/config +0; confidence: medium; basis: SDD DES-020 list rules; no repo analogue
  **Required checks:** red: `npm test -- src/components/ParkList.test.tsx` (exit 1); green: same, `npm test`, `npm run lint`, `npx tsc --noEmit`
  **Policy evidence:** N/A — no dependency, contract, permission, or release change.
  **Objective-evidence mapping:** AC-001 → one button per park, selection state → TEST-023 → Vitest report → RESULT-*; AC-005 → Tab, Enter, Space → TEST-024 → same.
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-023 | AC-001 | integration | Secondary — list rendering and selection state; Primary is Phase 14 | 12 sample parks; `selectedParkId` null, then one id | Render; click an item | One button per park with its name; click calls `onSelect(id)`; selected has `aria-current="true"` and the cue class | No `aria-current` when nothing selected | Initial state |
  | TEST-024 | AC-005 | integration | Secondary — keyboard activation of list controls; Primary is Phase 15 | Rendered list; `user-event` | Tab to a button; Enter; Space on another | First Tab lands on a park button; Enter and Space each call `onSelect` with the focused park's id; `focus-visible:` ring classes present | No activation without a key press | Keyboard path |

  **Completion evidence:** per Phase evidence template.

**Expected authored LOC:** production +40–55; tests +60–85 (100–140)
**Success criteria:** 2 tests green.
**Commit message:** `feat: add accessible ParkList`
**Git:** plan worktree.

## Checkpoints

### Checkpoint 1: After Phases 1–3
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] Test harness, data boundary, and client call are working
- [ ] Review with human before proceeding
- [ ] Record an Approved checkpoint gate before Phase 4

### Checkpoint 2: After Phases 4–6
- [ ] `npm test` passes
- [ ] High-risk items addressed and verified: normalization security (2), network failure (3), fetch races (4)
- [ ] R-001 decision recorded; Leaflet feasibility note and R-002 outcome recorded (6)
- [ ] Review with human before proceeding
- [ ] Record an Approved checkpoint gate before Phase 7

### Checkpoint 3: After Phases 7–8
- [ ] `npm test` passes
- [ ] Selection state and focus hook working in isolation
- [ ] Record an Approved checkpoint gate before Phase 9

### Checkpoint 4: After Phases 9–10
- [ ] `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` pass
- [ ] Part 1 handoff: all non-composed building blocks complete; proceed to Part 2
- [ ] Record an Approved checkpoint gate before Phase 11

## Parallelization

| Category | Tasks | Rule |
|----------|--------|------|
| Safe to parallelize | TASK-003, TASK-005, TASK-009 (and TASK-012 in Part 2) | No dependency path and no shared allowed changes; run in extra worktrees only if concurrent |
| Must be sequential | TASK-001 → TASK-002 → TASK-004 → TASK-006 → TASK-007; TASK-006 → TASK-010 | Each produces required input (types, installed dependencies, hooks) for the next |
| Needs coordination | None | No shared contract needs defining first (contracts are fixed in the SDD) |

## TODO List (ordered)
- [ ] Phase 1: Test harness
- [ ] Phase 2: Park model and `normalizeParks`
- [ ] Phase 3: `fetchParks` client call
- [ ] Phase 4: `useParksFetch` hook
- [ ] Phase 5: Map view helper
- [ ] Phase 6: `ParkMap` component
- [ ] Phase 7: `ParksContext` and `useParks`
- [ ] Phase 8: `useFocusOnSelect`
- [ ] Phase 9: Format helpers
- [ ] Phase 10: `ParkList`

**Part 1 handoff checkpoint:** this part does not complete the feature. Continue with `docs/plan/tasks_parks-explorer-2026-10-02-part-02-of-02.md` (Phases 11–18).
