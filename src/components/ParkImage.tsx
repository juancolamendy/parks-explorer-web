"use client";

import { useState } from "react";

const FALLBACK_TEXT = "Image could not be loaded";

interface ParkImageProps {
  src: string;
  alt: string;
}

/**
 * One park photo. The image and its fallback share the same fixed aspect-ratio box so a
 * failed load never shifts the layout, and a failure replaces only this image.
 * The dataset's image host is a non-resolving placeholder, so the fallback is a normal state.
 */
export default function ParkImage({ src, alt }: ParkImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="aspect-video w-full overflow-hidden rounded-md border border-zinc-300 bg-zinc-100">
      {failed ? (
        <p className="flex h-full items-center justify-center p-2 text-center text-sm text-zinc-700">
          {FALLBACK_TEXT}
        </p>
      ) : (
        // A plain <img>, not next/image (DES-029): next/image needs remotePatterns for every
        // host, and the failure event is what drives the fallback. no-referrer and lazy per DES-019.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
