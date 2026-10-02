# Implementation Plan: parks-explorer
_Date: 2026-10-02_
_Input: docs/design/design_spec_parks-explorer-2026-10-02.md (SDD, Human Quality Gate Approved 2026-10-02 16:56; content digest `725dded2aabe`)_

_Plan part: 2 of 2; global phases 11–18_
_Prerequisite (relaxed by the parallel-waves patch): docs/plan/tasks_parks-explorer-2026-10-02-part-01-of-02.md. Each Part 2 phase needs only the tasks in its `Depends on` list to be complete and its wave to have started (Phase 12: Wave 1; Phases 11 and 13: Wave 2); Phases 14–18 additionally need Checkpoint 3 Approved. See Part 1, Parallel execution protocol._
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
- Status: Approved (re-approved 2026-10-02 17:32; recorded once in Part 1's Plan Approval gate, which covers both parts)
- Required reviewers: Technical owner; product owner. Security owner not required.
- Artifact revision: Part 2 content sha256 prefix `df87bcbe9335` together with Part 1 `faecd6a198b8` (committed at `655c770`, reviewed before this approval was recorded); built on SDD `725dded2aabe`, requirements `9de8b75c23bc`, analysis `47b4c2cbed5a`
- Decision and conditions: Approved, no conditions. History: reset to Pending at 17:31 by the parallel-waves patch; originally approved 2026-10-02 17:09 for Part 2 `07271dbf4394` together with Part 1 `df832e549b04`.
- Evidence: User chose "Approve and start Wave 1" in answer to the explicit re-approval question (17:32).
- Approved by / at: User (technical and product owner), 2026-10-02 17:32

Any material plan edit resets this approval to `Pending`. `cg-exec` must not start a Part 2 phase until its `Depends on` tasks are complete, the start condition of its wave in Part 1's Parallel execution protocol is met, and this gate is approved for the current revision.

### Checkpoint Approvals
| Checkpoint | Prerequisite phases | Status | Artifact revision | Evidence / approver |
|---|---|---|---|---|
| Checkpoint 4 | Phases 14–15 | Approved (human, 2026-10-02; user also approved extending the Phase 18 TEST-055 guard) | Plan branch at the Phase 15 commit | Results covered and reviewer items: see Part 1, Checkpoint Approvals (Checkpoint 4). |
| Final Checkpoint | Phases 16–18 | Pending | — | — |

Phases 11, 12, and 13 are covered by Part 1's Checkpoint 2 (Phase 12, Wave 1) and Checkpoint 3 (Phases 11 and 13, Wave 2).

## Task Dependency Graph (Part 2 tasks)
| Task | Depends on | Inputs supplied by dependencies | Topological order | Delegation / parallelization |
|------|------------|---------------------------------|-------------------|------------------------------|
| TASK-011 | TASK-002, TASK-009, TASK-006 | `Park` type, format helpers, jest-dom and user-event installed | 11 | Wave 2 — parallel (after Wave 1 merges) |
| TASK-012 | TASK-001 | Vitest runner and alias | 12 | Wave 1 — parallel (shares no files) |
| TASK-013 | TASK-006 | jest-dom installed | 13 | Wave 2 — parallel (after Wave 1 merges) |
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
- [x] TASK-011 — `ParkDetails` panel with per-image fallback

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

  **Completion evidence (2026-10-02, Wave 2 worker, worktree `.worktree/parks-explorer-p11`, branch `plan/parks-explorer-p11`, base `178a6f5`, reserved range RESULT-180 to 199):**
  - Changed files: `src/components/ParkDetails.tsx`, `src/components/ParkImage.tsx`, `src/components/ParkDetails.test.tsx`.
  - Docs consulted before coding (Step 2.5): React reference — a function component accepts `ref` as an ordinary prop (no `forwardRef`), and `onError` is a standard element event; `next/image` was not used (DES-029).
  - Red baseline — RESULT-180: `npm test -- src/components/ParkDetails.test.tsx` → exit 1; suite failed to load, 0 tests ran: `Failed to resolve import "@/components/ParkDetails"` (the expected missing-module failure).
  - Results:
    - RESULT-181 — first implementation, same command: exit 0; 19 selected, 19 passed.
    - RESULT-182 — after adding a test for repeated amenities and image URLs (written first): exit 1; 20 selected, 19 passed, 1 failed with React's "two children with the same key" warning. Real defect in the implementation: the data is untrusted and `normalizeParks` does not dedupe amenities or image URLs, so equal values produced equal keys. Fixed in the implementation with position-qualified keys.
    - RESULT-183 — after the fix, `npm test -- src/components/ParkDetails.test.tsx`: exit 0; 1 file, 20 selected, 20 passed, 0 failed, 0 skipped (TEST-025: 4, TEST-026: 9, TEST-027: 4, TEST-028: 3); no React or `act` warnings (the only "warning" line in the output is Vite's known config notice).
    - RESULT-184 — `npm test` (full suite in this worktree): exit 0; 11 files, 176 tests, 176 passed, 0 failed, 0 skipped.
    - RESULT-185 — `npm run lint`: exit 0, no findings (the one deliberate `eslint-disable-next-line @next/next/no-img-element` carries its DES-029 reason).
    - RESULT-186 — `npm run build`: exit 0 (routes `/`, `/_not-found`, `ƒ /api/parks`).
    - RESULT-187 — `npx tsc --noEmit` (after the build created `.next/types`): exit 0.
    - RESULT-188 — mutation check of the tests (implementation temporarily broken, then both files restored byte-identical): M1 hours not verbatim → 1 failed; M2 wrong address label → 2; M3 "/5" appended to the rating → 8; M4 heading not focusable → 1; M5 heading ref not attached → 1; M6 raw amenity slugs → 4; M7 missing acreage shown as a number → 1; M8 wrong empty heading → 2; M9 wrong prompt → 1; M10 region not labelled by its heading → 1; M11 alt position off by one → 2; M12 no fallback on image error → 2; M13 referrer sent → 1; M14 images not lazy → 1; M15 box loses the fixed aspect ratio → 1; M16 duplicate keys again → 1; every run exit 1, so all sixteen are caught.
  - Evidence anchors: `src/components/ParkDetails.tsx:88` (`ParkDetails`), `src/components/ParkDetails.tsx:31` (`ParkFacts`), `src/components/ParkDetails.tsx:20` (`Field`), `src/components/ParkImage.tsx:17` (`ParkImage`), `src/components/ParkDetails.test.tsx:56`, `:127`, `:209`, `:231`, `:292` (test groups).
  - Actual authored LOC: production 115 (ParkDetails 87 + ParkImage 28); tests 232 → phase total 347 vs plan 205–300: about 47 over the upper bound (the "only text from the record or a label" check and the repeated-value and hostile-text cases were added); under the 400-line phase limit.
  - Discovered decisions / follow-ups:
    1. Labels not pinned by the plan (assumption A8 extended): "Hours not provided" and "Acreage not provided" join the other labels; the amenity label list drops entries that format to nothing, and shows "No amenities listed" when none remain.
    2. Layout: Address, Hours, and Description use a `<dl>`; acreage and rating are self-labelling lines (`formatAcreage`, `formatRating`) so no label repeats its own value; amenities are a labelled list, photos a two-column grid from the `sm` breakpoint. The heading carries a visible `focus-visible` outline, since it receives programmatic focus (visible focus is verified manually, TEST-048).
    3. `ParkImage` is a client component (it holds the failure state); `ParkDetails` has no `"use client"` directive because it holds no state and is only rendered from the client explorer.
    4. A test now asserts that every text node in the panel comes from the park record or a fixed label, which guards REQ-F-003 (nothing fabricated) beyond the plan's per-field checks.
    5. Phase 14 should pass `headingRef` from the explorer; the prompt text and heading are exported only through the component (no shared constants), so tests elsewhere should match the strings as written in the plan.
  - Remaining uncertainty: none for this phase's outcome.

**Expected authored LOC:** production +85–120; tests +120–180 (205–300)
**Success criteria:** 4 tests green; the details panel for each of the 3 sparse sample parks renders with only supplied facts.
**Commit message:** `feat: add ParkDetails panel with image fallback`
**Git:** plan worktree.

### Phase 12 — `GET /api/parks` route
**Goal:** The endpoint returns the sample JSON unmodified.
**Size:** XS
**Files affected:** `src/app/api/parks/route.ts`, `src/app/api/parks/route.test.ts`
**Task:**
- [x] TASK-012 — Parks route handler

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

  **Completion evidence (2026-10-02, Wave 1 worker, worktree `.worktree/parks-explorer-p12`, branch `plan/parks-explorer-p12`, base `53035ad`; RESULT range 130–149):**
  - Changed files: `src/app/api/parks/route.ts`, `src/app/api/parks/route.test.ts`.
  - Docs consulted before coding (Step 2.5): Next.js 16.2 Route Handler `GET` returning `Response.json(...)` (and the non-async `export function GET` form used in the redirect example), with a static JSON import.
  - Red baseline — RESULT-130: `npm test -- src/app/api/parks/route.test.ts` → exit 1; suite failed to load, 0 tests ran: `Cannot find package '@/app/api/parks/route'` (the expected missing-module failure).
  - Results:
    - RESULT-131 — `npm test -- src/app/api/parks/route.test.ts`, exit 0, TEST-029 and TEST-030; 1 file, 5 selected, 5 passed, 0 failed, 0 skipped (TEST-029: 4, TEST-030: 1).
    - RESULT-132 — `npm run build`, exit 0; the route table lists `ƒ /api/parks` (alongside `○ /` and `○ /_not-found`).
    - RESULT-133 — `npm test` (full suite on this branch): exit 0; 6 files, 89 tests, 89 passed, 0 failed, 0 skipped.
    - RESULT-134 — `npm run lint`: exit 0.
    - RESULT-135 — `npx tsc --noEmit` (after the build generated `.next/types`): exit 0.
    - RESULT-136 — mutation check of the tests (route temporarily broken, then restored byte-identical): M1 drop a record → 2 failed; M2 wrap the body in an object → 2 failed; M3 status 201 → 1 failed; M4 plain-text content type → 1 failed; M5 add a `POST` export → 1 failed; M6 strip the `rating` field from every record → 2 failed; every run exit 1, so all six are caught.
  - Evidence anchors: `src/app/api/parks/route.ts:11` (`GET`), `src/app/api/parks/route.test.ts:17` (TEST-029), `src/app/api/parks/route.test.ts:63` (TEST-030 group).
  - Actual authored LOC: production 4; tests 45 → phase total 49 vs plan 26–40: about 9 over the upper bound (four TEST-029 cases instead of one); under the 400-line phase limit.
  - Discovered decisions / follow-ups:
    1. `next build` reports the route as **dynamic** (`ƒ`, server-rendered on demand) even though the data is a static import. This matches the plan's "framework defaults, no explicit cache headers"; no change made. If the README's "known issues / next steps" should mention caching or static export, that is a Phase 17 decision.
    2. TEST-029 gained two cases beyond the plan's single row: a fresh `Response` object on every call, and an explicit "records are not filtered or reshaped" check (12 records, identical key sets).
    3. Only `GET` is exported; the `405` for other methods is Next.js framework behavior and is not exercised by a running server in this phase (the test asserts the export surface only).
  - Remaining uncertainty: item 3, the 405 behavior at runtime, is not exercised; it can be spot-checked in the manual checklist (README, Phase 17) with `curl -X POST`.

**Expected authored LOC:** production +6–10; tests +20–30 (26–40)
**Success criteria:** 2 tests green; `npm run build` lists `/api/parks`.
**Commit message:** `feat: add GET /api/parks route`
**Git:** plan worktree; Safe to parallelize (any time after Phase 1).

### Phase 13 — `ExplorerLayout`
**Goal:** Page landmarks and responsive layout with tab order equal to visual order.
**Size:** XS
**Files affected:** `src/layouts/ExplorerLayout.tsx`, `src/layouts/ExplorerLayout.test.tsx`
**Task:**
- [x] TASK-013 — `ExplorerLayout`

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

  **Completion evidence (2026-10-02, Wave 2 worker, worktree `.worktree/parks-explorer-p13`, branch `plan/parks-explorer-p13`, base `178a6f5`; RESULT range 200–219):**
  - Changed files: `src/layouts/ExplorerLayout.tsx`, `src/layouts/ExplorerLayout.test.tsx`.
  - Docs consulted before coding (Step 2.5): Tailwind v4 docs for arbitrary values (underscores become spaces, e.g. `grid-cols-[1fr_500px_2fr]`), `lg:` responsive variants, and that Tailwind detects only complete class-name strings in source files.
  - Red baseline — RESULT-200: `npm test -- src/layouts/ExplorerLayout.test.tsx` → exit 1; suite failed to load, 0 tests ran: `Failed to resolve import "@/layouts/ExplorerLayout"` (the expected missing-module failure).
  - Results:
    - RESULT-201 — `npm test -- src/layouts/ExplorerLayout.test.tsx`, exit 0, TEST-031; 1 file, 7 selected, 7 passed, 0 failed, 0 skipped.
    - RESULT-202 — `npm test` (full suite in this worktree): exit 0; 11 files, 163 tests, 163 passed, 0 failed, 0 skipped (156 baseline + 7).
    - RESULT-203 — `npm run lint`: exit 0.
    - RESULT-204 — `npm run build`: exit 0 (routes `/`, `/_not-found`, `ƒ /api/parks`; this also generated `.next/types`).
    - RESULT-205 — `npx tsc --noEmit` (after the build): exit 0.
    - RESULT-206 — generated-CSS check on the build output: the built stylesheet contains every layout class (`lg:row-span-2`, `lg:col-start-1`, `lg:col-start-2`, `lg:row-start-1`, `lg:row-start-2`, `lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]`, `lg:grid-rows-[auto_1fr]`, `lg:items-start`, `min-w-0`, `grid-cols-1`, `max-w-7xl`), and the `lg` breakpoint is `min-width:64rem` (1024 px), matching DES-027. Tailwind picked the classes up from the layout file even though no page imports it yet.
    - RESULT-207 — mutation check of the tests (implementation temporarily broken, then restored byte-identical): M1 details before map in the DOM → 1 failed; M2 `lg:order-first` on details → 1 failed; M3 list no longer spans two rows → 1 failed; M4 `overflow-y-auto` around the list → 1 failed; M5 h1 becomes h2 → 1 failed; M6 `<main>` becomes `<div>` → 2 failed; M7 details in the wrong column → 1 failed; M8 map slot loses `min-w-0` → 1 failed; M9 row template removed → 1 failed; M10 a second h1 → 1 failed; every run exit 1, so all ten are caught.
  - Evidence anchors: `src/layouts/ExplorerLayout.tsx:22` (`ExplorerLayout`), `src/layouts/ExplorerLayout.test.tsx:38`, `:65`, `:116` (the three test groups for TEST-031).
  - Actual authored LOC: production 18; tests 88 → phase total 106 vs plan 75–110: inside the estimate.
  - Discovered decisions / follow-ups:
    1. The grid uses `lg:grid-rows-[auto_1fr]` and `lg:items-start`, so extra list height is absorbed by the details row and never opens a gap under the map; the test pins `lg:grid-rows-[auto_1fr]` as part of the class contract.
    2. The component has no `"use client"` directive (it has no hooks or state), so it stays a Server Component when imported from a server file and becomes part of the client bundle when imported by the client `ParkExplorer` (Phase 14).
    3. Exported as a named export `ExplorerLayout` (not default); Phase 14 should import it by name.
    4. This is a jsdom DOM-order and class contract only. Real stacking at 375 px, the two-column arrangement at 1280 px, and absence of horizontal scroll still need the manual AC-006 check (TEST-045) in Phase 17.
    5. Outside this phase's allowed files and left untouched: `AGENTS.md` still says "Integration tests: N/A — no test runner configured yet", which has been stale since Phase 4.
  - Remaining uncertainty: none for this phase's outcome.

**Expected authored LOC:** production +35–50; tests +40–60 (75–110)
**Success criteria:** 1 test green.
**Commit message:** `feat: add responsive ExplorerLayout`
**Git:** plan worktree.

### Phase 14 — `ParkExplorer` data states
**Goal:** The explorer shows loading, error with Retry, empty, and ready (list + details) states from the shared context.
**Size:** S
**Files affected:** `src/components/ParkExplorer.tsx`, `src/components/ParkExplorer.test.tsx`
**Task:**
- [x] TASK-014 — `ParkExplorer` data states

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

  **Completion evidence (2026-10-02, plan worktree, branch `plan/parks-explorer`; sequential phase, results from RESULT-230):**
  - Changed files: `src/components/ParkExplorer.tsx`, `src/components/ParkExplorer.test.tsx`.
  - Docs note (Step 2.5): no new framework pattern; the Client Component plus context provider and React `useRef` ref-passing were checked against the Next.js and React docs in Phases 4 and 7.
  - Red baseline — RESULT-230: `npm test -- src/components/ParkExplorer.test.tsx` → exit 1; suite failed to load, 0 tests ran: `Failed to resolve import "@/components/ParkExplorer"` (the expected missing-module failure).
  - Results:
    - RESULT-231 — `npm test -- src/components/ParkExplorer.test.tsx`, exit 0, TEST-032 to TEST-035; 1 file, 22 selected, 22 passed, 0 failed, 0 skipped (TEST-032: 15, TEST-033: 1, TEST-034: 3, TEST-035: 3).
    - RESULT-232 — `npm test` (full suite): exit 0; 14 files, 219 tests, 219 passed, 0 failed, 0 skipped.
    - RESULT-233 — `npm run lint`: exit 0.
    - RESULT-234 — `npm run build`: exit 0 (routes `/`, `/_not-found`, `ƒ /api/parks`).
    - RESULT-235 — `npx tsc --noEmit`: exit 0.
    - RESULT-236 — mutation check of the tests (component temporarily broken, then restored byte-identical): M1 loading no longer a status → 1 failed; M2 Retry does nothing → 1 failed; M3 failure not an alert → 2 failed; M4 no empty-data branch → 2 failed; M5 details shown while loading → 1 failed; M6 nothing marked current → 13 failed; M7 selecting does nothing → 14 failed; M8 details never shows the park → 14 failed; every run exit 1, so all eight are caught.
  - Evidence anchors: `src/components/ParkExplorer.tsx:73` (`ParkExplorer`), `:19` (`ExplorerContent`), `:15` (`Message`); `src/components/ParkExplorer.test.tsx:36` (TEST-032), `:105` (TEST-033), `:124` (TEST-034), `:179` (TEST-035).
  - Actual authored LOC: production 62; tests 148 → phase total 210, within the plan's 170–250.
  - Discovered decisions / follow-ups:
    1. **Where the states render.** Loading, failure, and empty data replace only the list slot; the map and details slots are `null` in those states, so the layout (with its `<h1>`) is always present and the "Select a park…" prompt never appears while there is nothing to select.
    2. Loading is a `role="status"` wrapper and failure a `role="alert"` wrapper around a shared message box; the failure text comes from `useParksFetch` (no raw error text), and Retry calls the context's `retry`.
    3. **For Phase 15:** the heading ref is already created and passed to `ParkDetails`; Phase 15 attaches `useFocusOnSelect(headingRef, focusRequest)` and replaces the `map={null}` in the ready branch with the client-only `ParkMap`. No focus change happens on load today (asserted by TEST-032).
    4. The Phase 7 retry-selection question is unchanged: a selection made before a failed load is kept and reappears if the retry returns the same data. The tests here do not depend on either behavior.
  - Remaining uncertainty: none for this phase's outcome.

**Expected authored LOC:** production +70–100; tests +100–150 (170–250)
**Success criteria:** 4 tests green; error, empty, and ready states each render distinctly.
**Commit message:** `feat: add ParkExplorer data states`
**Git:** plan worktree.

### Phase 15 — Map wiring and focus handoff
**Goal:** The map joins the explorer client-side only, selection syncs everywhere, and focus moves to the details heading.
**Size:** S
**Files affected:** `package.json`, `src/components/ParkExplorer.tsx`, `src/components/ParkExplorer.interaction.test.tsx`, `src/components/ParkExplorer.test.tsx` (setup-only stub of the map; see the plan revision below) (+ generated lockfile)
**Plan revision (2026-10-02 17:58, confirmed by the user):** wiring the map into `ParkExplorer` makes every marker a button named after its park, so Phase 14's unscoped `getByRole("button", { name })` queries became ambiguous (12 failures: "Found multiple elements with the role button"). The user chose to keep Phase 14's tests focused on the data states by stubbing the client-only map there. This adds `src/components/ParkExplorer.test.tsx` to this phase's allowed changes for **one `vi.mock("next/dynamic", …)` stub only**: no assertion is added, removed, or changed. The phase stays at 4 files (limit: fewer than 5).
**Task:**
- [x] TASK-015 — Map wiring and focus handoff

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
  - `src/components/ParkExplorer.test.tsx` (only a `vi.mock("next/dynamic", …)` map stub with its comment; see the plan revision above)

  **Do not change:** `src/components/ParkMap.tsx`, hooks, lib files, and the Phase 14 tests' assertions (the stub is the only permitted edit to that file).

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

  **Completion evidence (2026-10-02, plan worktree, branch `plan/parks-explorer`; sequential phase, results from RESULT-237):**
  - Changed files: `package.json` (+ generated `package-lock.json`, excluded per A1), `src/components/ParkExplorer.tsx` (modified), `src/components/ParkExplorer.interaction.test.tsx` (new), `src/components/ParkExplorer.test.tsx` (setup-only map stub, see the plan revision above).
  - Dependency (R-004 outcome): `vitest-axe@0.1.0` installed; `npm audit` 0 vulnerabilities. Its peer range (`vitest >=0.16`) covers Vitest 5, its `axe`/`configureAxe` work, but its `toHaveNoViolations` matcher types do not fit Vitest 5's `Assertion` type (TS2339), so tests assert on `results.violations` directly. Transitive `axe-core@4.13.0` is licensed MPL-2.0 (dev-only, not shipped); the wrapper's last release was 2025-01-22.
  - Docs consulted (Step 2.5): Next.js `next/dynamic` (`ssr: false` only in a Client Component; the `loading` option), the `vitest-axe` README (installed copy; no docs in context7), and the installed ParkMap and useFocusOnSelect sources.
  - Red baseline — RESULT-237: `npm test -- src/components/ParkExplorer.interaction.test.tsx` → exit 1; 19 tests, 13 failed (no map region, no focus handoff), 6 passed. The 6 that passed guard behavior that already existed: no focus change on load, the empty-data message, the geolocation check on the Retry path, and the two axe scans (which ran before any map existed).
  - Results:
    - RESULT-238 — after wiring the map and the focus hook, same file: exit 0; 19 passed.
    - RESULT-239 — `npm test` (full suite): exit 1; 15 files, 238 tests, 12 failed, all in `ParkExplorer.test.tsx` (Phase 14): `Found multiple elements with the role "button"`, because each map marker is a button named after its park. Resolved by the user-confirmed plan revision: a setup-only `vi.mock("next/dynamic", …)` stub in that file (diff: 6 added lines, 0 removed, no assertion touched).
    - RESULT-240 — `npm run build`: exit 1; `TS2339: Property 'toHaveNoViolations' does not exist on type 'Assertion<void, AxeResults>'` (the project type-checks test files; Vitest does not). RESULT-241 — `npx tsc --noEmit`: exit 2, same error. Resolved by asserting `results.violations` toEqual `[]`.
    - RESULT-242 — final `npm test -- src/components/ParkExplorer.interaction.test.tsx`: exit 0; 21 selected, 21 passed, 0 failed, 0 skipped (TEST-036: 3, TEST-037: 2, TEST-038: 2, TEST-039: 3, TEST-040: 7, TEST-041: 3, TEST-056: 1).
    - RESULT-243 — `npm test` (full suite): exit 0; 15 files, 240 tests, 240 passed, 0 failed, 0 skipped; no React or `act` warnings.
    - RESULT-244 — `npm run lint`: exit 0. RESULT-245 — `npm run build`: exit 0 (routes `/`, `/_not-found`, `ƒ /api/parks`). RESULT-246 — `npx tsc --noEmit`: exit 0. RESULT-247 — `npm audit`: exit 0, 0 vulnerabilities.
    - RESULT-248 — mutation check of `ParkExplorer.tsx` against both explorer test files (component temporarily broken, then restored byte-identical): M1 no focus handoff → 5 failed; M2 map never rendered → 11 failed; M3 map gets no selection → 2 failed; M4 marker selection does nothing → 4 failed; M5 an unnamed button in the page → 3 failed (so the axe scans do catch real violations); M6 reads `navigator.geolocation` → 2 failed; M8 map mounted for empty data → 2 failed; M10 heading ref not attached → 5 failed. **M7 (map mounted while loading) and M9 (map mounted on failure) survived** (41 passed): nothing asserted that the map stays out until the data is ready (SDD DES-026). Two tests were added (loading, and failure then Retry with all 12 markers), and both mutations are now caught (1 failed each, 43 tests). The first attempt at M7 to M9 was invalid (a shell quoting error stopped the mutation from applying) and was discarded and redone with a script.
    - RESULT-249 — build-level mutations (the one thing jsdom cannot prove): B1 removing `ssr: false` → `npm run build` exit 0; B2 replacing the dynamic import with a static `import ParkMap` → `npm run build` exit 0. Both survive; see follow-up 4.
  - Evidence anchors: `src/components/ParkExplorer.tsx:33` (`dynamic` `ParkMap`), `:43` (`ExplorerContent`), `:49` (`useFocusOnSelect(headingRef, focusRequest)`), `:20` (`MapPlaceholder`); `package.json:35` (`vitest-axe`).
  - Actual authored LOC: production about 40 (79 lines in the file, 62 before this phase); tests 284 (interaction file) + 1 (stub); config +3 → phase total about 328 vs plan 192–304: about 24 over the upper bound (21 tests including two added after mutation survivors); under the 400-line phase limit.
  - Discovered decisions / follow-ups:
    1. **Plan revision (user-confirmed):** Phase 15 edited Phase 14's test file with a setup-only map stub (above). No assertion changed.
    2. **R-004 outcome:** `vitest-axe` is usable through `axe`/`configureAxe`, but not its matcher/types under Vitest 5. Using `axe-core` directly would be an equivalent, smaller alternative; no change made.
    3. **Dependency note:** `vitest-axe` pulls `axe-core` under MPL-2.0 (a file-level licence, dev-only, nothing shipped) and has not been released since 2025-01-22; the owner should be aware (the plan's dependency table listed only the wrapper's MIT licence).
    4. **Client-only map is protected by two layers that the build cannot tell apart.** The map is rendered only after the client-side fetch completes, so the server render (the loading state) never includes it, and Leaflet 1.9.4 can be imported on a server without crashing. Therefore neither removing `ssr: false` nor a static import breaks `npm run build`, and no automated test guards `ssr: false` or the code-split chunk (DES-018, REQ-NF-004). Recommendation for Phase 18: extend the TEST-055 guard to also require that `ParkExplorer.tsx` passes `ssr: false` to `dynamic` and has no static import of `@/components/ParkMap`; the manual production check TEST-047 stays. Not done here, because it is outside this phase's allowed files and the Phase 18 plan text would need the change.
    5. `next/dynamic` is mocked in jsdom (as the plan says), so the real chunk loading, the `loading` placeholder, and `ssr: false` are not exercised by unit tests; they rely on the build and the manual checks.
    6. The axe scans exclude `color-contrast` (jsdom has no layout); contrast and the real focus ring stay with manual TEST-046 and TEST-048.
    7. The Phase 7 retry-selection question is unchanged and still open.
  - Remaining uncertainty: none for this phase's outcome beyond follow-up 4.

**Expected authored LOC:** production +40–70; tests +150–230; config +2–4 (192–304)
**Success criteria:** 7 tests green; `npm run build` still exits 0 (checked again in Phase 16 with the page wired).
**Commit message:** `feat: wire ParkMap and focus handoff into ParkExplorer`
**Git:** plan worktree.

### Phase 16 — App shell: page, metadata, light theme
**Goal:** The page renders the explorer with real metadata and a light-only theme; the production build proves the map is client-only.
**Size:** S
**Files affected:** `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/shell.test.tsx`
**Task:**
- [x] TASK-016 — App shell

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

  **Completion evidence (2026-10-02, plan worktree, branch `plan/parks-explorer`; sequential phase, results from RESULT-250):**
  - Changed files: `src/app/page.tsx` (CHG-026, now renders `<ParkExplorer />`; scaffold demo and `next/image` use removed), `src/app/layout.tsx` (CHG-027, title "Parks Explorer", real description; `LayoutProps<"/">` and fonts kept), `src/app/globals.css` (CHG-028, dark media block removed, `color-scheme: light` added to `:root`), `src/app/shell.test.tsx` (new, 3 tests under TEST-042).
  - Docs consulted (Step 2.5): installed Next.js 16.3.8 metadata and `next/font` usage already in the scaffold; no new framework pattern introduced.
  - Red baseline — RESULT-250: `npm test -- src/app/shell.test.tsx` → exit 1; 3 tests, 3 failed (scaffold title and description, no `color-scheme: light` plus the dark block present, page renders a `div` instead of `ParkExplorer`).
  - Results:
    - RESULT-251 — same command after implementing: exit 0; 3 selected, 3 passed, 0 failed, 0 skipped.
    - RESULT-252 — `npm test` (full suite): exit 0; 16 files, 243 tests, 243 passed, 0 failed, 0 skipped.
    - RESULT-253 — `npm run lint`: exit 0. RESULT-254 — `npx tsc --noEmit`: exit 0.
    - RESULT-255 — `npm run build`: exit 0 (Next.js 16.3.8 Turbopack; "Compiled successfully", "Finished TypeScript", "Generating static pages (5/5)"); routes `○ /`, `○ /_not-found`, `ƒ /api/parks`; no `window is not defined` or `document is not defined` in the log (AC-014 automated prerequisite; the Primary stays manual in Phase 17).
    - RESULT-256 — mutation check of the shell files against `shell.test.tsx` (each restored byte-identical): M1 scaffold title → exit 1; M2 scaffold description → exit 1; M3 `color-scheme: light` removed → exit 1; M4 dark media block re-added → exit 1; M5 page renders `<div />` → exit 1. All 5 caught; no survivors.
  - Evidence anchors: `src/app/page.tsx:3` (`Home`), `src/app/layout.tsx:15` (`metadata`), `src/app/globals.css:6` (`color-scheme`).
  - Actual authored LOC: production about 5 added, 2 modified, 7 deleted; tests 36 → about 43 vs plan 35–55: within range.
  - Discovered decisions / follow-ups:
    1. The build prerenders `/` statically; the loading state is what the server renders, so the build does not exercise the map (see Phase 15 follow-up 4, guarded in Phase 18 by TEST-055).
    2. `body` in `globals.css` still sets `font-family: Arial` over the Geist font variable; unchanged because it is outside this phase's intent. None other discovered.
  - Remaining uncertainty: none.

**Expected authored LOC:** production +20–30 (+~15 modified); tests +15–25 (35–55)
**Success criteria:** 1 test green; `npm run build` exits 0 with the map wired in.
**Commit message:** `feat: replace scaffold page with Parks Explorer shell`
**Git:** plan worktree.

### Phase 17 — README and manual verification checklist
**Goal:** A README that documents the app and carries the owner-run end-to-end checklist.
**Size:** XS
**Files affected:** `README.md`, `src/readme.test.ts`
**Task:**
- [x] TASK-017 — README

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

  **Completion evidence (2026-10-02, plan worktree, branch `plan/parks-explorer`; sequential phase, results from RESULT-257):**
  - Changed files: `README.md` (CHG-029, scaffold README replaced), `src/readme.test.ts` (new, 19 tests under TEST-043).
  - Red baseline — RESULT-257: `npm test -- src/readme.test.ts` → exit 1; 19 tests, 18 failed (scaffold README: no required sections, scaffold text, no OSM caveat, no checklist rows), 1 passed (the npm-script check, because the scaffold only names `npm run dev`).
  - Results:
    - RESULT-258 — same command after writing the README: exit 0; 19 selected, 19 passed, 0 failed, 0 skipped.
    - RESULT-259 — `npm test` (full suite): exit 0; 17 files, 262 tests, 262 passed, 0 failed, 0 skipped.
    - RESULT-260 — `npm run lint`: exit 0. RESULT-261 — `npx tsc --noEmit`: exit 0. RESULT-262 — `npm run build`: exit 0.
    - RESULT-263 — mutation check of `README.md` against `readme.test.ts` (restored byte-identical each time): M1 required heading renamed, M2 a checklist row removed, M3 a row's AC changed, M4 Owner/Result/Date columns reordered, M5 a nonexistent npm script, M6 OSM caveat removed, M7 placeholder-image note removed, M8 licence note removed, M9 scaffold text added → all 9 exit 1; no survivors.
  - Manual checklist (TEST-044 to TEST-051): written in the README with owner, result and date columns, all "pending owner run". They get their own `RESULT-*` when the owner runs them (final checkpoint). R-007 (manual-evidence risk) is recorded in the README Verification section; the owner already accepted it in the SDD.
  - Evidence anchors: `README.md` sections "Install and run", "What works", "Decisions", "Omissions", "Known issues", "Verification" (manual checklist table), "Before public use".
  - Actual authored LOC: tests about 58 (plan 30–45: about 13 over, from per-section and per-check `it.each` rows); docs about 80 lines of README prose plus the 8-row table (plan 120–180: under); phase total well under 400.
  - Discovered decisions / follow-ups:
    1. The README repeats the open items for the owner (Vite config ESM warning, retry not clearing the selection) as Known issues; none were fixed here (outside allowed files).
    2. The test checks that the checklist rows exist and name the right AC, not that the owner has run them; Phase 18 does not change that, so the manual rows stay an owner action.
    3. None other discovered.
  - Remaining uncertainty: the README states layout and behaviour as built; the manual rows are the only proof of the browser-level claims.

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

  **Outcome:** `npm test` fails when any `AC-*` has neither a test title carrying its ID nor a README checklist entry, when Leaflet is imported outside `ParkMap`, when a database or auth dependency appears, when `geolocation` is used in source, or when `ParkExplorer.tsx` loses `ssr: false` on its `dynamic` ParkMap import or statically imports `@/components/ParkMap`.

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
  **Expected LOC impact:** production +0; tests +105–150; docs/config +0; confidence: medium; basis: SDD §10 and the AC list; no repo analogue
  **Required checks:** red: `npm test -- src/traceability.test.ts src/repo-structure.test.ts` (exit 1); green: same, `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`
  **Policy evidence:** N/A — test-only. This phase is the CI-style traceability gate named in Part 1 (Testing Strategy), run locally with `npm test`.
  **Objective-evidence mapping:** AC-015(d) → structure and dependency checks → TEST-052 → Vitest report → RESULT-*; AC-007 → static code search → TEST-053; DES-023 → traceability → TEST-054; Leaflet boundary → TEST-055.
  **Test derivation:**

  | TEST ID | AC ID | Test level | Level role | Precondition / controlled data | Trigger | Positive oracle | Negative oracle | Boundary or failure |
  |---|---|---|---|---|---|---|---|---|
  | TEST-052 | AC-015 | integration | Secondary — static structure (`ParkList`, `ParkDetails`, `ParkMap` under `src/components`; OSM attribution; no database/auth dependency) is a distinct risk from runtime behavior | Repo files and `package.json` | Read and inspect | The three component files exist; `ParkMap.tsx` contains the OpenStreetMap attribution; no `prisma`, `mongoose`, `pg`, `mysql`, `sqlite`, `next-auth`, or similar in dependencies | Synthetic package list with `prisma` is flagged | Constraint drift (CON-003, CON-005) |
  | TEST-053 | AC-007 | integration | Secondary — static code search complements the runtime spy | Non-test files under `src/` | Search for `geolocation` | No occurrences | Synthetic source with `navigator.geolocation` is flagged | Hidden location use |
  | TEST-054 | n/a (DES-023 traceability gate) | integration | Secondary — protects the evidence chain | Requirements AC ids; test titles; README checklist | Compare sets | Every `AC-001`…`AC-015` appears in a test title or the README checklist | Synthetic `AC-999` reported uncovered | Lost coverage |
  | TEST-055 | n/a (DES-019/SDD §10 boundary; supports AC-014) | integration | Secondary — SSR safety depends on Leaflet staying inside `ParkMap` | Imports across `src/` | Scan import lines | `leaflet` and `react-leaflet` imported only in `src/components/ParkMap.tsx` (and its tests); `ParkExplorer.tsx` passes `ssr: false` to `dynamic` and has no static import of `@/components/ParkMap` (plan revision approved by the user 2026-10-02 after Phase 15 finding 4) | Synthetic import in `lib/`, synthetic `dynamic` without `ssr: false`, and synthetic static ParkMap import are each flagged | Server-render break |

  **Completion evidence:** per Phase evidence template (Part 1).

**Expected authored LOC:** tests +105–150
**Success criteria:** 4 tests green; the full suite passes.
**Commit message:** `test: add traceability and structure guards`
**Git:** plan worktree.

## Checkpoints

### Checkpoints for Phases 11–13
Covered by Part 1: Phase 12 in Checkpoint 2 (Wave 1) and Phases 11 and 13 in Checkpoint 3 (Wave 2). The `npm run build` check that proves the `/api/parks` route compiles is part of the Wave 1 verification (RESULT-150 to 159).

### Checkpoint 4: After Phases 14–15
- [x] `npm test` passes (RESULT-243: 15 files, 240 tests)
- [x] End-to-end flow works for the core feature in tests: load, select by list and marker, focus handoff, failure paths (TEST-032 to TEST-041, TEST-056)
- [x] R-003 and R-004 outcomes recorded
- [x] Review with human before proceeding
- [x] Record an Approved checkpoint gate (Checkpoint 4) before Phase 16

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
| Safe to parallelize | TASK-012 in Wave 1 (with Part 1's TASK-006, 007, 008, 009); TASK-011 and TASK-013 in Wave 2 (with Part 1's TASK-010) | Within a wave: no dependency path and no shared allowed changes |
| Must be sequential | TASK-014 → TASK-015 → TASK-016 → TASK-017 → TASK-018 | Each produces required input for the next; TASK-014 and TASK-015 both edit `ParkExplorer.tsx` |
| Needs coordination | Shared evidence files, RESULT-ID ranges, merge order | See Part 1, Parallel execution protocol |

## TODO List (ordered)
- [x] Phase 11: Park details panel (Wave 2)
- [x] Phase 12: `GET /api/parks` route (Wave 1)
- [x] Phase 13: `ExplorerLayout` (Wave 2)
- [x] Phase 14: `ParkExplorer` data states
- [x] Phase 15: Map wiring and focus handoff
- [x] Phase 16: App shell: page, metadata, light theme
- [x] Phase 17: README and manual verification checklist
- [ ] Phase 18: Traceability and structure guard tests
