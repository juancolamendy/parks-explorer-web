import type { ReactNode } from "react";

interface ExplorerLayoutProps {
  list: ReactNode;
  map: ReactNode;
  details: ReactNode;
}

/**
 * Page shell: one <main>, one <h1>, and three slots in DOM order list → map → details.
 *
 * Below `lg` the slots stack in that order. At `lg` and above the list is the left
 * column and the map sits above the details in the right column, so the visual
 * reading order equals the DOM (and therefore tab) order: no `order-*` utilities are
 * used. Rows are `auto` + `1fr` so extra list height never opens a gap under the map.
 * Slots are `min-w-0` so long names shrink instead of causing horizontal scroll, and
 * there are no nested scroll containers: the page scrolls.
 *
 * Source: https://tailwindcss.com/docs/grid-template-columns (arbitrary values use `_`
 * for spaces); class names are written whole so Tailwind can detect them.
 */
export function ExplorerLayout({ list, map, details }: ExplorerLayoutProps) {
  return (
    <main className="mx-auto w-full max-w-7xl p-4 lg:p-6">
      <h1 className="mb-4 text-2xl font-semibold lg:mb-6">Parks Explorer</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:grid-rows-[auto_1fr] lg:items-start">
        <div className="min-w-0 lg:col-start-1 lg:row-span-2 lg:row-start-1">{list}</div>
        <div className="min-w-0 lg:col-start-2 lg:row-start-1">{map}</div>
        <div className="min-w-0 lg:col-start-2 lg:row-start-2">{details}</div>
      </div>
    </main>
  );
}
