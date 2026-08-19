import { createFileRoute } from "@tanstack/react-router";
import { MapboxError, clampNumber, jsonError, mapboxGet } from "@/lib/map/mapbox-gateway.server";

const PROFILES = new Set(["driving", "walking", "cycling"]);

export const Route = createFileRoute("/api/map/isochrone")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            lat?: number;
            lng?: number;
            profile?: string;
            minutes?: number[];
          };
          const lat = clampNumber(body.lat, -90, 90);
          const lng = clampNumber(body.lng, -180, 180);
          if (lat === null || lng === null) return jsonError(400, "Valid coordinates are required.");

          const profile = PROFILES.has(body.profile ?? "") ? body.profile! : "walking";
          const minutes = (Array.isArray(body.minutes) ? body.minutes : [15])
            .map((m) => clampNumber(m, 1, 60))
            .filter((m): m is number => m !== null)
            .slice(0, 4);
          if (minutes.length === 0) return jsonError(400, "Provide at least one travel time.");

          const data = await mapboxGet<{ features?: unknown[] }>(
            `/isochrone/v1/mapbox/${profile}/${lng},${lat}`,
            {
              contours_minutes: minutes.join(","),
              polygons: true,
              denoise: 0.5,
              generalize: 50,
            },
          );

          return Response.json({ features: data.features ?? [], minutes, profile });
        } catch (error) {
          if (error instanceof MapboxError) {
            return jsonError(error.status, "Travel-time areas are temporarily unavailable.");
          }
          console.error("map/isochrone failed", error);
          return jsonError(500, "Travel-time areas could not be calculated.");
        }
      },
    },
  },
});