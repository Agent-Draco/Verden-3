import { createFileRoute } from "@tanstack/react-router";
import { MapboxError, clampNumber, jsonError, mapboxGet } from "@/lib/map/mapbox-gateway.server";
import type { VerdenPlace } from "@/lib/map/types";
import { toVerdenPlace } from "./search";

/** Verden category -> Mapbox Search Box canonical category id. */
const CATEGORY_MAP: Record<string, string> = {
  restaurant: "restaurant",
  cafe: "cafe",
  hotel: "hotel",
  parking: "parking_lot",
  attraction: "tourist_attraction",
  park: "park",
  ev_charging: "ev_charging_station",
  toilet: "toilet",
  drinking_water: "drinking_water",
  bicycle_parking: "bicycle_parking",
  defibrillator: "emergency_service",
  playground: "playground",
  museum: "museum",
  zoo: "zoo",
  ice_cream: "ice_cream",
  skate_park: "skate_park",
};

export const Route = createFileRoute("/api/map/category")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            category?: string;
            lat?: number;
            lng?: number;
            limit?: number;
            radiusM?: number;
          };
          const canonical = CATEGORY_MAP[body.category ?? ""];
          if (!canonical) return jsonError(400, "Unknown place category.");
          const lat = clampNumber(body.lat, -90, 90);
          const lng = clampNumber(body.lng, -180, 180);
          if (lat === null || lng === null) return jsonError(400, "Valid coordinates are required.");

          const data = await mapboxGet<{ features?: Parameters<typeof toVerdenPlace>[0][] }>(
            `/search/searchbox/v1/category/${canonical}`,
            {
              proximity: `${lng},${lat}`,
              limit: Math.min(Math.max(body.limit ?? 12, 1), 25),
            },
          );

          const places = (data.features ?? [])
            .map(toVerdenPlace)
            .filter((p): p is VerdenPlace => p !== null);

          return Response.json({ places });
        } catch (error) {
          if (error instanceof MapboxError) {
            return jsonError(error.status, "Nearby places are temporarily unavailable.");
          }
          console.error("map/category failed", error);
          return jsonError(500, "Nearby places could not be loaded.");
        }
      },
    },
  },
});