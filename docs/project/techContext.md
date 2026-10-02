# Tech Context

## Stack
- Next.js 16.3.8 (App Router, Turbopack)
- React 19.2.8
- Tailwind CSS v4 via `@tailwindcss/postcss` (CSS-first config in `src/app/globals.css`; no `tailwind.config`)
- TypeScript 5, ESLint 9 (`eslint-config-next`)
- npm (`package-lock.json`)

## Dev setup
- `npm install`
- `npm run dev` -> http://localhost:3000
- `npm run build`, `npm run start`, `npm run lint`

## Constraints
- Node >= 20 (developed on v24).
- No test runner configured yet.
