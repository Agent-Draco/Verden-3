import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { googleMapsPost, latLngSchema, mapsContent } from "../google-maps";

export default defineTool({
  name: "nearby_places",
  title: "Nearby places",
  description: "Find nearby Google Places around a coordinate and radius.",
  inputSchema: {
    location: latLngSchema.describe("Center coordinate for the nearby search."),
    radius_m: z.number().min(1).max(50000).describe("Search radius in meters, up to 50000."),
    included_types: z
      .array(z.string().trim().min(1))
      .max(10)
      .optional()
      .describe("Optional Google Places types to include, such as restaurant or park."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ location, radius_m, included_types }) => {
    try {
      const data = await googleMapsPost(
        "/places/v1/places:searchNearby",
        {
          includedTypes: included_types,
          maxResultCount: 10,
          locationRestriction: {
            circle: {
              center: { latitude: location.lat, longitude: location.lng },
              radius: radius_m,
            },
          },
        },
        "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.primaryType",
      );
      return mapsContent(data);
    } catch (error) {
      return {
        content: [
          { type: "text", text: error instanceof Error ? error.message : "Nearby search failed" },
        ],
        isError: true,
      };
    }
  },
});
