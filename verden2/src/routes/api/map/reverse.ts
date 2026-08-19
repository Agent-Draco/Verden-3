import { createFileRoute } from "@tanstack/react-router";
import { MapboxError, clampNumber, jsonError, mapboxGet } from "@/lib/map/mapbox-gateway.server";

type GeocodeFeature = {
  properties?: {
    name?: string;
    full_address?: string;
    place_formatted?: string;
    feature_type?: string;
    coordinates?: { longitude?: number; latitude?: number };
  };
};

export const Route = createFileRoute("/api/map/reverse")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { lat?: number; lng?: number };
          const lat = clampNumber(body.lat, -90, 90);
          const lng = clampNumber(body.lng, -180, 180);
          if (lat === null || lng === null) return jsonError(400, "Valid coordinates are required.");

          const data = await mapboxGet<{ features?: GeocodeFeature[] }>(
            "/search/geocode/v6/reverse",
            { longitude: lng, latitude: lat, limit: 1 },
          );

          const f = data.features?.[0]?.properties;
          return Response.json({
            place: f
              ? {
                  name: f.name ?? f.place_formatted ?? "Dropped pin",
                  address: f.full_address ?? f.place_formatted ?? "",
                  lat: f.coordinates?.latitude ?? lat,
                  lng: f.coordinates?.longitude ?? lng,
                }
              : { name: "Dropped pin", address: "", lat, lng },
          });
        } catch (error) {
          if (error instanceof MapboxError) {
            return jsonError(error.status, "Address lookup is temporarily unavailable.");
          }
          console.error("map/reverse failed", error);
          return jsonError(500, "Address lookup could not be completed.");
        }
      },
    },
  },
});