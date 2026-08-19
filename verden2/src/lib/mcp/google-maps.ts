import { z } from "zod";

export const latLngSchema = z.object({
  lat: z.number().min(-90).max(90).describe("Latitude in decimal degrees."),
  lng: z.number().min(-180).max(180).describe("Longitude in decimal degrees."),
});

export type LatLng = z.infer<typeof latLngSchema>;

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev/google_maps";

function googleMapsHeaders(fieldMask?: string): Record<string, string> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_BROWSER_KEY;

  if (!lovableKey || !googleKey) {
    throw new Error("Google Maps connector credentials are not configured for Verden Maps.");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": googleKey,
    "Content-Type": "application/json",
  };

  if (fieldMask) headers["X-Goog-FieldMask"] = fieldMask;
  return headers;
}

export async function googleMapsPost<T>(
  path: string,
  body: unknown,
  fieldMask?: string,
): Promise<T> {
  const response = await fetch(`${GATEWAY_BASE_URL}${path}`, {
    method: "POST",
    headers: googleMapsHeaders(fieldMask),
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Google Maps request failed [${response.status}]: ${text}`);
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function googleMapsGet<T>(
  path: string,
  query: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const url = new URL(`${GATEWAY_BASE_URL}${path}`);
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value));
  });

  const response = await fetch(url, {
    headers: googleMapsHeaders(),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Google Maps request failed [${response.status}]: ${text}`);
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}

export function mapsContent(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent:
      data && typeof data === "object" ? (data as Record<string, unknown>) : { result: data },
  };
}
