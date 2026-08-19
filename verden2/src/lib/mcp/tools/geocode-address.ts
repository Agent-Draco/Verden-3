import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { googleMapsGet, mapsContent } from "../google-maps";

export default defineTool({
  name: "geocode_address",
  title: "Geocode address",
  description:
    "Convert an address or place name into latitude and longitude with Google Geocoding.",
  inputSchema: {
    address: z.string().trim().min(1).describe("Address, place name, or landmark to geocode."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ address }) => {
    try {
      return mapsContent(await googleMapsGet("/maps/api/geocode/json", { address }));
    } catch (error) {
      return {
        content: [
          { type: "text", text: error instanceof Error ? error.message : "Geocoding failed" },
        ],
        isError: true,
      };
    }
  },
});
