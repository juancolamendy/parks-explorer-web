# Implementation Plan: parks-explorer
_Date: 2026-10-02_
_Input: docs/design/design_spec_parks-explorer-2026-10-02.md (SDD, Human Quality Gate Approved 2026-10-02 16:56; content digest `725dded2aabe`)_

_Plan part: 2 of 2; global phases 11–18_
_Prerequisite: docs/plan/tasks_parks-explorer-2026-10-02-part-01-of-02.md (Phases 1–10 complete and Checkpoint 4 approved)_
_Next part: none_

Shared sections are in Part 1 and apply here unchanged: Design Waiver, High-Risk Items, Testing Strategy, Integration Points, Repository Evidence, Data Flow and Trust Boundaries, Contract Diffs, Migration and Rollback, Dependencies, Observability, Threat Model, Release and Rollback, Risks (R-001 to R-007), Assumptions (A1 to A7), Layer Coverage, Pull Request LOC Validation, Git isolation, and the Phase evidence template.

## Summary
Composes the Part 1 building blocks into the working app: `ParkDetails` with image fallback, the `/api/parks` route, the responsive layout, the explorer container (data states first, then map wiring and focus handoff), the page shell with real metadata and the light theme, the README with its manual verification checklist, and guard tests that enforce traceability and the structural boundaries.

## Assumptions added in Part 2
- A8: Details labels not pinned by the SDD: "Acreage not provided". Together with A5's labels, a label shows only when the supplied value is null or absent; lists use "No amenities listed" and "No photos provided".
- A9: `src/app/shell.test.tsx` mocks `next/font/google` so the real `layout.tsx` can be imported under Vitest.
- A10: Under R-003's fallback (Leaflet unusable in jsdom), the marker-level assertions in TEST-039, TEST-040(b), and TEST-056 run against a `ParkMap` stub that exposes one button per marker park; the real-marker assertions remain in `ParkMap.test.tsx` (Phase 6).

## Human Quality Gates

### Plan Approval
- Status: Approved
- Required reviewers: Technical owner; product owner. Security owner not required.
- Artifact revision: Part 2 content sha256 prefix `07271dbf4394` together with Part 1 `df832e549b04` (the revisions reviewed, before this approval was recorded); built on SDD `725dded2aabe`, requirements `9de8b75c23bc`, analysis `47b4c2cbed5a`
- Decision and conditions: Approved, no conditions. One approval covers both parts; the R-001, R-004, and R-006 decisions are recorded in Part 1's Plan Approval gate.
- Evidence: Recorded user response in conversation: "Approve the plan."
- Approved by / at: User (technical and product owner), 2026-10-02 17:09

Any material plan edit resets this approval to `Pending`. `cg-exec` must not start Phase 11 until Part 1's checkpoints through Checkpoint 4 are approved and this gate is approved for the current revision.

### Checkpoint Approvals
| Checkpoint | Prerequisite phases | Status | Artifact revision | Evidence / approver |
|---|---|---|---|---|
| Checkpoint 5 | Phases 11–13 | Pending | — | — |
| Checkpoint 6 | Phases 14–15 | Pending | — | — |
| Final Checkpoint | Phases 16–18 | Pending | — | — |

## Task Dependency Graph (Part 2 tasks)
| Task | Depends on | Inputs supplied by dependencies | Topological order | Delegation / parallelization |
|------|------------|---------------------------------|-------------------|------------------------------|
| TASK-011 | TASK-002, TASK-009, TASK-006 | `Park` type, format helpers, jest-dom and user-event installed | 11 | Sequential |
| TASK-012 | TASK-001 | Vitest runner and alias | 12 | Safe to delegate (can run any time after Phase 1; shares no files) |
| TASK-013 | TASK-006 | jest-dom installed | 13 | Sequential |
| TASK-014 | TASK-004, TASK-007, TASK-010, TASK-011, TASK-013 | Hook, context, list, details, layout | 14 | Sequential |
| TASK-015 | TASK-005, TASK-006, TASK-008, TASK-014 | `getMapView`, `ParkMap`, `useFocusOnSelect`, explorer data states | 15 | Sequential |
| TASK-016 | TASK-013, TASK-014, TASK-015 | Layout and complete explorer | 16 | Sequential |
| TASK-017 | TASK-012, TASK-015, TASK-016 | Working app and API to document and verify | 17 | Sequential |
| TASK-018 | TASK-006, TASK-015, TASK-017 | `ParkMap` file, finished source tree, README checklist | 18 | Sequential |

## Phases

### Phase 11 — Park details panel
**Goal:** `ParkDetails` shows only supplied facts and each image has its own fallback.
**Size:** M
**Files affected:** `src/components/ParkDetails.tsx`, `src/components/ParkImage.tsx`, `src/components/ParkDetails.test.tsx`
**Task:**
- [ ] TASK-011 — `ParkDetails` panel with per-image fallback

  **Requirements:** REQ-F-002, REQ-F-003, REQ-F-012, REQ-F-013, CON-003, AC-004, AC-011
  **Design:** DES-004, DES-019, DES-029
  **Changes:** CHG-019 `src/components/ParkDetails.tsx`; CHG-020 `src/components/ParkImage.tsx`
  **Tests:** TEST-025, TEST-026, TEST-027, TEST-028
  **Depends on:** TASK-002, TASK-006, TASK-009

  **Outcome:** With a park, the panel shows heading (name), address, hours, description, amenities, "{n} acres", "Rating: {n}", and images; with none, it shows the "Park details" heading and the neutral prompt. A failed image becomes a non-broken fallback block.

  **Inputs:** SDD §6 (DES-020), §8 DES-029, F4–F6, E4; format helpers (TASK-009); requirements Data Contract; assumptions A5, A8.
  **Constraints:** Heading is an `<h2 tabIndex={-1}>` that accepts a `headingRef`; region is a labelled `<section>`; plain `<img>` with `loading="lazy"` and `referrerPolicy="no-referrer"`; each image in a fixed aspect-ratio box (`aspect-video`) with the same box for the fallback; React text only (no raw HTML); no value outside the dataset; long strings wrap.
  **Rollback:** `git revert` the phase commit.
  **Measurement:** `RESULT-*` for `npm test -- src/components/ParkDetails.test.tsx` (4 tests).

  **Allowed changes:**
  - `src/components/ParkDetails.tsx`
  - `src/components/ParkImage.tsx`
  - `src/components/ParkDetails.test.tsx`

  **Do not change:** `src/lib/*`, `src/components/ParkList.tsx`, `src/components/ParkMap.tsx`.

  **Implementation steps:**
  1. Write TEST-025 to TEST-028 and confirm red.
  2. Implement CHG-019, CHG-020.
  3. Run required checks and allocate `RESULT-*` evidence.

  **Expected artifacts:** the three files above
  **Expected LOC impact:** production +85–120; tests +120–180; docs/config +0; confidence: medium; basis: SDD DES-020/DES-029 rules; no repo analogue
  **Required checks:** red: `npm test -- src/components/ParkDetails.test.tsx` (exit 1); green: same, `npm test`, `npm run lint`, `npx tsc --noEmit`
  **Policy evidence:** Untrusted-data rendering → TEST-027 asserts safe image attributes (DES-019). No dependency, contract, permission, or release change: N/A.
  **Objective-evidence mapping:** AC-011 → exact strings for `prospect-park` → TEST-025 → Vitest report → RESULT-*; AC-004 → sparse parks render, nothing invented → TEST-026 → same; AC-004 → image failure → TEST-027; DES-004 prompt state → TEST-028.
  **Size note:** over 200 authored LOC because tests are cohesive and table-driven; production ≤120; phase under 400.
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-025 | AC-011 | integration | Primary | Real sample record `prospect-park` passed through `normalizeParks` | Render `ParkDetails` | Heading "Prospect Park"; address "Brooklyn, NY 11225" and hours "6:00 AM - 1:00 AM" verbatim; each of the 7 amenities once as a formatted label; "526 acres"; "Rating: 4.7"; 2 images with alt "Photo 1 of Prospect Park" / "Photo 2 of Prospect Park" | No "/5", no review count, no extra or missing amenity | Exact-string match |
  | TEST-026 | AC-004 | integration | Primary | Normalized `old-mill-botanical-garden` (null description), `highland-dog-park` (no address), `cedar-hill-nature-preserve` (empty images, null rating) | Render each | No exception; "Description not provided", "Address not provided", "No photos provided", "Rating not provided" as applicable; every other string equals a source field or a label from A5/A8 | No fabricated text | Null, absent, empty values |
  | TEST-027 | AC-004 | resilience | Secondary — image failure and image safety are distinct risks | A park with 2 image URLs | Fire `error` on the first `<img>` | First image replaced by "Image could not be loaded" in the same-size box; second image unaffected; images carry `loading="lazy"` and `referrerPolicy="no-referrer"` | No broken-image icon; no layout-size change class removed | Image load failure |
  | TEST-028 | n/a (DES-004 prompt and focus target) | integration | Secondary — prompt and heading contract used by AC-001/AC-005 | `park` undefined; a `headingRef` | Render | Heading "Park details" with `tabIndex=-1` attached to the ref; prompt "Select a park from the list or map to see its details" | No park fields shown | Nothing selected |

  **Completion evidence:** per Phase evidence template (Part 1).

**Expected authored LOC:** production +85–120; tests +120–180 (205–300)
**Success criteria:** 4 tests green; the details panel for each of the 3 sparse sample parks renders with only supplied facts.
**Commit message:** `feat: add ParkDetails panel with image fallback`
**Git:** plan worktree.

### Phase 12 — `GET /api/parks` route
**Goal:** The endpoint returns the sample JSON unmodified.
**Size:** XS
**Files affected:** `src/app/api/parks/route.ts`, `src/app/api/parks/route.test.ts`
**Task:**
- [ ] TASK-012 — Parks route handler

  **Requirements:** REQ-F-008, CON-004, CON-005, AC-009
  **Design:** DES-006, DES-016
  **Changes:** CHG-021 `src/app/api/parks/route.ts`
  **Tests:** TEST-029, TEST-030
  **Depends on:** TASK-001

  **Outcome:** `GET` responds `200` with `Content-Type: application/json` and a body equal to the file read from disk; only `GET` is exported.

  **Inputs:** SDD §5.1 (DES-016); `src/data/parks.sample.json`; docs-confirmed pattern `export async function GET() { return Response.json(...) }`.
  **Constraints:** Static `import` of the JSON (no runtime file access in the handler); no filtering, validation, auth, or caching headers; test runs with `// @vitest-environment node` and reads the file with `fs` so the comparison is not the same import compared to itself.
  **Rollback:** `git revert` the phase commit (UI then shows its error state).
  **Measurement:** `RESULT-*` for `npm test -- src/app/api/parks/route.test.ts`; `npm run build` listing the `/api/parks` route.

  **Allowed changes:**
  - `src/app/api/parks/route.ts`
  - `src/app/api/parks/route.test.ts`

  **Do not change:** `src/data/parks.sample.json`, other files under `src/app/`.

  **Implementation steps:**
  1. Write TEST-029, TEST-030 and confirm red.
  2. Implement CHG-021.
  3. Run required checks and allocate `RESULT-*`.

  **Expected artifacts:** the two files above
  **Expected LOC impact:** production +6–10; tests +20–30; docs/config +0; confidence: high; basis: docs-confirmed route handler shape and SDD §5.1
  **Required checks:** red: `npm test -- src/app/api/parks/route.test.ts` (exit 1); green: same, `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`
  **Policy evidence:** Public API contract → contract diff: new `GET /api/parks` (200, JSON array); compatibility: no existing consumer; consumer migration: none; rollback: delete the route file. No dependency, permission, or release change: N/A.
  **Objective-evidence mapping:** AC-009 → API status/headers/body → TEST-029 → Vitest report → RESULT-*; DES-016 method surface → TEST-030.
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-029 | AC-009 | integration | Primary | Sample file read from disk with `fs` | Call exported `GET()` | Status 200; `content-type` contains `application/json`; parsed body deep-equals the parsed file | Body is not filtered or reshaped (12 records, same field set) | Body fidelity |
  | TEST-030 | n/a (DES-016 method surface) | integration | Secondary — guards against accidental mutation endpoints (CON-005) | Route module import | Inspect exports | `GET` exported | No `POST`, `PUT`, `PATCH`, `DELETE` exports | Extra methods |

  **Completion evidence:** per Phase evidence template (Part 1).

**Expected authored LOC:** production +6–10; tests +20–30 (26–40)
**Success criteria:** 2 tests green; `npm run build` lists `/api/parks`.
**Commit message:** `feat: add GET /api/parks route`
**Git:** plan worktree; Safe to parallelize (any time after Phase 1).

### Phase 13 — `ExplorerLayout`
**Goal:** Page landmarks and responsive layout with tab order equal to visual order.
**Size:** XS
**Files affected:** `src/layouts/ExplorerLayout.tsx`, `src/layouts/ExplorerLayout.test.tsx`
**Task:**
- [ ] TASK-013 — `ExplorerLayout`

  **Requirements:** REQ-NF-001, REQ-NF-002, AC-006, AC-013
  **Design:** DES-010, DES-020, DES-027
  **Changes:** CHG-022 `src/layouts/ExplorerLayout.tsx`
  **Tests:** TEST-031
  **Depends on:** TASK-006

  **Outcome:** A shell with `<main>`, one `<h1>` "Parks Explorer", and three slots (`list`, `map`, `details`) in DOM order list → map → details; stacked below `lg`; at `lg` the list is the left column and the map sits above the details in the right column.

  **Inputs:** SDD §6 (DES-020), §8 DES-027, F2, F3; slots as props.
  **Constraints:** DOM order must equal visual order on every viewport; Tailwind classes as literal strings (`lg:` grid placement); no nested scroll containers; no business logic.
  **Rollback:** `git revert` the phase commit.
  **Measurement:** `RESULT-*` for `npm test -- src/layouts/ExplorerLayout.test.tsx`.

  **Allowed changes:**
  - `src/layouts/ExplorerLayout.tsx`
  - `src/layouts/ExplorerLayout.test.tsx`

  **Do not change:** `src/components/*`, `src/app/*`.

  **Implementation steps:**
  1. Write TEST-031 and confirm red.
  2. Implement CHG-022.
  3. Run required checks and allocate `RESULT-*`.

  **Expected artifacts:** the two files above
  **Expected LOC impact:** production +35–50; tests +40–60; docs/config +0; confidence: medium; basis: SDD DES-027 arrangement
  **Required checks:** red: `npm test -- src/layouts/ExplorerLayout.test.tsx` (exit 1); green: same, `npm test`, `npm run lint`, `npx tsc --noEmit`
  **Policy evidence:** N/A — presentational component.
  **Objective-evidence mapping:** AC-006 (class and DOM-order contract only; the Primary is manual in Phase 17) → TEST-031 → Vitest report → RESULT-*.
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-031 | AC-006 | integration | Secondary — guards the DOM-order and `lg:` class contract (F2) between manual runs; the SDD lists no automated check for AC-006, so this is additive and changes no requirement | Three labelled slot stubs | Render `ExplorerLayout` | One `<main>`; exactly one `<h1>`; slot order in the DOM is list, map, details; root grid has the `lg:` two-column classes with list left and map above details on the right | No reordering classes that break DOM order; no nested `overflow-y-auto` container | Focus-order regression |

  **Completion evidence:** per Phase evidence template (Part 1).

**Expected authored LOC:** production +35–50; tests +40–60 (75–110)
**Success criteria:** 1 test green.
**Commit message:** `feat: add responsive ExplorerLayout`
**Git:** plan worktree.

### Phase 14 — `ParkExplorer` data states
**Goal:** The explorer shows loading, error with Retry, empty, and ready (list + details) states from the shared context.
**Size:** S
**Files affected:** `src/components/ParkExplorer.tsx`, `src/components/ParkExplorer.test.tsx`
**Task:**
- [ ] TASK-014 — `ParkExplorer` data states

  **Requirements:** REQ-F-001, REQ-F-002, REQ-F-003, REQ-F-007, REQ-F-009, AC-001, AC-003, AC-009, AC-015
  **Design:** DES-001, DES-007, DES-011, DES-013, DES-020
  **Changes:** CHG-023 `src/components/ParkExplorer.tsx` (`'use client'`; `ParksProvider` + `ExplorerLayout` + `ParkList` + `ParkDetails`; map slot left empty for Phase 15)
  **Tests:** TEST-032, TEST-033, TEST-034, TEST-035
  **Depends on:** TASK-004, TASK-007, TASK-010, TASK-011, TASK-013

  **Outcome:** After load the list shows every usable park with nothing selected and the details prompt visible; selecting a park shows its details; failure shows an alert with Retry; empty data shows a distinct message.

  **Inputs:** SDD §3.1, §3.2, §6; `ParksContext`, `ParkList`, `ParkDetails`, `ExplorerLayout`; assumption A5 strings.
  **Constraints:** Loading uses `role="status"`; error uses `role="alert"` and a "Retry" button wired to `retry`; empty result shows "No parks available."; no focus change on load (focus wiring comes in Phase 15); the map slot renders nothing yet; tests mock `@/lib/api`.
  **Rollback:** `git revert` the phase commit.
  **Measurement:** `RESULT-*` for `npm test -- src/components/ParkExplorer.test.tsx` (4 tests).

  **Allowed changes:**
  - `src/components/ParkExplorer.tsx`
  - `src/components/ParkExplorer.test.tsx`

  **Do not change:** the components, hooks, and lib files delivered in earlier phases.

  **Implementation steps:**
  1. Write TEST-032 to TEST-035 and confirm red.
  2. Implement CHG-023.
  3. Run required checks and allocate `RESULT-*`.

  **Expected artifacts:** the two files above
  **Expected LOC impact:** production +70–100; tests +100–150; docs/config +0; confidence: medium; basis: SDD §3.1 sequence; no repo analogue
  **Required checks:** red: `npm test -- src/components/ParkExplorer.test.tsx` (exit 1); green: same, `npm test`, `npm run lint`, `npx tsc --noEmit`
  **Policy evidence:** N/A — no dependency, contract, permission, or release change.
  **Objective-evidence mapping:** AC-001 → list, nothing selected, prompt, heading equals name → TEST-032 → Vitest report → RESULT-*; AC-003 (list and details part) → TEST-033; AC-009 (UI error and Retry) → TEST-034; AC-015 (a), (c) → TEST-035.
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-032 | AC-001 | integration | Primary | Mocked `fetchParks` returning the 12 sample records | Render `ParkExplorer`; wait for ready; click a list item | 12 list items; no `aria-current`; details region shows the neutral prompt; `document.activeElement` is `body`; after the click the details heading text equals that park's name | No item pre-selected | First load |
  | TEST-033 | AC-003 | integration | Secondary — list/details half of the criterion; the Primary (including "no marker") is TEST-056 in Phase 15 | Sample plus a clone with `location` removed | Render; select the clone | Clone listed and selectable; details render | No exception | Missing location |
  | TEST-034 | AC-009 | resilience | Secondary — UI failure and recovery; Primary is the API test (Phase 12) | `fetchParks` rejects, then resolves | Render; click Retry | `role="alert"` message and "Retry" button; no raw error text; Retry re-requests (2 calls) and the list appears | No blank screen | Failure then recovery |
  | TEST-035 | AC-015 | integration | Secondary — (a) and (c) before the map exists; the Primary is TEST-040 in Phase 15 | `[]`; all-invalid; records with bad or duplicate `id`/`name` | Render | "No parks available." for the first two; excluded records absent; first duplicate listed | No blank screen | Empty and bad data |

  **Completion evidence:** per Phase evidence template (Part 1).

**Expected authored LOC:** production +70–100; tests +100–150 (170–250)
**Success criteria:** 4 tests green; error, empty, and ready states each render distinctly.
**Commit message:** `feat: add ParkExplorer data states`
**Git:** plan worktree.

### Phase 15 — Map wiring and focus handoff
**Goal:** The map joins the explorer client-side only, selection syncs everywhere, and focus moves to the details heading.
**Size:** S
**Files affected:** `package.json`, `src/components/ParkExplorer.tsx`, `src/components/ParkExplorer.interaction.test.tsx` (+ generated lockfile)
**Task:**
- [ ] TASK-015 — Map wiring and focus handoff

  **Requirements:** REQ-F-004, REQ-F-005, REQ-F-006, REQ-F-007, REQ-F-010, REQ-NF-002, REQ-NF-003, REQ-NF-004, AC-003, AC-005, AC-007, AC-008, AC-012, AC-013, AC-015
  **Design:** DES-001, DES-005, DES-009, DES-012, DES-013, DES-018, DES-020
  **Changes:** CHG-024 `src/components/ParkExplorer.tsx` (modify: `next/dynamic` import of `ParkMap` with `ssr: false` and a same-height placeholder, rendered only when ready; heading ref and `useFocusOnSelect`); CHG-025 devDependency `vitest-axe`
  **Tests:** TEST-036, TEST-037, TEST-038, TEST-039, TEST-040, TEST-041, TEST-056
  **Depends on:** TASK-005, TASK-006, TASK-008, TASK-014

  **Outcome:** Selecting by list or marker highlights both, shows details, and focuses the heading; load causes no focus or scroll; tile failure leaves list and details working; zero/one marker maps do not crash; no geolocation is used.

  **Inputs:** SDD §3.2, §8 DES-026, §9.3; `ParkMap`, `useFocusOnSelect`, `ParksContext.focusRequest`; risks R-003, R-004; assumption A10.
  **Constraints:** `dynamic(..., { ssr: false })` lives in this client component (docs-confirmed); no static Leaflet import here; map mounts only after `ready` (DES-026); `vitest-axe` verified at install, else fall back to `axe-core` (R-004); tests mock `next/dynamic` to return `ParkMap` synchronously; contrast rules are disabled in jsdom (manual instead).
  **Rollback:** `git revert` the phase commit; `npm ci`.
  **Measurement:** `RESULT-*` for `npm test -- src/components/ParkExplorer.interaction.test.tsx` (7 tests) and full `npm test`; `npm ls vitest-axe`, `npm audit`.

  **Allowed changes:**
  - `package.json`
  - `src/components/ParkExplorer.tsx`
  - `src/components/ParkExplorer.interaction.test.tsx`

  **Do not change:** `src/components/ParkMap.tsx`, hooks, lib files, and the Phase 14 tests' assertions.

  **Implementation steps:**
  1. Install `vitest-axe` (or fall back per R-004), write TEST-036 to TEST-041 and TEST-056, confirm red.
  2. Implement CHG-024.
  3. Run required checks and allocate `RESULT-*`.

  **Expected artifacts:** updated `src/components/ParkExplorer.tsx`, new interaction test file, updated `package.json`
  **Expected LOC impact:** production +40–70 (some modified); tests +150–230; docs/config +2–4; confidence: medium; basis: SDD §3.2 and §9.3; Leaflet-in-jsdom behavior is the main uncertainty (R-003)
  **Required checks:** red: `npm test -- src/components/ParkExplorer.interaction.test.tsx` (exit 1); green: same, `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm audit`
  **Policy evidence:** New dev dependency `vitest-axe` → justification (AC-013 structural check), alternative `axe-core`, MIT licence and provenance in Dependencies, approval via Plan Approval. Others N/A.
  **Objective-evidence mapping:** AC-005 → Tab/Enter/Space, `activeElement` = heading → TEST-036 → Vitest report → RESULT-*; AC-007 → zero geolocation access → TEST-037; AC-008 → notice, flow still works → TEST-038; AC-012 → list, marker, focus agree → TEST-039; AC-015 → (a)(b)(c) → TEST-040; AC-013 (structure) → TEST-041; AC-003 → no marker for invalid coordinates → TEST-056.
  **Size note:** over 200 authored LOC because the seven tests are one cohesive acceptance suite; production ≤70; phase upper bound 304 (<400).
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-036 | AC-005 | integration | Primary | Sample data; `user-event`; spy on `scrollIntoView` | Start at `body`, Tab to a list button, Enter; Tab to another, Space; activate the selected park again | Each activation leaves `document.activeElement` on the details heading showing the park's name; re-activation refocuses the heading | On initial load focus stays on `body` and no scroll call occurs (Q-007) | Keyboard path, re-selection |
  | TEST-037 | AC-007 | integration | Primary | `navigator.geolocation` replaced by a getter spy and method spies | Full load, selection, and Retry-free flow | Zero property reads and zero `getCurrentPosition`/`watchPosition` calls; list and details work | No permission request | Location unavailable |
  | TEST-038 | AC-008 | resilience | Primary | Map rendered; `tileerror` fired on the tile layer | Dispatch `tileerror`; select a park from the list | "Map tiles could not be loaded…" `role="status"` notice once; list, selection, and details still work (AC-001 flow) | Notice not repeated per tile; no crash | Tile failure |
  | TEST-039 | AC-012 | integration | Primary | Sample data; real `ParkMap` (or stub per A10) | Activate a marker; then activate a different park from the list | Exactly one list item has `aria-current`; exactly one marker has `data-selected`; `document.activeElement` is the heading; all three move to the second park | No second selected item or marker | Marker and list sync |
  | TEST-040 | AC-015 | integration | Primary | Cases: `[]` and all-invalid; zero valid coordinates; exactly one valid coordinate; bad and duplicate records | Render each | (a) "No parks available."; (b) map region present with no markers and no exception, one marker for the single valid park; (c) bad records absent, first duplicate listed | No blank screen, no thrown error | Empty, 0/1 marker, bad data |
  | TEST-041 | AC-013 | integration | Secondary — structural accessibility (names, roles, ARIA) is automatable; contrast and real axe are manual (Phase 17) | Initial state and selected state | `axe` with the `color-contrast` rule disabled; check every button's accessible name | Zero violations in both states; no control without a name | No unnamed control | jsdom limits |
  | TEST-056 | AC-003 | integration | Primary | Sample plus a clone with `location` removed and one with `lat: "x"` | Render; select the clone | Clones listed and selectable with details; marker count equals the number of valid-coordinate parks | No marker for either clone | Invalid coordinates |

  **Completion evidence:** per Phase evidence template (Part 1), plus the R-003/R-004 outcomes.

**Expected authored LOC:** production +40–70; tests +150–230; config +2–4 (192–304)
**Success criteria:** 7 tests green; `npm run build` still exits 0 (checked again in Phase 16 with the page wired).
**Commit message:** `feat: wire ParkMap and focus handoff into ParkExplorer`
**Git:** plan worktree.

### Phase 16 — App shell: page, metadata, light theme
**Goal:** The page renders the explorer with real metadata and a light-only theme; the production build proves the map is client-only.
**Size:** S
**Files affected:** `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/shell.test.tsx`
**Task:**
- [ ] TASK-016 — App shell

  **Requirements:** REQ-NF-002, REQ-NF-004, AC-013, AC-014
  **Design:** DES-001, DES-018, DES-020, DES-021
  **Changes:** CHG-026 `src/app/page.tsx` (render `<ParkExplorer />`, remove the scaffold demo); CHG-027 `src/app/layout.tsx` (real `metadata` title and description; keep `LayoutProps<"/">`); CHG-028 `src/app/globals.css` (remove the `prefers-color-scheme: dark` block, add `color-scheme: light`)
  **Tests:** TEST-042
  **Depends on:** TASK-013, TASK-014, TASK-015

  **Outcome:** `/` shows the Parks Explorer with title "Parks Explorer" and no scaffold content; the theme is light only; `npm run build` succeeds with the map wired.

  **Inputs:** SDD §6 (DES-020, DES-021), F3; anchors `layout.tsx:15`, `layout.tsx:20`, `globals.css:15`, `page.tsx` scaffold; assumption A9.
  **Constraints:** `layout.tsx` keeps the global `LayoutProps<"/">` signature and the font setup; the build must show no `window`/`document is not defined` errors; do not edit `public/` assets.
  **Rollback:** `git revert` the phase commit.
  **Measurement:** `RESULT-*` for `npm test -- src/app/shell.test.tsx`, and for `npm run build` (exit 0 plus an excerpt confirming no server-render error: AC-014 automated prerequisite).

  **Allowed changes:**
  - `src/app/page.tsx`
  - `src/app/layout.tsx`
  - `src/app/globals.css`
  - `src/app/shell.test.tsx`

  **Do not change:** `next.config.ts`, components, `public/`.

  **Implementation steps:**
  1. Write TEST-042 and confirm red (scaffold metadata and dark block still present).
  2. Implement CHG-026 to CHG-028.
  3. Run required checks and allocate `RESULT-*`.

  **Expected artifacts:** updated `page.tsx`, `layout.tsx`, `globals.css`; new `shell.test.tsx`
  **Expected LOC impact:** production +20–30 and ~15 modified; tests +15–25; docs/config +0; confidence: medium; basis: scaffold anchors read in this run
  **Required checks:** red: `npm test -- src/app/shell.test.tsx` (exit 1); green: same, `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`
  **Policy evidence:** N/A — no dependency, contract, permission, or release change (production-facing: local assessment only; see Part 1 Release).
  **Objective-evidence mapping:** AC-014 (build prerequisite; the Primary is manual in Phase 17) → build exit and log → `npm run build` → RESULT-*; DES-020/DES-021 → metadata, theme, page content → TEST-042.
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-042 | n/a (DES-020 shell, DES-021 theme; supports AC-013, AC-014) | integration | Secondary — static shell checks that manual runs would otherwise catch late | `layout.tsx` imported with `next/font/google` mocked (A9); `globals.css` read with `fs`; `page.tsx` default export | Import and inspect | `metadata.title` is "Parks Explorer" and the description is not the scaffold text; CSS contains `color-scheme: light`; page renders the `ParkExplorer` element | CSS has no `prefers-color-scheme: dark`; no scaffold title or "Generated by create next app" | Scaffold leftovers |

  **Completion evidence:** per Phase evidence template (Part 1), plus the build-log excerpt.

**Expected authored LOC:** production +20–30 (+~15 modified); tests +15–25 (35–55)
**Success criteria:** 1 test green; `npm run build` exits 0 with the map wired in.
**Commit message:** `feat: replace scaffold page with Parks Explorer shell`
**Git:** plan worktree.

### Phase 17 — README and manual verification checklist
**Goal:** A README that documents the app and carries the owner-run end-to-end checklist.
**Size:** XS
**Files affected:** `README.md`, `src/readme.test.ts`
**Task:**
- [ ] TASK-017 — README

  **Requirements:** REQ-F-011, CON-002, AC-010 (and the manual criteria AC-002, AC-005, AC-006, AC-008, AC-009, AC-012, AC-013, AC-014)
  **Design:** DES-031, DES-023
  **Changes:** CHG-029 `README.md`
  **Tests:** TEST-043, TEST-044, TEST-045, TEST-046, TEST-047, TEST-048, TEST-049, TEST-050, TEST-051
  **Depends on:** TASK-012, TASK-015, TASK-016

  **Outcome:** README with install and run, what works, decisions, omissions, known issues, verification (commands plus manual checklist with result and date columns), next steps before public use, the OSM tile-provider caveat, the placeholder-image note, and the `react-leaflet` licence outcome (R-001).

  **Inputs:** SDD §7.1 manual rows, §7.5, DES-031; the finished app; R-001 decision; real command outputs from this plan.
  **Constraints:** Only commands that exist in `package.json`; results recorded exactly as observed; manual rows start as "pending owner run" and are filled in by the owner; no claim the app has not earned; records R-007 (manual-evidence risk accepted by the owner).
  **Rollback:** `git revert` the phase commit.
  **Measurement:** `RESULT-*` for `npm test -- src/readme.test.ts`; manual rows get their own `RESULT-*` when the owner runs them (final checkpoint).

  **Allowed changes:**
  - `README.md`
  - `src/readme.test.ts`

  **Do not change:** `AGENTS.md`, source files, requirements and SDD.

  **Implementation steps:**
  1. Write TEST-043 (README structure test; it also asserts that every manual TEST ID and its AC appear in the checklist) and confirm red.
  2. Write CHG-029.
  3. Run required checks and allocate `RESULT-*`.

  **Expected artifacts:** `README.md`, `src/readme.test.ts`
  **Expected LOC impact:** production +0; tests +30–45; docs +120–180; confidence: medium; basis: REQ-F-011 section list and SDD §7.1
  **Required checks:** red: `npm test -- src/readme.test.ts` (exit 1, scaffold README lacks required sections); green: same, `npm test`, `npm run lint`, `npm run build`
  **Policy evidence:** Human risk acceptance → R-007: the owner accepts that AC-002, 006, 013, 014 are verified manually; recorded in the README Verification section. Others N/A.
  **Objective-evidence mapping:** AC-010 → README sections and OSM caveat → TEST-043 → Vitest report → RESULT-*; AC-002 → manual TEST-044; AC-006 → TEST-045; AC-013 → TEST-046; AC-014 → TEST-047; AC-005 focus ring → TEST-048; AC-008 blocked tiles → TEST-049; AC-009 blocked API → TEST-050; AC-012 viewport → TEST-051.
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-043 | AC-010 | integration | Primary | `README.md` read with `fs` | Parse headings and text | All required sections present; OSM tile-provider caveat present; every manual TEST ID listed in the checklist | Scaffold text absent | Missing section |
  | TEST-044 | AC-002 | end-to-end | Primary (manual, owner-run) | `npm run dev` or a production build; 375 px and 1280 px | Load `/`; inspect the initial map | One marker per valid park, all inside the initial view; clicking a marker selects the same park as the list | Marker outside the view or missing = fail | Real Leaflet viewport |
  | TEST-045 | AC-006 | end-to-end | Primary (manual) | Browser at 375 px and 1280 px | Find a park and read its details | No clipped content or horizontal scroll (`scrollWidth <= clientWidth`); stacked at 375, two columns at 1280; screenshots captured | Horizontal scroll or clipped controls = fail | Layout |
  | TEST-046 | AC-013 | end-to-end | Primary (manual) | axe DevTools extension; initial and selected states | Run the scan; measure contrast | 0 violations; contrast ≥ 4.5:1 | Any violation = fail | Real contrast |
  | TEST-047 | AC-014 | end-to-end | Primary (manual) | `npm run build && npm start` | Load `/` at 375 px and 1280 px; read DevTools | Build exits 0; server log has no `window`/`document` errors; map container computed height > 0 at both widths and set by Tailwind classes | Zero height or server error = fail | Production render |
  | TEST-048 | AC-005 | end-to-end | Secondary (manual) — jsdom cannot compute CSS | Browser | Tab through list buttons | Focus ring visible on each | Missing ring = fail | Focus visibility |
  | TEST-049 | AC-008 | end-to-end | Secondary (manual) | DevTools network blocking of `tile.openstreetmap.org` | Reload; select a park | Notice shown; list and details work | List or details broken = fail | Real tile failure |
  | TEST-050 | AC-009 | end-to-end | Secondary (manual) | DevTools block of `/api/parks`, then unblock | Reload, click Retry | Alert plus Retry; Retry loads parks after unblocking | Blank screen = fail | Real API failure |
  | TEST-051 | AC-012 | end-to-end | Secondary (manual) | Browser at 375 px and 1280 px | Select a park from list and from a marker | Details heading inside the viewport after selection; marker visibly selected | Heading off-screen = fail | Real scroll and focus |

  **Completion evidence:** per Phase evidence template (Part 1), plus the README checklist as written.

**Expected authored LOC:** tests +30–45; docs +120–180 (150–225)
**Success criteria:** README test green; checklist contains all eight manual rows with owner/result/date columns.
**Commit message:** `docs: add README with verification checklist`
**Git:** plan worktree.

### Phase 18 — Traceability and structure guard tests
**Goal:** Tests that fail when an AC loses its test or when architectural boundaries are broken.
**Size:** XS
**Files affected:** `src/repo-structure.test.ts`, `src/traceability.test.ts`
**Task:**
- [ ] TASK-018 — Guard tests

  **Requirements:** REQ-F-010, REQ-NF-004, CON-002, CON-003, CON-005, AC-007, AC-015
  **Design:** DES-019, DES-023
  **Changes:** CHG-030 `src/repo-structure.test.ts`; CHG-031 `src/traceability.test.ts`
  **Tests:** TEST-052, TEST-053, TEST-054, TEST-055
  **Depends on:** TASK-006, TASK-015, TASK-017

  **Outcome:** `npm test` fails when any `AC-*` has neither a test title carrying its ID nor a README checklist entry, when Leaflet is imported outside `ParkMap`, when a database or auth dependency appears, or when `geolocation` is used in source.

  **Inputs:** `docs/requirement/requirements.md` AC ids; `src/**/*.test.*` titles; `README.md` checklist; `package.json`; SDD §10 boundaries.
  **Constraints:** Read files with `fs`; no new dependencies; helpers live inside the test files; the red baseline is a synthetic uncovered `AC-999` and a synthetic forbidden import that the helpers must flag.
  **Rollback:** `git revert` the phase commit.
  **Measurement:** `RESULT-*` for `npm test` (full suite, including both guards).

  **Allowed changes:**
  - `src/repo-structure.test.ts`
  - `src/traceability.test.ts`

  **Do not change:** any non-test source file; if a guard fails because earlier code violates a boundary, stop and report instead of editing outside the allowed paths.

  **Implementation steps:**
  1. Write TEST-052 to TEST-055 with the synthetic negatives and confirm red.
  2. Implement CHG-030, CHG-031 (the helpers inside the test files).
  3. Run required checks and allocate `RESULT-*`.

  **Expected artifacts:** the two test files
  **Expected LOC impact:** production +0; tests +90–130; docs/config +0; confidence: medium; basis: SDD §10 and the AC list; no repo analogue
  **Required checks:** red: `npm test -- src/traceability.test.ts src/repo-structure.test.ts` (exit 1); green: same, `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`
  **Policy evidence:** N/A — test-only. This phase is the CI-style traceability gate named in Part 1 (Testing Strategy), run locally with `npm test`.
  **Objective-evidence mapping:** AC-015(d) → structure and dependency checks → TEST-052 → Vitest report → RESULT-*; AC-007 → static code search → TEST-053; DES-023 → traceability → TEST-054; Leaflet boundary → TEST-055.
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-052 | AC-015 | integration | Secondary — static structure (`ParkList`, `ParkDetails`, `ParkMap` under `src/components`; OSM attribution; no database/auth dependency) is a distinct risk from runtime behavior | Repo files and `package.json` | Read and inspect | The three component files exist; `ParkMap.tsx` contains the OpenStreetMap attribution; no `prisma`, `mongoose`, `pg`, `mysql`, `sqlite`, `next-auth`, or similar in dependencies | Synthetic package list with `prisma` is flagged | Constraint drift (CON-003, CON-005) |
  | TEST-053 | AC-007 | integration | Secondary — static code search complements the runtime spy | Non-test files under `src/` | Search for `geolocation` | No occurrences | Synthetic source with `navigator.geolocation` is flagged | Hidden location use |
  | TEST-054 | n/a (DES-023 traceability gate) | integration | Secondary — protects the evidence chain | Requirements AC ids; test titles; README checklist | Compare sets | Every `AC-001`…`AC-015` appears in a test title or the README checklist | Synthetic `AC-999` reported uncovered | Lost coverage |
  | TEST-055 | n/a (DES-019/SDD §10 boundary; supports AC-014) | integration | Secondary — SSR safety depends on Leaflet staying inside `ParkMap` | Imports across `src/` | Scan import lines | `leaflet` and `react-leaflet` imported only in `src/components/ParkMap.tsx` (and its tests) | Synthetic import in `lib/` is flagged | Server-render break |

  **Completion evidence:** per Phase evidence template (Part 1).

**Expected authored LOC:** tests +90–130
**Success criteria:** 4 tests green; the full suite passes.
**Commit message:** `test: add traceability and structure guards`
**Git:** plan worktree.

## Checkpoints

### Checkpoint: After Phases 11–13
- [ ] `npm test` passes
- [ ] `npm run build` succeeds (route compiles)
- [ ] Details panel, API route, and layout are working in isolation
- [ ] Review with human before proceeding
- [ ] Record an Approved checkpoint gate (Checkpoint 5) before Phase 14

### Checkpoint: After Phases 14–15
- [ ] `npm test` passes
- [ ] End-to-end flow works for the core feature in tests: load, select by list and marker, focus handoff, failure paths
- [ ] R-003 and R-004 outcomes recorded
- [ ] Review with human before proceeding
- [ ] Record an Approved checkpoint gate (Checkpoint 6) before Phase 16

### Final Checkpoint (After Phases 16–18)
- [ ] `npm test` passes, including `src/traceability.test.ts` and `src/repo-structure.test.ts`
- [ ] `npm run lint`, `npx tsc --noEmit`, and `npm run build` exit 0
- [ ] Cross-task contract and integration checks run and recorded as `RESULT-*` (command, exit status, artifact): `npm test` (full suite), `npm run build`, and `npm test -- src/app/api/parks/route.test.ts`
- [ ] Owner has run the README manual checklist (TEST-044 to TEST-051) and recorded pass/fail and date for each row
- [ ] R-001 decision and R-007 acceptance recorded in the README
- [ ] Release prerequisites: none (local assessment); no unresolved integration risk remains
- [ ] Ready for `cg-review`

## Parallelization

| Category | Tasks | Rule |
|----------|--------|------|
| Safe to parallelize | TASK-012 (with Part 1's TASK-003, 005, 009) | No dependency path and no shared allowed changes |
| Must be sequential | TASK-011 → TASK-014 → TASK-015 → TASK-016 → TASK-017 → TASK-018 | Each produces required input for the next; TASK-014 and TASK-015 both edit `ParkExplorer.tsx` |
| Needs coordination | None | Contracts are fixed in the SDD |

## TODO List (ordered)
- [ ] Phase 11: Park details panel
- [ ] Phase 12: `GET /api/parks` route
- [ ] Phase 13: `ExplorerLayout`
- [ ] Phase 14: `ParkExplorer` data states
- [ ] Phase 15: Map wiring and focus handoff
- [ ] Phase 16: App shell: page, metadata, light theme
- [ ] Phase 17: README and manual verification checklist
- [ ] Phase 18: Traceability and structure guard tests
