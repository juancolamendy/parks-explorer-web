import type { Ref } from "react";
import ParkImage from "@/components/ParkImage";
import { formatAcreage, formatAmenity, formatRating, imageAlt } from "@/lib/format";
import type { Park } from "@/lib/types";

const HEADING_ID = "park-details-heading";
const EMPTY_HEADING = "Park details";
const EMPTY_PROMPT = "Select a park from the list or map to see its details";

const LABEL_CLASS = "text-sm font-semibold text-zinc-700";
const NOT_PROVIDED_CLASS = "italic text-zinc-600";

interface ParkDetailsProps {
  park: Park | undefined;
  /** Attached to the heading so the focus hook can move focus to it on selection. */
  headingRef?: Ref<HTMLHeadingElement>;
}

/** A labelled text field: the value is shown as supplied, or an explicit "not provided" label. */
function Field({ label, value, missing }: { label: string; value: string | null; missing: string }) {
  return (
    <div>
      <dt className={LABEL_CLASS}>{label}</dt>
      <dd className="break-words">
        {value ?? <span className={NOT_PROVIDED_CLASS}>{missing}</span>}
      </dd>
    </div>
  );
}

function ParkFacts({ park }: { park: Park }) {
  const amenities = park.amenities.flatMap((slug) => formatAmenity(slug) ?? []);

  return (
    <div className="mt-3 space-y-4">
      <dl className="space-y-3">
        <Field label="Address" value={park.address} missing="Address not provided" />
        <Field label="Hours" value={park.hours} missing="Hours not provided" />
        <Field label="Description" value={park.description} missing="Description not provided" />
      </dl>

      <p className="break-words">
        {park.acreage === null ? (
          <span className={NOT_PROVIDED_CLASS}>Acreage not provided</span>
        ) : (
          formatAcreage(park.acreage)
        )}
      </p>
      <p className="break-words">{formatRating(park.rating)}</p>

      <section>
        <h3 className={LABEL_CLASS}>Amenities</h3>
        {amenities.length === 0 ? (
          <p className={NOT_PROVIDED_CLASS}>No amenities listed</p>
        ) : (
          <ul aria-label="Amenities" className="mt-1 flex flex-wrap gap-2">
            {amenities.map((label, index) => (
              // Position-qualified keys: the data is untrusted and may repeat an amenity.
              <li key={`${index}-${label}`} className="rounded-full bg-zinc-100 px-3 py-1 text-sm">
                {label}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className={LABEL_CLASS}>Photos</h3>
        {park.images.length === 0 ? (
          <p className={NOT_PROVIDED_CLASS}>No photos provided</p>
        ) : (
          <div className="mt-1 grid gap-3 sm:grid-cols-2">
            {park.images.map((src, index) => (
              <ParkImage key={`${index}-${src}`} src={src} alt={imageAlt(park.name, index + 1)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * The single place a park's details appear. Shows only supplied facts: anything the
 * dataset lacks gets an explicit "not provided" label, never an invented value.
 * The heading is focusable (tabIndex -1) so selection can move focus to it.
 */
export default function ParkDetails({ park, headingRef }: ParkDetailsProps) {
  return (
    <section
      aria-labelledby={HEADING_ID}
      className="min-w-0 rounded-lg border border-zinc-300 p-4"
    >
      <h2
        id={HEADING_ID}
        ref={headingRef}
        tabIndex={-1}
        className="break-words text-xl font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      >
        {park ? park.name : EMPTY_HEADING}
      </h2>
      {park ? <ParkFacts park={park} /> : <p className="mt-3 text-zinc-700">{EMPTY_PROMPT}</p>}
    </section>
  );
}
