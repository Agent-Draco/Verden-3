import { defineTool } from "@lovable.dev/mcp-js";
import { googleMapsGet, latLngSchema, mapsContent } from "../google-maps";

export default defineTool({
  name: "reverse_geocode",
  title: "Reverse geocode",
  description:
    "Convert latitude and longitude into a human-readable address with Google Geocoding.",
  inputSchema: {
    location: latLngSchema.describe("Coordinate to reverse geocode."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ location }) => {
    try {
      return mapsContent(
        await googleMapsGet("/maps/api/geocode/json", {
          latlng: `${location.lat},${location.lng}`,
        }),
      );
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : "Reverse geocoding failed",
          },
        ],
        isError: true,
      };
    }
  },
});
