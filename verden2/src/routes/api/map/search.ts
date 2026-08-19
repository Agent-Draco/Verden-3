import { createFileRoute } from "@tanstack/react-router";
import { MapboxError, clampNumber, jsonError, mapboxGet } from "@/lib/map/mapbox-gateway.server";
import type { VerdenPlace } from "@/lib/map/types";

type SearchboxFeature = {
  properties?: {
    mapbox_id?: string;
    name?: string;
    full_address?: string;
    place_formatted?: string;
    feature_type?: string;
    poi_category?: string[];
    maki?: string;
    distance?: number;
    coordinates?: { longitude?: number; latitude?: number };
    metadata?: Record<string, unknown>;
    external_ids?: Record<string, string>;
  };
};

export function toVerdenPlace(feature: SearchboxFeature): VerdenPlace | null {
  const p = feature.properties ?? {};
  const lng = p.coordinates?.longitude;
  const lat = p.coordinates?.latitude;
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  const meta = (p.metadata ?? {}) as Record<string, unknown>;
  return {
    id: p.mapbox_id ?? `${lng},${lat}`,
    name: p.name ?? p.place_formatted ?? "Unnamed place",
    address: p.full_address ?? p.place_formatted ?? "",
    lat,
    lng,
    category: p.poi_category?.[0] ?? p.feature_type ?? "place",
    categories: p.poi_category ?? [],
    maki: p.maki,
    distanceM: p.distance,
    metadata: {
      openHours: typeof meta["open_hours"] === "object" ? undefined : (meta["open_hours"] as string),
      openNow: (meta["open_now"] as boolean | undefined) ?? null,
      phone: meta["phone"] as string | undefined,
      website: meta["website"] as string | undefined,
      wheelchairAccessible: (meta["wheelchair_accessible"] as boolean | undefined) ?? null,
      wifi: (meta["wifi"] as boolean | undefined) ?? null,
      popularity: (meta["popularity"] as number | undefined) ?? null,
      rating: (meta["rating"] as number | undefined) ?? null,
      priceLevel: (meta["price_level"] as string | undefined) ?? null,
    },
  };
}

export const Route = createFileRoute("/api/map/search")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            query?: string;
            proximity?: { lat: number; lng: number };
            limit?: number;
            bbox?: [number, number, number, number];
            country?: string;
          };
          const query = typeof body.query === "string" ? body.query.trim() : "";
          if (!query) return jsonError(400, "A search term is required.");
          if (query.length > 160) return jsonError(400, "That search term is too long.");

          const limit = Math.min(Math.max(body.limit ?? 8, 1), 10);
          const proximity =
            body.proximity &&
            clampNumber(body.proximity.lng, -180, 180) !== null &&
            clampNumber(body.proximity.lat, -90, 90) !== null
              ? `${body.proximity.lng},${body.proximity.lat}`
              : undefined;

          const data = await mapboxGet<{ features?: SearchboxFeature[] }>(
            "/search/searchbox/v1/forward",
            {
              q: query,
              limit,
              proximity,
              bbox: body.bbox ? body.bbox.join(",") : undefined,
              country: body.country,
            },
          );

          const places = (data.features ?? [])
            .map(toVerdenPlace)
            .filter((p): p is VerdenPlace => p !== null);

          return Response.json({ places });
        } catch (error) {
          if (error instanceof MapboxError) {
            return jsonError(
              error.status,
              "Search is temporarily unavailable. Please try again shortly.",
            );
          }
          console.error("map/search failed", error);
          return jsonError(500, "Search could not be completed.");
        }
      },
    },
  },
});