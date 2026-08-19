import { createFileRoute } from "@tanstack/react-router";
import { MapboxError, jsonError, mapboxGet } from "@/lib/map/mapbox-gateway.server";
import { toVerdenPlace } from "./search";

export const Route = createFileRoute("/api/map/details")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { id?: string; sessionToken?: string };
          const id = typeof body.id === "string" ? body.id.trim() : "";
          if (!id || id.length > 200) return jsonError(400, "A valid place reference is required.");

          const data = await mapboxGet<{ features?: Parameters<typeof toVerdenPlace>[0][] }>(
            `/search/searchbox/v1/retrieve/${encodeURIComponent(id)}`,
            { session_token: body.sessionToken ?? "verden-session" },
          );

          const place = data.features?.[0] ? toVerdenPlace(data.features[0]) : null;
          if (!place) return jsonError(404, "That place could not be found.");
          return Response.json({ place });
        } catch (error) {
          if (error instanceof MapboxError) {
            return jsonError(error.status, "Place details are temporarily unavailable.");
          }
          console.error("map/details failed", error);
          return jsonError(500, "Place details could not be loaded.");
        }
      },
    },
  },
});