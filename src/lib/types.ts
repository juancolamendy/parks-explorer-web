export interface Coordinates {
  lat: number;
  lng: number;
}

/** A normalized park: every field is either a validated value or an explicit null/empty list. */
export interface Park {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  /** Non-null only when lat and lng are finite and in range; markers are the parks where this is set. */
  coordinates: Coordinates | null;
  amenities: string[];
  hours: string | null;
  images: string[];
  acreage: number | null;
  rating: number | null;
}
