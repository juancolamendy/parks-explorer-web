import type { Park } from "@/lib/types";

const HEADING_ID = "parks-list-heading";

// Tailwind only generates classes it finds as literal strings, so each state is a whole string.
// The selected item differs by a thicker left border and bold text, not by colour alone.
// `focus-visible:outline-hidden` keeps a transparent outline for forced-colors mode,
// where the box-shadow ring is dropped.
const ITEM_CLASS =
  "block w-full min-w-0 rounded-md border border-l-4 border-zinc-300 bg-white px-3 py-2 text-left break-words text-zinc-900 hover:bg-zinc-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2";
const SELECTED_ITEM_CLASS =
  "block w-full min-w-0 rounded-md border border-l-8 border-green-700 bg-green-50 px-3 py-2 text-left font-semibold break-words text-zinc-900 hover:bg-green-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2";

interface ParkListProps {
  parks: Park[];
  selectedParkId: string | null;
  onSelect: (id: string) => void;
}

/**
 * Every usable park as a native button, so Tab, Enter, and Space work with no extra code.
 * The page scrolls; the list adds no nested scroll container (it would need to be focusable).
 */
export default function ParkList({ parks, selectedParkId, onSelect }: ParkListProps) {
  return (
    <section aria-labelledby={HEADING_ID}>
      <h2 id={HEADING_ID} className="mb-3 text-lg font-semibold text-zinc-900">
        Parks
      </h2>
      <ul className="flex flex-col gap-2">
        {parks.map((park) => {
          const selected = park.id === selectedParkId;
          return (
            <li key={park.id}>
              <button
                type="button"
                aria-current={selected ? "true" : undefined}
                className={selected ? SELECTED_ITEM_CLASS : ITEM_CLASS}
                onClick={() => onSelect(park.id)}
              >
                {park.name}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
