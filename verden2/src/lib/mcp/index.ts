import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMyTripsTool from "./tools/list-my-trips";
import logTripTool from "./tools/log-trip";
import unlockCarWithQuizTool from "./tools/unlock-car-with-quiz";
import calculateRouteTool from "./tools/calculate-route";
import searchPlacesTool from "./tools/search-places";
import geocodeAddressTool from "./tools/geocode-address";
import reverseGeocodeTool from "./tools/reverse-geocode";
import nearbyPlacesTool from "./tools/nearby-places";
import placeDetailsTool from "./tools/place-details";
import listGarageVehiclesTool from "./tools/list-garage-vehicles";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "verden-maps-mcp",
  title: "Verden Maps",
  version: "0.1.0",
  instructions:
    "Tools for Verden Maps. Use Google Maps tools for route, place, and geocoding tasks; use trip tools for the signed-in user's Verden impact data; use garage tools with actual garage vehicle names only.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    calculateRouteTool,
    searchPlacesTool,
    geocodeAddressTool,
    reverseGeocodeTool,
    nearbyPlacesTool,
    placeDetailsTool,
    listMyTripsTool,
    logTripTool,
    listGarageVehiclesTool,
    unlockCarWithQuizTool,
  ],
});
