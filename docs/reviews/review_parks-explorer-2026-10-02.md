# Code Review: parks-explorer
_Date: 2026-10-02_
_Reviewed revision: `ddb038a` (`main`), range `f973553..HEAD` (43 non-doc files, +4,503/−101 lines)_
_Mode: read-only (`cg-review`)_

## Automated Checks
| Check | Command | Result |
|---|---|---|
| Tests | `npm test` | Pass: 19 files, 277 tests |
| Build | `npm run build` | Pass |
| Types | `npx tsc --noEmit` | Pass |
| Dependency audit | `npm audit` | Pass: 0 vulnerabilities |
| Lint | `npx eslint src` | Pass |
| Lint | `npm run lint` | **Fail** (see Major 1) |

## Findings

### Blockers
None.

### Major
- [ ] `eslint.config.mjs:10-15`
  - Issue: `globalIgnores` doesn't cover `.worktree/**`.
  - Impact: in the main checkout `npm run lint` reports 29,792 problems (1,421 errors), all inside the eight worker worktrees. The cg workflow requires in-repo worktrees, so the AGENTS.md lint command fails whenever one exists.
  - Fix: add `".worktree/**"` to `globalIgnores` (one line, outside any plan phase; needs owner OK).
- [ ] `README.md` Verification table (TEST-044 to 051) — manual evidence not yet produced
  - Issue: the Primary checks for AC-002, AC-006, AC-013 and AC-014 are manual and still "pending owner run". Those four ACs have no pass evidence, and AC-002's "every marker inside the initial view" has no automated check.
  - Impact: the Final Checkpoint cannot honestly close.
  - Fix: run the checklist and record Result and Date.

### Minor
- [ ] `docs/traceability/index.md:38` — manual TEST-045 to 050 appear only as the range "TEST-044 to TEST-051", not individually. List them one by one.
- [ ] `.gitignore` — `.worktree/` is ignored only in the local `.git/info/exclude`, so a fresh clone shows worktrees as untracked.
- [ ] `src/contexts/ParksContext.tsx:53-56` — if a selected id is missing after a reload, `selectedParkId` stays set but the details show the prompt and nothing is highlighted (the open "should retry clear the selection?" question). Not reachable with the static dataset.
- [ ] `src/lib/parks.ts:37-41` — `http:` image URLs are accepted; over HTTPS they are blocked as mixed content. Consider https-only before a public deploy.
- [ ] `src/components/ParkDetails.tsx:52-56` — the "Amenities" `h3` and the list's `aria-label="Amenities"` repeat the same name for screen readers.
- [ ] `src/components/ParkMap.tsx:73` — `event as LeafletKeyboardEvent` is an unchecked cast (Leaflet's handler types don't narrow `keydown`).
- [ ] `vitest.config.ts` — Vite ESM warning on every `npm test` (rename to `.mts` or set `"type": "module"`).
- [ ] `AGENTS.md` — "Integration tests" and "Types" still say N/A; the ">3 files" planning rule conflicts with the plan's up-to-4-file phases.
- [ ] `src/components/ParkExplorer.test.tsx:21` — the `next/dynamic` stub means real chunk loading and the loading placeholder are untested; the TEST-055 text guard and manual TEST-047 cover this.

## What's Done Well
- `normalizeParks` (`src/lib/parks.ts`) is a strict untrusted-data boundary: bad coordinates, duplicate ids, non-http URLs and non-array bodies are handled and it never throws.
- Markers are built from DOM nodes with `textContent`, so park names cannot inject markup (`src/components/ParkMap.tsx:36-50`).
- `useFocusOnSelect` ignores a request already present at mount, so load changes neither focus nor scroll; `useParksFetch` cancels superseded requests with an abort signal.
- All 180 test titles carry a `TEST-*` ID; all CHG-001 to 031 are in the index; every RESULT cited in the index exists in the plan with no duplicate definitions; every phase has a recorded mutation check.

## Verification Summary
- Acceptance criteria met: **Partial.** AC-001, 003, 004, 007, 008, 009, 010, 011, 012, 015 verified in tests. AC-002, 005 (focus ring), 006, 013 (contrast) and 014 depend on the unrun manual rows.
- Security vulnerabilities introduced: None. Residual: the http-image Minor and the public-deploy caveats already in the README (no CSP, third-party OSM tiles).
- Architecture consistent with design spec: Yes (Leaflet confined to `ParkMap.tsx` by a test; folder structure followed).
- Test coverage adequate: Yes for automated levels; gaps are the manual rows and the stubbed `next/dynamic`.
- Performance issues found: None.
- Downstream breakage: None (grep and `tsc` clean).
- Traceability complete: Mostly; gap: manual TEST-045 to 050 not listed individually.
- AGENTS.md checklist: Pass for enforceable rules; stale lines listed in Minors.
- New runtime dependencies: `leaflet` and `react-leaflet` have recorded justification and the owner's licence decision (R-001); dev-only `vitest-axe` has its MPL-2.0 `axe-core` note in the plan.
- Objective evidence: Sufficient for the automated ACs (RESULT-001 to 273); Insufficient for AC-002, 006, 013, 014 until the manual rows are run.
- Test derivation: Complete.
- Review record: `ddb038a`, 2026-10-02, commands above plus a script check of the index against the plan and test files. Reviewer: Claude (read-only).

## Verdict
- [x] Approved with follow-ups — no blockers; Major 1 and 2 logged

## Human Review Gate
- Status: **Pending**
- Reviewed revision: `ddb038a`
- Blocking findings: none
- Required follow-ups: add `.worktree/**` to the ESLint ignores; run the manual checklist and record results
- Evidence: this report
- Reviewer / at: pending

## Durable lessons for a future `AGENTS.md` update
- When worktrees live inside the repo, add their folder to both `.gitignore` and the ESLint `globalIgnores`.
- Pair text-pattern guard tests with a manual production check for the behaviour they stand for.

## Next Step
Fix Major 1 and the small Minors, run the manual checklist, record the human gate, then run `cg-memory`.
