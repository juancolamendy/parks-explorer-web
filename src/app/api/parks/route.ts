import parks from "@/data/parks.sample.json";

/**
 * GET /api/parks: returns the supplied dataset unmodified as JSON. Validation is the
 * client's job (normalizeParks); this route does no filtering, auth, or caching headers.
 * Only GET is exported, so Next.js answers every other method with 405.
 *
 * Source: https://nextjs.org/docs/app/api-reference/file-conventions/route
 * (Route Handler `GET` returning `Response.json(...)`).
 */
export function GET() {
  return Response.json(parks);
}
