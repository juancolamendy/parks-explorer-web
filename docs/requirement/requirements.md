# Requirements: Parks Explorer

Status: COMPLETE — all open questions resolved (Q-001 to Q-007). Ready for `/cg-design` or `/cg-analysis`.
Source: pasted conversation text (cg-interview-inline, `new`).

## Problem and Expected Outcome

**Current condition:** Residents have a supplied set of park records (`src/data/parks.sample.json`) but no way to browse them, read their details, or see where they are.
**Affected stakeholders:** Residents (phone and desktop, keyboard and pointer users, with or without location permission); the assessor reviewing the local build.
**Impact / opportunity:** A resident can find a park from a list or a map and read what the dataset says about it, without being asked for their location and without being shown invented facts.

**Expected outcome:** A resident opens the app, sees every usable park in a list and every park with valid coordinates on a map, selects one by either route, and reads its details. The experience works on phone and desktop, by keyboard, and degrades gracefully when data is sparse, images fail, tiles fail, or the API fails.

## Objectives and Success Metrics

- OBJ-001: A resident can find and select any usable park without using the map. Metric: 100% of usable parks selectable from the list.
- OBJ-002: A resident can see where parks are. Metric: 100% of parks with valid coordinates have exactly one marker; 0 markers for invalid coordinates.
- OBJ-003: Details never present facts absent from the dataset. Metric: 0 fabricated values across sparse-data fixtures.
- OBJ-004: Core tasks are usable on phone and desktop by keyboard. Metric: all acceptance criteria AC-004, AC-005 pass.
- OBJ-005: Reviewer can install, run, and understand limits from the README.

## Scope

**In scope:** park list; park details; park map; single shared selection; `GET /api/parks`; responsive stacked/side-by-side layout; keyboard accessibility; README.
**Out of scope:** search, filters, ratings-based sorting, geolocation, database, CRUD, authentication, server-side filtering.

## Actors

- ACT-001: Resident (pointer user, phone or desktop).
- ACT-002: Keyboard-only resident.
- ACT-003: Assessor / reviewer running the app locally.

## User Stories

- US-001: As a resident, I want to browse a list of parks and select one, so that I can find a park without the map.
- US-002: As a resident, I want to read a selected park's details, so that I know what it offers, and trust that nothing is invented.
- US-003: As a resident, I want to see parks on a map and select a marker, so that I know where parks are.
- US-004: As a keyboard user, I want to Tab to a park and open its details with Enter/Space, with visible focus, so that I do not need a pointer.
- US-005: As a resident on a phone or desktop, I want a layout suited to my screen, so that nothing is clipped or unusable.
- US-006: As a resident, I want parks shown without being asked for my location, so that my privacy is respected.
- US-007: As a resident, I want the app to stay usable when the API, images, or map tiles fail, so that I am never left with an unexplained empty screen.
- US-008: As an assessor, I want a README, so that I can install, run, and evaluate the work.

## Functional Requirements

- REQ-F-001 (US-001): Display every usable park record (non-empty string `id` and `name`, per Q-002) in a list, each with a clear name and a keyboard-operable control to select it. The list functions with the map absent or failed.
- REQ-F-002 (US-002): Show details for the selected park: name, address, description, amenities, hours, images, and other useful supplied fields.
- REQ-F-003 (US-002): Missing/null fields, empty arrays, and failed images are handled without crashing; absent facts are omitted or shown as explicitly not provided, never fabricated. Sample cases: `description: null`, absent `location.address`, `images: []`, `rating: null`.
- REQ-F-012 (US-002): Field display rules: `hours` and `address` are shown verbatim; amenity slugs are shown as readable labels derived only by string formatting; `acreage` is shown as "{n} acres"; `rating` is shown as "Rating: {n}" with no scale or review count, or "Rating not provided" when null/missing (Q-004); images use alt text built only from supplied facts; unknown extra fields do not break rendering.
- REQ-F-013 (US-002/007): Every image has a visible, non-broken fallback on load error, because all sample image URLs point to the placeholder host `images.example.com`.
- REQ-F-004 (US-003): Render one marker per park with valid coordinates. Initial map view makes all plotted parks visible.
- REQ-F-005 (US-003): A park without valid coordinates appears in the list and details but has no marker.
- REQ-F-006 (US-003): Activating a marker shows that park's details or clearly links to them.
- REQ-F-007 (US-001/002/003): A single selected-park ID drives list highlight, map selection state, and the details panel. Initially no park is selected: the details region shows a neutral prompt, nothing is highlighted, and focus/scroll are untouched (Q-007). Selecting a park by list or marker moves focus to the details heading and scrolls it into view (Q-006). Marker activation only sets the ID; there is no popup (Q-005).
- REQ-F-008 (US-007): `GET /api/parks` reads `src/data/parks.sample.json` and returns it as JSON. No database, CRUD, auth, or filtering.
- REQ-F-009 (US-007): If the park request fails, the UI shows a useful error and a retry path.
- REQ-F-010 (US-006): The app never requests geolocation permission.
- REQ-F-011 (US-008): README.md covers install/run, what works, decisions, omissions, known issues, verification, and next steps before public use (including a reviewed tile-provider and usage plan).

## Non-functional Requirements

- REQ-NF-001 (US-005): Stacked layout on phone-width viewports; side-by-side on desktop. The exact breakpoint is a design decision, constrained by AC-006: a 375px viewport is stacked and a 1280px viewport is side-by-side.
- REQ-NF-002 (US-004): Readable text, clear labels, visible keyboard focus indicator on all interactive controls, keyboard list-to-details navigation. Map interaction is never the only route to details.
- REQ-NF-003 (US-007): Map tile load failure must not impair list or details.
- REQ-NF-004: Map components render client-side only.
- REQ-NF-005: Map container has an explicit height set via Tailwind CSS.

## Assumptions and Constraints

**Constraints (fixed):**
- CON-001: Next.js, React, Tailwind CSS.
- CON-002: Leaflet + React Leaflet; OpenStreetMap standard tiles (no API key) for this local assessment.
- CON-003: Separate `ParkList`, `ParkDetails`, `ParkMap` components under `src/components`.
- CON-004: Data comes from `src/data/parks.sample.json`; build around its supplied shape.
- CON-005: No database, CRUD, auth, or filtering.

**Assumptions (revisable):**
- ASM-001: `src/data/parks.sample.json` is the complete dataset for this assessment; its shape is documented under Data Contract and was profiled from the file (12 records).
- ASM-002: "Usable record" = non-empty string `id` and `name` (Q-002). "Valid coordinates" = finite numeric lat in [-90, 90] and lng in [-180, 180] (Q-003).
- ASM-003: The app must tolerate shapes the sample does not exhibit (missing `name`, missing/invalid `location`, non-array `amenities`/`images`), because the brief requires handling missing/null fields and invalid coordinates.
- ASM-004: `acreage` is in acres (field name and the description text "526-acre" agree). `rating` has no stated scale or review count.

## Data Contract

Profiled from `src/data/parks.sample.json` (12 records, top-level JSON array, not wrapped in an object). `GET /api/parks` returns this array as-is.

### Record shape

| Field | Type observed | Present | Null / empty in sample | Notes |
|---|---|---|---|---|
| `id` | string | 12/12 | none | Unique, kebab-case slug (`prospect-park`). Natural key for the selected-park ID and DOM ids. |
| `name` | string | 12/12 | none | Unique. List label and details heading. |
| `description` | string or `null` | 12/12 | 1 null (`old-mill-botanical-garden`) | Plain text, 80–168 chars, no markup. |
| `location` | object | 12/12 | none | See below. |
| `location.lat` | number | 12/12 | none | Range 40.5795–40.8501; max 4 decimals. |
| `location.lng` | number | 12/12 | none | Range -74.0899 – -73.7949; max 4 decimals. |
| `location.address` | string | 11/12 | key absent for 1 (`highland-dog-park`) | Free text, inconsistent granularity (below). |
| `amenities` | array of string | 12/12 | none empty | 26 distinct lowercase kebab-case slugs, 3–7 per park, no duplicates within a park. |
| `hours` | string | 12/12 | none | Free text, not structured (below). |
| `images` | array of string (URL) | 12/12 | 2 empty (`cedar-hill-nature-preserve`, `east-ridge-trailhead`) | 1–2 URLs when present; all on host `images.example.com`. |
| `acreage` | number (integer) | 12/12 | none | 2–640. |
| `rating` | number or `null` | 12/12 | 1 null (`cedar-hill-nature-preserve`) | 3.9–4.9 observed; scale and review count not supplied. |

No other fields exist: no phone, website, park type, image alt text/captions, or timezone.

### Observed variability that drives behavior

- **Address granularity varies:** full (`Riverside Dr, New York, NY 10024`), city-level only (`Brooklyn, NY 11225`), street only (`Ridge Rd`, `12 Old Mill Ln`), intersection (`44th St & 7th Ave`), or absent. Display as supplied; never append a city/state.
- **Hours are free text:** `6:00 AM - 1:00 AM` (crosses midnight), `Dawn to dusk`, `24 hours`, and ranges. Display verbatim; do not parse or show "open now".
- **Amenities are slugs, not labels:** e.g. `dog-run`, `wifi`, `kayak-launch`. A readable label may be derived by formatting the slug (replace hyphens, capitalise) without adding meaning; unknown slugs must still render.
- **Image URLs use `images.example.com`,** a reserved placeholder domain that will not resolve to real images. In this sample the failed-image path is the normal path for every park that has images (10 of 12), so the fallback is exercised on every load and must look intentional.
- **Image alt text is not supplied.** Alt text may only use supplied facts (e.g. the park name); it must not describe image content.
- **Rating** is present for 11/12 but ratings-based sorting is out of scope. Whether to display it, and with what scale wording, is pending (Q-004). A "/5" suffix would assert a scale the dataset does not state.
- **All 12 sample records have valid coordinates,** all within a small area (NYC). The "no coordinates" and "sparse" behaviors therefore cannot be demonstrated with the sample alone and require test fixtures derived from it (not edits to it).
- **Plausibility, not validated by the app:** `cedar-hill-nature-preserve` has coordinates (40.7128, -74.0060) that equal commonly cited lower-Manhattan city-centre coordinates while described as protected woodland. The app displays supplied values and does not correct or second-guess them.
- Ordering: the array order is the only order supplied; no sort field exists.

## Edge Cases and Failure Modes

- Missing/null text; empty `amenities`/`images`; failed image load.
- Missing, null, non-numeric, or out-of-range coordinates.
- Zero or one plotted park (initial view must still be sensible).
- Tile load failure; API failure; empty dataset.
- Geolocation permission unavailable/denied (must be irrelevant).
- Duplicate or missing park IDs (pending Q-002). Sample IDs are unique.
- Sample-specific: null description, absent address, empty images (2 parks), null rating, placeholder image host.
- Shapes absent from the sample but required by the brief: missing/null `location`, non-numeric or out-of-range `lat`/`lng`, missing `name`.
- Very short or long text, long amenity lists, and very long park names must not clip at phone width.

## Risks

- RISK-001: The sample exhibits no invalid-coordinate records, so no-marker behavior is untested by the sample; mitigated by fixtures.
- RISK-004: All sample images use a placeholder host and will always fail to load, so image UI may look broken unless the fallback is designed deliberately.
- RISK-005: Displaying `rating` without a stated scale or review count could imply facts the dataset does not provide.
- RISK-002: OSM public tile usage policy is unsuitable for public deployment; README must say so.
- RISK-003: Leaflet requires browser APIs; SSR render would crash (mitigated by REQ-NF-004).

## Open Questions

- [Q-001] Status: Resolved
  - Question: `src/data/parks.sample.json` is referenced but does not exist in the repo. How should requirements treat the data shape?
  - Option 1: Wait for the file; keep requirements field-agnostic and pin "usable"/"valid" rules once it arrives — Recommended: the brief says "build around the supplied json" and "do not invent values", so inventing a fixture would violate both.
  - Option 2: Author a clearly labelled placeholder fixture now so work can start — unblocks work but risks the real shape differing and rework.
  - Option 3: Define the expected schema in these requirements and require the supplied file to conform — fixes the contract early but contradicts "build around the supplied json".
  - Answer: Option 1 in effect — the user supplied the file at `src/data/parks.sample.json` and asked for its structure to be analysed and documented. See Data Contract.
  - Affects: REQ-F-001, REQ-F-002, REQ-F-005, REQ-F-008, AC-001, AC-003, AC-004

- [Q-002] Status: Resolved
  - Question: What makes a park record "usable" (i.e. must appear in the list)? In the sample, all 12 records have `id`, `name`, and `location.lat/lng`.
  - Option 1: Usable = non-empty string `id` (unique) and non-empty string `name`; every other field is optional — Recommended: `id` is needed for the single selected-park ID and `name` is the list label; coordinates must not gate list membership (the brief says no-coordinate parks still appear).
  - Option 2: Usable = `id`, `name`, and a `location` object present — stricter; drops records that only lack a location, contradicting "a park with no valid coordinates can still appear in the list".
  - Option 3: Every record in the array is shown; missing `name` falls back to the `id` — never drops data, but displays a derived label the dataset does not supply.
  - Answer: Option 1 — usable = non-empty string `id` and non-empty string `name`; all other fields optional. Records failing this are excluded from the list; duplicate `id`s are treated as unusable after the first occurrence so the selected-park ID stays unambiguous.
  - Affects: REQ-F-001, AC-001, AC-003

- [Q-003] Status: Resolved
  - Question: What counts as "valid coordinates" for drawing a marker? All sample values are finite numbers within NYC.
  - Option 1: `location.lat` and `location.lng` are both finite JSON numbers with lat in [-90, 90] and lng in [-180, 180]; strings, null, NaN, and out-of-range values are invalid — Recommended: precise, testable, and does not reject legitimate values such as 0.
  - Option 2: Same as Option 1, and additionally treat (0, 0) as invalid — guards against a common "missing data" placeholder, but wrongly rejects a point that is technically valid and is not present in the dataset.
  - Option 3: Option 1, and also accept numeric strings like "40.66" by converting them — more forgiving, but silently reinterprets data that the supplied schema types as numbers.
  - Answer: Option 1 — valid = `location.lat` and `location.lng` both finite JSON numbers, lat in [-90, 90], lng in [-180, 180]. Strings, null, NaN, Infinity, missing, and out-of-range values are invalid; 0 is valid.
  - Affects: REQ-F-004, REQ-F-005, AC-002, AC-003

- [Q-004] Status: Resolved
  - Question: Should the details panel display the supplied `rating` (and `acreage`), given the dataset gives no rating scale or review count and ratings-based sorting is out of scope?
  - Option 1: Show `rating` as the bare number with the label "Rating" (e.g. "Rating: 4.7"), no "/5" and no review count; show "Rating not provided" when null — Recommended: uses a supplied, useful field without asserting a scale the dataset does not state. `acreage` is shown as "526 acres".
  - Option 2: Show rating as "4.7 / 5" — familiar to residents, but asserts a scale the data never states.
  - Option 3: Do not display `rating` at all — zero risk of implying unsupported facts, but omits a supplied field the brief invites ("any other useful supplied fields").
  - Answer: Option 1 — show "Rating: {n}" with no scale or review count; "Rating not provided" when null/missing; show acreage as "{n} acres".
  - Affects: REQ-F-002, REQ-F-012, AC-004

- [Q-005] Status: Resolved
  - Question: What should activating a map marker do?
  - Option 1: Select the park, so the shared selected-park ID updates the details panel, list highlight, and marker state — no popup; the details panel is the single place details appear — Recommended: honours the "one selected-park ID drives everything" rule and keeps one canonical details view.
  - Option 2: Select the park and also open a Leaflet popup with the park name and a "View details" link — extra on-map affordance, but duplicates content and adds a second focus/keyboard surface to make accessible.
  - Option 3: Open a popup only, and require a click on its link to select — the brief permits "clearly link to details", but selection lags the click and the shared-ID rule is weaker.
  - Answer: Option 1 — activating a marker only sets the selected-park ID; no popup. The details panel is the single details surface, and the selected marker is visually distinguished.
  - Affects: REQ-F-006, REQ-F-007, AC-002

- [Q-006] Status: Resolved
  - Question: After a park is selected (by list or marker), how should the details be made "easy to locate and identify", especially in the stacked phone layout where details may be off-screen and for keyboard users?
  - Option 1: Move focus to the details region heading (programmatic focus, `tabindex="-1"`) and scroll it into view on selection — Recommended: satisfies the keyboard criterion and the stacked layout concern with one behavior; screen-reader users hear the park name.
  - Option 2: Do not move focus; scroll into view and announce via an `aria-live` region — keeps focus on the list item for quick browsing, but keyboard users must Tab through the list to reach details and live announcements are less reliable.
  - Option 3: Move focus only on phone layout and leave focus on the list item on desktop where details are already visible — avoids stealing focus on desktop, but behaves inconsistently across viewports.
  - Answer: Option 1 — on selection (list or marker), move programmatic focus to the details region heading (`tabindex="-1"`) and scroll it into view; the heading text is the park name.
  - Affects: REQ-NF-002, AC-005, AC-006

- [Q-007] Status: Resolved
  - Question: What should the details panel show on first load, before any park is selected?
  - Option 1: No park selected; the panel shows a neutral prompt such as "Select a park from the list or map to see its details", no park highlighted, and the map starts fitted to all plotted parks — Recommended: shows only what the user chose, with no hidden default and no fabricated emphasis.
  - Option 2: Auto-select the first park in the array — panel is never empty, but implies a recommendation and, on load, may shift focus or scroll unexpectedly.
  - Option 3: Hide the details panel until a selection is made — cleaner initial screen, but layout shifts on first selection and the panel's location is not discoverable.
  - Answer: Option 1 — on first load no park is selected; the details region shows a neutral prompt ("Select a park from the list or map to see its details"), no list item or marker is highlighted, and no focus/scroll side effect occurs. Map initial view fits all plotted parks.
  - Affects: REQ-F-002, REQ-F-007, AC-001, AC-002, AC-006

## Acceptance Criteria

Boundary-fact notes: UI boundary = visible/accessible state. API boundary = status, headers, body. Data/pipeline, worker, security, and domain-service boundaries: N/A (no workers, auth, or persistence in scope).

- AC-001 (US-001, REQ-F-001, REQ-F-007)
  - Given the app has loaded the dataset, When the list renders, Then every usable park has one list item with its name, and activating an item selects that park and shows its details.
  - Observable boundary: UI — list items, highlighted selection, details panel heading.
  - Pass/fail rule: on first load no item is highlighted and the details region shows the neutral prompt; count of list items == count of usable records; details heading text equals the activated park's name; mismatch = fail.
  - Objective evidence: component/E2E test result.
  - "Usable" = non-empty string `id` and `name` (Q-002); for the sample, 12 list items in array order.

- AC-002 (US-003, REQ-F-004, REQ-F-006, REQ-F-007)
  - Given a park has valid latitude and longitude, When the map renders, Then exactly one marker for that park is present in an initial view in which all plotted markers are visible, and activating the marker shows or links to that park's details.
  - Observable boundary: UI — markers, map viewport bounds, details panel or link.
  - Pass/fail rule: marker count == count of valid-coordinate parks; every marker lies within initial viewport bounds; marker activation selects the same park ID as the list would. Any deviation = fail.
  - Objective evidence: test result asserting marker count, bounds containment, and selection.
  - "Valid coordinates" per Q-003. Marker activation only sets the selected-park ID; no popup (Q-005).

- AC-003 (US-003, REQ-F-005)
  - Given a park has missing or invalid coordinates, When the app renders, Then it appears in the list, can be selected, shows details, and has no marker on the map.
  - Observable boundary: UI — list, details, map markers.
  - Pass/fail rule: park is selectable and details render; marker count excludes it; no marker at NaN/null/out-of-range positions.
  - Objective evidence: test result with an invalid-coordinate fixture. The sample has no such record (all 12 valid), so the fixture is a test-only copy of a sample record with `location` removed or `lat`/`lng` made invalid; `parks.sample.json` itself is not modified.

- AC-004 (US-002, REQ-F-003, REQ-F-013)
  - Given a park with missing/null text, empty amenities/images arrays, or an image that fails to load, When its details are shown, Then the panel renders without error, remains readable, and contains no value absent from the dataset.
  - Observable boundary: UI — details panel DOM; console/runtime errors.
  - Pass/fail rule: no uncaught exception; every displayed value traces to a dataset field or is an explicit "not provided" label; failed image shows a non-broken fallback.
  - Objective evidence: test result with sparse fixture; traceability check of displayed text to source fields.
  - Sample coverage: `old-mill-botanical-garden` (null description), `highland-dog-park` (no address), `cedar-hill-nature-preserve` (empty images, null rating), and any park with an `images.example.com` URL (image load failure).

- AC-005 (US-004, REQ-NF-002)
  - Given focus starts outside the park list, When the user Tabs to a park control and presses Enter or Space, Then that park's details open, the focus indicator is visible throughout, and the new details are identifiable.
  - Observable boundary: UI — focus state, accessible name, details region heading.
  - Pass/fail rule: park control reachable by Tab; Enter/Space selects it; computed focus style is visible (non-none outline/ring); details region has a heading naming the park and is reachable without a pointer (focus moved to it or announced). Any miss = fail. Details-location behavior (Q-006): on selection, focus moves to the details heading and it is scrolled into view; `document.activeElement` must be that heading.
  - Objective evidence: keyboard test result and recorded manual keyboard walkthrough.

- AC-006 (US-005, REQ-NF-001)
  - Given a phone viewport (e.g. 375px wide) and a desktop viewport (e.g. 1280px wide), When a resident finds a park and reads its details, Then no content is clipped, no horizontal page scroll occurs, and all controls remain operable; phone is stacked and desktop is side-by-side.
  - Observable boundary: UI — layout at both viewports.
  - Pass/fail rule: `scrollWidth <= clientWidth` at both widths; list, map, and details reachable; layout direction matches viewport.
  - Objective evidence: viewport tests or screenshots at both sizes.

- AC-007 (US-006, REQ-F-010)
  - Given a fresh load with location permission unavailable, When the app runs, Then parks and details work and no geolocation permission prompt or `navigator.geolocation` call occurs.
  - Observable boundary: UI plus browser API calls.
  - Pass/fail rule: zero calls to `navigator.geolocation`; all list/detail tasks succeed.
  - Objective evidence: test with geolocation spy; code search showing no usage.

- AC-008 (US-007, REQ-NF-003)
  - Given map tiles fail to load, When the user uses the app, Then list and details still function.
  - Observable boundary: UI.
  - Pass/fail rule: with tile requests blocked, AC-001 passes unchanged.
  - Objective evidence: test result with tile requests blocked.

- AC-009 (US-007, REQ-F-008, REQ-F-009)
  - Given the API, When `GET /api/parks` succeeds, Then it returns HTTP 200 with `Content-Type: application/json` and a body equal to the parks data in `src/data/parks.sample.json`. When the request fails, Then the UI shows an error message and a retry control rather than an empty screen.
  - Observable boundary: API status/headers/body; UI error state.
  - Pass/fail rule: status == 200, JSON content type, deep-equal body to the file; on forced failure, error text and a retry control are present and retry re-requests the data.
  - Objective evidence: API test result; UI failure test result.

- AC-010 (US-008, REQ-F-011)
  - Given the repository, When a reviewer opens README.md, Then it contains install/run steps, what works, decisions, omissions, known issues, verification, next steps before public use, and the OSM tile-provider caveat.
  - Observable boundary: README content.
  - Pass/fail rule: all listed sections present; following the install/run steps starts the app.
  - Objective evidence: review record and a clean-checkout run.

- AC-011 (US-002, REQ-F-002, REQ-F-012)
  - Given a fully populated park (e.g. `prospect-park`), When it is selected, Then the details show its name, address, description, amenities, hours, and images, formatted per the display rules.
  - Observable boundary: UI — details panel text and image elements.
  - Pass/fail rule: the heading equals `name`; `location.address` and `hours` appear verbatim (exact string match); each amenity slug appears once as a label derived only by replacing hyphens with spaces and capitalising (e.g. `dog-run` -> "Dog run"), with no added or dropped amenities; acreage reads "526 acres"; rating reads "Rating: 4.7" with no "/5" and no review count; one image element per `images` entry, each with non-empty alt text containing only the park name and/or image position. Any missing field, altered string, or added claim = fail.
  - Objective evidence: component test result asserting each string against the source record.

- AC-012 (US-003, US-004, REQ-F-006, REQ-F-007)
  - Given the map is rendered and a park has a marker, When the marker is activated (pointer or keyboard), Then that park becomes selected: its list item is highlighted, its marker is visually distinguished from unselected markers, and focus moves to the details heading with the heading scrolled into the viewport.
  - Observable boundary: UI — list highlight state, marker selected state, `document.activeElement`, heading position.
  - Pass/fail rule: exactly one list item has the selected state and it matches the marker's park; exactly one marker has the selected state; `document.activeElement` is the details heading and its bounding box lies within the viewport; selecting a different park moves all three to the new park. Any mismatch = fail.
  - Objective evidence: browser test result asserting list state, marker state, active element, and heading position.

- AC-013 (US-004, REQ-NF-002)
  - Given the app is loaded in each state (initial, park selected), When it is scanned for accessibility, Then there are no violations at the WCAG 2.1 AA ruleset, every interactive control has an accessible name, and normal-size text has contrast of at least 4.5:1.
  - Observable boundary: UI — accessibility tree and computed styles.
  - Pass/fail rule: automated scan reports 0 violations in both states; count of interactive controls without an accessible name == 0; minimum measured text contrast >= 4.5:1 (>= 3:1 for large text and focus indicators). Any violation = fail.
  - Objective evidence: automated accessibility scan report plus the recorded manual keyboard walkthrough from AC-005.

- AC-014 (US-005, REQ-NF-004, REQ-NF-005)
  - Given a production build, When the home page is requested and then viewed at 375px and 1280px widths, Then the server render completes without errors, the map renders only in the browser, and the map container has a non-zero height at both widths.
  - Observable boundary: build output, server response, UI — computed map container height.
  - Pass/fail rule: `next build` exits 0; the page responds 200 and server logs contain no `window`/`document is not defined` errors; the map container's computed height is > 0 px at both widths and is set by Tailwind utility classes, not inline pixel styles. Any deviation = fail.
  - Objective evidence: build log, server log excerpt, browser test result with measured heights.

- AC-015 (US-001, US-003, US-007, REQ-F-001, REQ-F-004, REQ-F-005, REQ-F-009, CON-002, CON-003, CON-005)
  - Given edge-case datasets and the repository, When each case below is exercised, Then the stated outcome occurs.
  - Observable boundary: UI for (a)-(c); repository contents for (d).
  - Pass/fail rule:
    - (a) An empty array, or an array with no usable records, shows a distinct "no parks available" message (not a blank screen) and no map error.
    - (b) Zero valid-coordinate parks renders the map with a default view and no markers and no exception; exactly one valid-coordinate park renders one marker in a view centred on it without a zero-area-bounds error.
    - (c) Records with a missing or empty `id` or `name` are absent from the list; for a repeated `id`, only the first occurrence is listed.
    - (d) `ParkList`, `ParkDetails`, and `ParkMap` each exist as their own component under `src/components`; the map shows OpenStreetMap attribution; `package.json` has no database or auth dependency.
    - Any case not matching = fail.
  - Objective evidence: component test results with fixtures cloned from sample records (sample file unmodified); repository file listing and dependency review record.
