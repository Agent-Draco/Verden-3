/**
 * Server-side Mapbox access. Every Mapbox request in Verden goes through the
 * Lovable connector gateway so the secret token never reaches the browser.
 */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/mapbox";

export class MapboxError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function mapboxGet<T>(
  path: string,
  query: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["MAPBOX_API_KEY"];
  if (!lovableKey || !connectionKey) {
    throw new MapboxError(500, "Mapbox connector credentials are not configured.");
  }

  const url = new URL(`${GATEWAY_URL}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectionKey,
    },
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(`Mapbox request failed [${response.status}] ${path}: ${text}`);
    throw new MapboxError(response.status, text || "Mapbox request failed");
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function clampNumber(value: unknown, min: number, max: number): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}