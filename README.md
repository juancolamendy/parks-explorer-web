# Parks Explorer

Browse parks in a list or on a map and read each park's details. Built with Next.js 16, React 19, Tailwind CSS v4, Leaflet and react-leaflet, around the supplied `src/data/parks.sample.json`. No location permission is requested.

## Install and run

```bash
npm install
npm run dev      # http://localhost:3000
```

Production build: `npm run build && npm start`.

## What works

- **Park list** — every usable park, in dataset order; works without the map. Each park is a button, so Tab and Enter/Space select it.
- **Park details** — shows only supplied facts (name, address, description, amenities, hours, acreage, rating, images). Missing or null fields, empty arrays and failed images show a plain fallback instead of an invented value.
- **Map** — one marker per park with valid coordinates, in an initial view that fits them all. Parks without valid coordinates stay in the list and details but get no marker. If tiles fail to load, a notice appears and the list and details keep working.
- **One selection** — a single selected-park ID drives the list highlight, the marker highlight and the details panel. Selecting a park, from the list or a marker, moves focus to the details heading.
- **Layout** — stacked on a phone, list on the left and map above details on the right on desktop.
- **`GET /api/parks`** — returns the sample data as JSON. If the request fails the page shows an alert with a Retry button.
- **Light theme only.**

## Decisions

- **Client-only map.** `ParkMap` is loaded with `next/dynamic` and `ssr: false` and mounts only after the data has loaded, because Leaflet needs `window` and its view props cannot change after mount. Leaflet is imported only in `src/components/ParkMap.tsx`.
- **Untrusted data boundary.** `normalizeParks` drops records without an id or name, keeps the first of a repeated id, and treats out-of-range or non-numeric coordinates as "no location".
- **Markers are real buttons** built from DOM nodes, never HTML strings, so park names cannot inject markup. Leaflet does not activate a marker on Enter/Space itself, so a `keydown` handler does.
- **Plain `<img>`**, not `next/image`, so that a failed load can show a fallback without allow-listing hosts.
- **Tests** use Vitest and React Testing Library only; end-to-end checks are manual (see Verification). Code is organised under `src/{assets,components,contexts,data,hooks,layouts,lib}`.
- **`react-leaflet` licence.** `react-leaflet` 5.0.0 is under the Hippocratic License 2.1, an "ethical source" licence that is not OSI-approved (Leaflet, React and the rest are MIT or BSD). The technical owner reviewed it and agreed to its use on 2026-10-02.
- **Dev-only licence note.** `vitest-axe` pulls in `axe-core` (MPL-2.0); it is a dev dependency and is not shipped. The wrapper was last released 2025-01-22.

## Omissions

Out of scope by requirement: search, filters, rating sort, geolocation, database, CRUD and authentication. Also not built: dark theme, map clustering, pagination, and image optimisation.

## Known issues

- The dataset's image host `images.example.com` does not resolve, so every park image shows the "Image could not be loaded" fallback until real image URLs are supplied.
- `npm test` prints a Vite warning that `vitest.config.ts` is loaded as an ES module (rename to `.mts` or set `"type": "module"` to silence it).
- Retrying after a failed load does not clear the current selection (open question).
- `npm run lint` also scans git worktrees kept inside the repo (`.worktree/`) and reports thousands of unrelated errors while any exist. Use `npx eslint src`, or remove the worktrees. Fix: add `.worktree/**` to the ESLint ignores.
- If a selected park were missing after a reload, the details panel would show the prompt with nothing highlighted. The sample data is static, so this cannot happen today.
- Image URLs starting with `http:` are accepted; on an HTTPS site the browser blocks them and the fallback shows.
- The details panel names its amenities list twice for screen readers (heading plus list label).
- Jsdom tests cannot check CSS layout, colour contrast, the real focus ring or the production `ssr: false` behaviour; those are in the manual checklist below.

## Verification

Commands (all exit 0 when the app is healthy):

```bash
npm test                # Vitest + React Testing Library
npm run lint
npx tsc --noEmit        # needs a prior `npm run build` (Next generates its route types)
npm run build
```

### Manual end-to-end checklist

A code review of revision `ddb038a` found no blockers (see `docs/reviews/review_parks-explorer-2026-10-02.md`). It rated the acceptance criteria AC-002, AC-006, AC-013 and AC-014 as not yet proven, because their only Primary checks are the manual rows below and they have not been run.

Run on `npm run dev` or `npm run build && npm start`, at 375 px and 1280 px wide. The owner accepts that AC-002, AC-006, AC-013 and AC-014 are verified only by these manual runs (risk R-007). Fill in the last three columns as you go.

| Test | AC | Check | Owner | Result | Date |
|---|---|---|---|---|---|
| TEST-044 | AC-002 | Load `/`. One marker per valid park, all inside the initial view; clicking a marker selects the same park as the list. | pending owner run | pending | — |
| TEST-045 | AC-006 | Find a park and read its details at both widths. No clipped content or horizontal scroll; stacked at 375, two columns at 1280. | pending owner run | pending | — |
| TEST-046 | AC-013 | Run the axe DevTools scan in the initial and selected states, and check contrast. 0 violations; contrast at least 4.5:1. | pending owner run | pending | — |
| TEST-047 | AC-014 | `npm run build && npm start`, load `/` at both widths. No `window`/`document` errors in the server log; the map has non-zero height at both widths. | pending owner run | pending | — |
| TEST-048 | AC-005 | Tab through the list buttons. A focus ring is visible on each. | pending owner run | pending | — |
| TEST-049 | AC-008 | Block `tile.openstreetmap.org` in DevTools, reload, select a park. The notice shows and the list and details work. | pending owner run | pending | — |
| TEST-050 | AC-009 | Block `/api/parks`, reload, then unblock and click Retry. An alert with Retry shows, then the parks load. | pending owner run | pending | — |
| TEST-051 | AC-012 | Select a park from the list and from a marker. The details heading is inside the viewport and the marker is visibly selected. | pending owner run | pending | — |

## Time spent

About 2 hours in total, as reported by the owner.

## Before public use

- **Map tiles.** This local assessment uses OpenStreetMap's standard tiles so no API key is needed. A public deployment needs a reviewed tile provider and a usage plan that respects the OpenStreetMap tile usage policy.
- Replace the placeholder image URLs with real, reviewed images.
- Confirm the `react-leaflet` Hippocratic-2.1 licence is acceptable for the deployment, or move to Leaflet directly.
- Run the manual checklist and record the results (the review's open Major finding).
- Accept only `https:` image URLs, and decide whether Retry should clear the selection.
- Add monitoring, a content security policy and a real data source behind `/api/parks`.
