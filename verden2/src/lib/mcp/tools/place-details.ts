import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { mapsContent } from "../google-maps";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev/google_maps";

export default defineTool({
  name: "place_details",
  title: "Place details",
  description: "Get detailed Google Places information for a place ID.",
  inputSchema: {
    place_id: z.string().trim().min(1).describe("Google Places resource name or place ID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ place_id }) => {
    try {
      const lovableKey = process.env.LOVABLE_API_KEY;
      const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_BROWSER_KEY;
      if (!lovableKey || !googleKey)
        throw new Error("Google Maps connector credentials are not configured for Verden Maps.");
      const normalized = place_id.startsWith("places/") ? place_id : `places/${place_id}`;
      const response = await fetch(
        `${GATEWAY_BASE_URL}/places/v1/${encodeURIComponent(normalized).replace("%2F", "/")}`,
        {
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": googleKey,
            "X-Goog-FieldMask":
              "id,displayName,formattedAddress,location,rating,userRatingCount,types,primaryType,websiteUri,nationalPhoneNumber,regularOpeningHours",
          },
        },
      );
      const text = await response.text();
      if (!response.ok) throw new Error(`Google Maps request failed [${response.status}]: ${text}`);
      return mapsContent(text ? JSON.parse(text) : {});
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : "Place details lookup failed",
          },
        ],
        isError: true,
      };
    }
  },
});
