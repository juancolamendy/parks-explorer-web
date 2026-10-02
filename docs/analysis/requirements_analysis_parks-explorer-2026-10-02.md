# Requirements Analysis: parks-explorer
_Date: 2026-10-02_

Source revision: `docs/requirement/requirements.md` sha256 prefix `9de8b75c23bc` (adds AC-011 to AC-015 and tags AC-004 with REQ-F-013; supersedes `475ddcc18039`).
Stack facts (from `package.json`): Next.js 16.3.8 (App Router), React 19.2.8, Tailwind CSS v4, TypeScript 5, ESLint 9. No test runner, no `react-leaflet`/`leaflet` installed yet.

## Functional Requirements
(IDs preserved from source; summarised)

- REQ-F-001 (US-001): List every usable park (non-empty string `id` and `name`; first occurrence wins on duplicate `id`) with a keyboard-operable select control; list works without the map.
- REQ-F-002 (US-002): Details for selected park: name, address, description, amenities, hours, images, other supplied fields.
- REQ-F-003 (US-002): Null/missing fields, empty arrays, failed images handled without crash or fabrication.
- REQ-F-004 (US-003): One marker per park with valid coordinates; initial view shows all plotted parks.
- REQ-F-005 (US-003): No marker for invalid/missing coordinates; park still listed and selectable.
- REQ-F-006 (US-003): Marker activation reaches details (per Q-005: sets selected ID, no popup).
- REQ-F-007 (US-001/002/003): Single selected-park ID drives list highlight, map selection, details. Initially unselected with neutral prompt (Q-007); selection moves focus to details heading and scrolls it into view (Q-006).
- REQ-F-008 (US-007): `GET /api/parks` returns `src/data/parks.sample.json` as JSON; no DB/CRUD/auth/filtering.
- REQ-F-009 (US-007): UI shows an error and a retry path when the park request fails.
- REQ-F-010 (US-006): Never request geolocation.
- REQ-F-011 (US-008): README with install/run, what works, decisions, omissions, known issues, verification, pre-public next steps (incl. tile-provider plan).
- REQ-F-012 (US-002): Display rules: verbatim `hours`/`address`; formatted amenity slugs; "{n} acres"; "Rating: {n}" / "Rating not provided"; alt text from supplied facts only; unknown extra fields tolerated.
- REQ-F-013 (US-002/007): Visible fallback for every failed image (all sample image URLs use placeholder host `images.example.com`).

## Non-functional Requirements

- REQ-NF-001 (US-005): Stacked at phone width, side-by-side on desktop; 375px stacked, 1280px side-by-side (AC-006). Breakpoint is a design decision.
- REQ-NF-002 (US-004): Readable text, clear labels, visible focus, keyboard list-to-details navigation; map never the only route.
- REQ-NF-003 (US-007): Tile failure must not impair list/details.
- REQ-NF-004: Map renders client-side only.
- REQ-NF-005: Map container has explicit Tailwind height.

Constraints carried over: CON-001 to CON-005. Risks carried over: RISK-001 to RISK-005. Actors: ACT-001 to ACT-003. Objectives: OBJ-001 to OBJ-005. Acceptance criteria: AC-001 to AC-015.

## Architectural Implications

Doc-verified facts used below (Context7, current docs):
- React Leaflet is not compatible with SSR because Leaflet touches the DOM on load; `MapContainer` props (center, zoom, bounds) are immutable after first render, so later changes need a `key` or a child that calls the Leaflet map API.
- In Next.js 16 App Router, `next/dynamic` with `ssr: false` is only valid inside a Client Component (`'use client'`); it cannot be used from a Server Component.
- A `GET` Route Handler can return `Response.json(...)` / `NextResponse.json(...)`, and JSON can be imported directly.
- A map container needs a defined height or nothing renders.

| Requirement ID | Type | Implication |
|---|---|---|
| REQ-F-001, REQ-F-007, AC-001 | Functional | Client "explorer" container (`'use client'`) owns `parks`, `selectedParkId` (`string \| null`), and fetch state; passes `selectedParkId` and `onSelect` to `ParkList`, `ParkMap`, `ParkDetails`. Selection is state in one place only; no duplicated per-component selection. Selected park resolved by `id` lookup, so a stale ID simply yields the "nothing selected" view. |
| REQ-F-001, AC-001 (usable filter) | Functional | A pure `normalizeParks(raw: unknown)` function: validates array, drops records without non-empty string `id`/`name`, de-duplicates by `id` (first wins), and tolerates unknown shapes (ASM-003). Typed `Park` has optional/nullable fields to model sample variability. Pure function → cheap unit tests. |
| REQ-F-004/005, AC-002/003 (valid coords) | Functional | A pure `hasValidCoordinates(park)` / `getMarkerParks(parks)` helper: `Number.isFinite` on lat/lng, lat in [-90, 90], lng in [-180, 180]; 0 valid. Marker list derived from the same normalized list, so list and map cannot disagree on membership. |
| REQ-F-004, AC-002 (initial view) | Functional | Fit-to-bounds over marker parks; handle 0 markers (fallback default center/zoom, no crash) and 1 marker (fixed zoom, not zero-area bounds). Because `MapContainer` bounds/center are immutable, either render the map only after data is loaded (initial `bounds` is then correct) or use a child component that calls `map.fitBounds`. Decision for design. |
| REQ-F-006, REQ-F-007, AC-002 (marker select) | Functional | Marker `eventHandlers.click` → `onSelect(id)`. Selected marker visually distinguished (distinct icon or class), driven by `selectedParkId`. No popup. Marker accessible name and keyboard activation must be verified against Leaflet defaults. |
| Marker icons | Functional (technical risk) | Leaflet's default marker icon paths break under bundlers; design must choose a fix (explicit icon asset imports, or a `divIcon` styled with Tailwind). A `divIcon` also gives the selected-state styling for free. Not requiring a new dependency. |
| REQ-NF-004, RISK-003, CON-002 | NFR | `ParkMap` is a Client Component loaded via `next/dynamic(..., { ssr: false })` from a Client Component (the explorer). Leaflet CSS imported once on the client. Add `react-leaflet` and `leaflet` (+ `@types/leaflet`); confirm the installed `react-leaflet` major supports React 19 at install time (AGENTS.md: new runtime dependencies need plan justification and review approval). |
| REQ-NF-005 | NFR | `ParkMap` wrapper with Tailwind height classes (e.g. fixed height on phone, taller on desktop) and `w-full`; `MapContainer` receives `className="h-full w-full"` inside it. A loading placeholder of the same height avoids layout shift while the dynamic chunk loads. |
| REQ-NF-003, AC-008 | NFR | Tiles are a progressive enhancement. `TileLayer` failures are isolated to the map; list/details do not depend on map readiness. Optional `tileerror` handler to show a non-blocking notice ("Map tiles could not be loaded"). Selecting via marker still works since markers are not tile-dependent. |
| CON-002, RISK-002, REQ-F-011 | Constraint | OSM standard tile URL with required attribution; README states public deployment needs a reviewed tile provider and usage plan. No API key or env var. |
| REQ-F-008, AC-009 | Functional | Route Handler `src/app/api/parks/route.ts`: `GET` imports `src/data/parks.sample.json` and returns `Response.json(data)`. No filtering/validation at the API (it must deep-equal the file); validation happens client-side in `normalizeParks`. Static import means no file-system access at runtime and no user input path (no path traversal surface). |
| REQ-F-009, AC-009 | Functional | Client `fetch('/api/parks')` with explicit states: loading, error, ready. Treat non-2xx and network errors and invalid JSON as error. Error view has message and a Retry button that re-runs the fetch. Empty-after-normalization result gets a distinct "no parks available" message rather than a blank screen. Fetching on the client (rather than reading the JSON in a Server Component) is what makes the failure/retry path meaningful and testable. |
| REQ-F-010, AC-007 | Functional | Nothing calls `navigator.geolocation`; map `locate` option and Leaflet `map.locate()` unused. Enforced by test spy and a code-search check. |
| REQ-F-002/003/012/013, AC-004 | Functional | `ParkDetails` renders from a small set of presentational helpers: `formatAmenity(slug)` (hyphens → spaces, capitalise), "{n} acres", "Rating: {n}" / "Rating not provided", conditional sections for null/empty/absent fields. Image component with `onError` → fallback block; per-image state. Use a plain `<img>` rather than `next/image` because remote hosts would need `remotePatterns` config and the sample host is a non-resolving placeholder; alt text uses park name (e.g. "Photo 1 of Prospect Park" is built from supplied name only). |
| Image URLs (security) | Security | `images[]` come from data, not users, but treat as untrusted: render only `http:`/`https:` URLs, ignore other schemes; set `referrerPolicy="no-referrer"` and `loading="lazy"`. Descriptions/names rendered as text by React (no `dangerouslySetInnerHTML`). No auth, secrets, PII, or cookies in scope; no security owner gate required. |
| REQ-F-007, REQ-NF-002, AC-005 | NFR | List items are real `<button>` elements (native Tab, Enter/Space), inside a `<ul>`/`<li>`; selected item uses `aria-current="true"` (or `aria-pressed`) plus a visual highlight. Details container is a labelled region with a heading `tabindex="-1"`; after selection a `ref` focuses the heading and calls `scrollIntoView`. Must not run on initial load (Q-007) — trigger from the select handler/effect keyed on selection changes only, not on mount. Visible focus via Tailwind `focus-visible:` ring utilities on all controls; contrast must meet WCAG AA. Respect `prefers-reduced-motion` for scrolling. |
| REQ-NF-001, AC-006 | NFR | Tailwind responsive layout: single column (list, map, details order to be fixed in design) below breakpoint; two-column at/above it. `min-w-0`/`break-words` and overflow handling so long names/amenity lists do not cause horizontal scroll. Verification at 375px and 1280px viewports. |
| REQ-NF-001, AC-006 (stacked order) | NFR | In the stacked layout, details sit below list and map; selection scrolls to details (Q-006), which is why scroll-into-view is required behavior rather than polish. Whether the list or the map comes first on phone is a design decision. |
| Data boundary, RISK-001, RISK-004 | Data | Sample contains no invalid-coordinate, missing-name, or duplicate-id records. Tests build fixtures in code by cloning sample records and mutating the copies; `parks.sample.json` is never edited. Image failure is exercised by the sample itself (placeholder host) and by tests that fire `error` on `<img>`. |
| Persistence / DB | Data | None. Data is a static JSON import served by the Route Handler. No migration, indexing, or caching layer. Next.js default behavior is sufficient for a static response. |
| Rate limiting / retry | Resilience | No server-side rate limiting (read-only static data, local assessment). Client retry is user-initiated only (REQ-F-009); no automatic retry loop. |
| Logging / observability | Operations | No logging infrastructure. Client errors surface in UI state; `console.error` only in the fetch failure path is acceptable. Out of scope: analytics, tracing. |
| Testing approach | Quality | See breakdown below. |
| REQ-F-011, AC-010 | Documentation | `README.md` replaces the create-next-app default: install/run, what works, decisions, omissions, known issues, verification (exact commands and results), next steps before public use (tile provider, image hosting, a11y audit, data source, test coverage). |

### Testing approach (applicability by level)

| Level | Applicable? | Why / covers |
|---|---|---|
| Unit | Yes | `normalizeParks`, `hasValidCoordinates`/marker derivation, `formatAmenity`, display-string helpers (AC-001 filter, AC-003, AC-004, REQ-F-012). Pure functions, no DOM. |
| Component | Yes | `ParkList` (AC-001, AC-005 keyboard activation), `ParkDetails` (AC-004 sparse and image-failure), explorer container (shared selection, error/retry for AC-009 UI). Map mocked at the component boundary. |
| Integration / API | Yes | Route Handler returns 200, JSON content type, deep-equal to file (AC-009). Can call the handler function directly. |
| End-to-end (browser) | Yes, selective | Needed for what jsdom cannot show: real Leaflet markers and initial bounds (AC-002), focus visibility and `document.activeElement` (AC-005), 375px/1280px layout and no horizontal scroll (AC-006), blocked tile requests (AC-008), no geolocation call (AC-007). |
| Contract | Light | Only the API-to-client `Park[]` shape; covered by the unit and API tests; no external consumers. |
| Security | Minimal | URL-scheme filtering for images and no raw HTML; covered by unit test and review. No auth surface. |
| Performance | No | 12 records, static data; no SLA in requirements. |
| Resilience | Yes | API failure, tile failure, image failure, empty dataset — covered via component and E2E tests above. |
| Accessibility | Yes | Automated axe-style check plus a recorded manual keyboard walkthrough (AC-005 evidence). |

Test tooling is not installed. Choice of runner and browser-test tool is a design decision (see Open Questions) and a new dev-dependency approval item per AGENTS.md.

### Requirement-to-implication coverage check
Every REQ-F-001…013, REQ-NF-001…005, and CON-001…005 is mapped above or in the test table. OBJ-001…005 are covered through the AC mapping (OBJ-004 → AC-004/005 as stated in source). AC-010 is covered by the documentation row.

### Requirement-to-acceptance-criteria traceability
| Requirement | Acceptance criteria |
|---|---|
| REQ-F-001 | AC-001, AC-008, AC-015(a, c) |
| REQ-F-002 | AC-011 |
| REQ-F-003 | AC-004 |
| REQ-F-004 | AC-002, AC-015(b) |
| REQ-F-005 | AC-003, AC-015(b) |
| REQ-F-006 | AC-002, AC-012 |
| REQ-F-007 | AC-001, AC-005, AC-012 |
| REQ-F-008 | AC-009 |
| REQ-F-009 | AC-009, AC-015(a) |
| REQ-F-010 | AC-007 |
| REQ-F-011 | AC-010 |
| REQ-F-012 | AC-011 |
| REQ-F-013 | AC-004 |
| REQ-NF-001 | AC-006, AC-014 |
| REQ-NF-002 | AC-005, AC-013 |
| REQ-NF-003 | AC-008 |
| REQ-NF-004 | AC-014 |
| REQ-NF-005 | AC-014 |
| CON-001 | AC-014 (build), AC-015(d) |
| CON-002 | AC-015(d) (attribution), AC-008 |
| CON-003 | AC-015(d) |
| CON-004 | AC-009 (API body equals the file) |
| CON-005 | AC-015(d) |

Every requirement now has at least one acceptance criterion. Implementation implications of the new criteria: AC-012 and AC-013 require E2E/browser and automated accessibility tooling (D-01 grows to include an accessibility scanner); AC-014 adds a production-build gate; AC-015(b) confirms the 0-marker and 1-marker fallbacks in D-03 are required, not optional; AC-015(d) is a repository/dependency review item, not a runtime test.

## Open Questions
None block requirements or analysis. Items deferred to `cg-design` (architecture-level choices not fixed by the requirements):

- D-01: Test tooling: unit/component runner, browser E2E tool, and an automated accessibility scanner (needed by AC-013), including dev-dependency approval. Requirements mandate evidence but not the tool.
- D-02: Marker icon strategy (explicit asset imports vs Tailwind-styled `divIcon`) and how the selected state is rendered.
- D-03: Initial bounds strategy given immutable `MapContainer` props (render after data load vs `fitBounds` child), including 0-marker and 1-marker fallbacks.
- D-04: Responsive breakpoint and stacked-order of list, map, details on phone.
- D-05: Whether to show a non-blocking tile-failure notice (`tileerror`) or stay silent; both satisfy AC-008.
- D-06: Confirm the `react-leaflet` major version compatible with React 19.2 at install time.

## Human Quality Gate
- Status: Pending
- Required reviewers: Product owner; technical owner. Security owner not required (no auth, PII, secrets, trust-boundary, or privileged-access concern; untrusted-URL handling is low risk and covered above).
- Artifact revision: requirements.md sha256 `9de8b75c23bc`
- Decision and conditions: Re-approval needed. The earlier revision (`475ddcc18039`) was reviewed and approved by the user in conversation ("I reviewed and everything looks good"). The traceability review then added AC-011 to AC-015, which is a material edit, so the gate was reset to Pending.
- Evidence: Prior approval was a conversation response; no PR or ticket. Pending confirmation for `9de8b75c23bc`.
- Approved by / at: — (prior revision approved by the user, 2026-10-02)

## References
- Input: docs/requirement/requirements.md
- Input: docs/requirement/product_specification.md (not present)
- Input: AGENTS.md
- Docs consulted: React Leaflet (SSR limitation, immutable MapContainer props, height requirement, TileLayer events), Next.js 16.2.x (`next/dynamic` `ssr: false` in Client Components; Route Handler `GET` returning JSON)
