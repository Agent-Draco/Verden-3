import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { googleMapsPost, latLngSchema, mapsContent } from "../google-maps";

export default defineTool({
  name: "calculate_route",
  title: "Calculate route",
  description:
    "Calculate Google Maps driving routes between two coordinates, including fuel-efficient alternatives when available.",
  inputSchema: {
    origin: latLngSchema.describe("Starting coordinate."),
    destination: latLngSchema.describe("Destination coordinate."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ origin, destination }) => {
    try {
      const data = await googleMapsPost(
        "/routes/directions/v2:computeRoutes",
        {
          origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
          destination: {
            location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
          },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE_OPTIMAL",
          computeAlternativeRoutes: true,
          requestedReferenceRoutes: ["FUEL_EFFICIENT"],
        },
        "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.routeLabels,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration",
      );
      return mapsContent(data);
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : "Route calculation failed",
          },
        ],
        isError: true,
      };
    }
  },
});
