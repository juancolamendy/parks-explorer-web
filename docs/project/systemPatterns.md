# System Patterns

## Architecture
- Next.js App Router; source in `src/app/`.
- Import alias `@/*` -> `src/*`.
- Server Components by default; add `"use client"` only where interactivity requires it.

## Design patterns
None established yet.

## Component relationships
`src/app/layout.tsx` (root layout, imports `globals.css`) -> `src/app/page.tsx`.
