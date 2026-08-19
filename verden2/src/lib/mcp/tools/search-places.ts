import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { googleMapsPost, latLngSchema, mapsContent } from "../google-maps";

export default defineTool({
  name: "search_places",
  title: "Search places",
  description: "Search Google Places by text query, optionally biased around a coordinate.",
  inputSchema: {
    query: z
      .string()
      .trim()
      .min(1)
      .describe("Place, address, business, landmark, or point of interest to search for."),
    location: latLngSchema.optional().describe("Optional coordinate used to bias nearby results."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ query, location }) => {
    try {
      const body: Record<string, unknown> = { textQuery: query, maxResultCount: 10 };
      if (location) {
        body.locationBias = {
          circle: { center: { latitude: location.lat, longitude: location.lng }, radius: 30000 },
        };
      }
      const data = await googleMapsPost(
        "/places/v1/places:searchText",
        body,
        "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.types,places.primaryType",
      );
      return mapsContent(data);
    } catch (error) {
      return {
        content: [
          { type: "text", text: error instanceof Error ? error.message : "Place search failed" },
        ],
        isError: true,
      };
    }
  },
});
