/**
 * MapService — the single client-side entry point for every map data request.
 *
 * UI code never calls Mapbox or fetch() directly: it calls MapService, which
 * adds IndexedDB caching (so repeat lookups are free and work offline) and
 * normalises errors into human-readable messages.
 */

import { TTL, cacheGet, cacheSet, geoKey } from "./cache";
import type {
  IsochroneContour,
  LngLat,
  PlaceCategory,
  RoutePreference,
  TravelProfile,
  VerdenPlace,
  VerdenRoute,
} from "./types";
import type { Feature, MultiPolygon, Polygon } from "geojson";

export class MapServiceError extends Error {}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: string };
  if (!res.ok) {
    throw new MapServiceError(data.error ?? "That map request could not be completed.");
  }
  return data as T;
}

async function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
  const hit = await cacheGet<T>(key);
  if (hit) return hit;
  const value = await load();
  void cacheSet(key, value, ttl);
  return value;
}

export const MapService = {
  async search(query: string, proximity?: LngLat | null, limit = 8): Promise<VerdenPlace[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const token =
      (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
        import.meta.env.VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN) as string | undefined;
    if (!token) throw new MapServiceError("Mapbox access token is not configured.");

    const key = `search:${q.toLowerCase()}:${proximity ? geoKey(proximity.lng, proximity.lat, 2) : "any"}:${limit}`;
    return cached(key, TTL.search, async () => {
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        q,
      )}.json?access_token=${token}&autocomplete=true&types=poi,address,neighborhood,place&limit=${limit}${
        proximity ? `&proximity=${proximity.lng},${proximity.lat}` : ""
      }`;
      const res = await fetch(endpoint);
      if (!res.ok) {
        throw new MapServiceError(`Search failed (${res.status}): ${res.statusText}`);
      }
      const data = await res.json();
      const features = (data.features ?? []) as Array<Record<string, unknown>>;
      return features.map((f: Record<string, unknown>) => {
        const center = (f["center"] as [number, number] | undefined) ?? [0, 0];
        const text = (f["text"] as string | undefined) ?? "";
        const placeName = (f["place_name"] as string | undefined) ?? "";
        const properties = (f["properties"] as Record<string, unknown> | undefined) ?? {};
        const placeType = (f["place_type"] as string[] | undefined) ?? [];
        const name = text || placeName.split(",")[0] || "Unnamed place";
        const address = placeName;
        const category = (properties["category"] as string | undefined) ?? placeType[0] ?? "place";

        return {
          id: (f["id"] as string | undefined) ?? `${center[0]},${center[1]}`,
          name,
          address,
          lat: center[1],
          lng: center[0],
          category,
          categories: placeType,
          maki: properties["maki"] as string | undefined,
          metadata: {
            phone: properties["tel"] as string | undefined,
            website: properties["website"] as string | undefined,
          },
        } as VerdenPlace;
      });
    });
  },

  async reverse(point: LngLat): Promise<VerdenPlace> {
    const key = `reverse:${geoKey(point.lng, point.lat, 4)}`;
    return cached(key, TTL.reverse, async () => {
      const token =
        (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
          import.meta.env.VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN) as string | undefined;
      if (token) {
        try {
          const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${point.lng},${point.lat}.json?access_token=${token}&limit=1`;
          const res = await fetch(endpoint);
          if (res.ok) {
            const data = await res.json();
            const f = data.features?.[0];
            if (f) {
              const name = f.text || f.place_name?.split(",")[0] || "Dropped pin";
              return {
                id: f.id ?? `${point.lng},${point.lat}`,
                name,
                address: f.place_name ?? `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`,
                lat: point.lat,
                lng: point.lng,
                category: "place",
                categories: f.place_type ?? [],
                metadata: {},
              } as VerdenPlace;
            }
          }
        } catch {
          /* ignore client geocode miss and fallback */
        }
      }
      const data = await post<{ place: Omit<VerdenPlace, "category" | "categories" | "metadata"> }>(
        "/api/map/reverse",
        point,
      );
      return {
        ...data.place,
        id: data.place.id ?? `${point.lng},${point.lat}`,
        category: "place",
        categories: [],
        metadata: {},
      } as VerdenPlace;
    });
  },

  async nearby(
    category: PlaceCategory,
    point: LngLat,
    limit = 12,
  ): Promise<VerdenPlace[]> {
    const key = `category:${category}:${geoKey(point.lng, point.lat, 2)}:${limit}`;
    return cached(key, TTL.category, async () => {
      const data = await post<{ places: VerdenPlace[] }>("/api/map/category", {
        category,
        lat: point.lat,
        lng: point.lng,
        limit,
      });
      return data.places ?? [];
    });
  },

  async details(id: string): Promise<VerdenPlace> {
    return cached(`details:${id}`, TTL.details, async () => {
      const data = await post<{ place: VerdenPlace }>("/api/map/details", { id });
      return data.place;
    });
  },

  /**
   * Returns every Mapbox alternative, each independently scored with Verden
   * metrics. Callers choose a lens; the alternatives themselves are preserved.
   */
  async directions(input: {
    origin: LngLat;
    destination: LngLat;
    waypoints?: LngLat[];
    profile?: TravelProfile;
  }): Promise<VerdenRoute[]> {
    const key = `dir:${input.profile ?? "driving"}:${geoKey(input.origin.lng, input.origin.lat, 3)}:${geoKey(
      input.destination.lng,
      input.destination.lat,
      3,
    )}:${(input.waypoints ?? []).map((w) => geoKey(w.lng, w.lat, 3)).join("|")}`;
    return cached(key, TTL.directions, async () => {
      try {
        const data = await post<{ routes: VerdenRoute[] }>("/api/map/directions", {
          origin: input.origin,
          destination: input.destination,
          waypoints: input.waypoints,
          profile: input.profile ?? "driving",
        });
        if (data.routes && data.routes.length > 0) return data.routes;
      } catch (err) {
        console.warn("Server directions unavailable, falling back to direct Mapbox API:", err);
      }

      const token =
        (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
          import.meta.env.VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN) as string | undefined;
      if (!token) throw new MapServiceError("Mapbox access token is not configured.");

      const profile = input.profile ?? "driving";
      const mbProfile = profile === "driving" ? "driving-traffic" : profile;
      const coords = [
        `${input.origin.lng},${input.origin.lat}`,
        ...(input.waypoints ?? []).map((w) => `${w.lng},${w.lat}`),
        `${input.destination.lng},${input.destination.lat}`,
      ].join(";");

      const endpoint = `https://api.mapbox.com/directions/v5/mapbox/${mbProfile}/${coords}?access_token=${token}&alternatives=true&geometries=geojson&overview=full&steps=true&annotations=duration,distance&language=en`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new MapServiceError(`Directions request failed: ${res.statusText}`);
      const data = await res.json();
      const rawRoutes = (data.routes ?? []) as Array<any>;
      if (rawRoutes.length === 0) throw new MapServiceError("No routes found.");

      const baselineDistanceM = Math.min(...rawRoutes.map((r) => r.distance));
      const fastestDurationS = Math.min(...rawRoutes.map((r) => r.duration));

      return rawRoutes.slice(0, 3).map((r, idx) => {
        const maneuvers = (r.legs ?? []).flatMap((leg: any) =>
          (leg.steps ?? []).map((step: any) => ({
            instruction: step.maneuver?.instruction ?? "Continue",
            distanceM: step.distance,
            durationS: step.duration,
            type: step.maneuver?.type ?? "continue",
            modifier: step.maneuver?.modifier,
            lat: step.maneuver?.location?.[1] ?? 0,
            lng: step.maneuver?.location?.[0] ?? 0,
          })),
        );
        const distanceM = r.distance;
        const durationS = r.duration;
        const co2PerKm = profile === "driving" ? 0.12 : 0;
        const co2Kg = +(distanceM / 1000 * co2PerKm).toFixed(2);
        const savedCo2Kg = profile !== "driving" ? +(distanceM / 1000 * 0.12).toFixed(2) : 0;
        const creditsEarned = Math.max(1, Math.round(distanceM / 500));

        return {
          id: `route-${idx}`,
          profile,
          alternativeIndex: idx,
          distanceM,
          durationS,
          geometry: r.geometry.coordinates,
          maneuvers,
          traffic: "low",
          weight: r.weight ?? r.duration,
          measures: { greenScore: 0.5, shadeScore: 0.5, buildingDensity: 0.2 },
          scores: {
            fastest: durationS > 0 ? fastestDurationS / durationS : 1,
            eco: distanceM > 0 ? baselineDistanceM / distanceM : 1,
            scenic: 0.5,
            shade: 0.5,
            sun: 0.5,
            "battery-saver": distanceM > 0 ? baselineDistanceM / distanceM : 1,
          },
          bestFor: idx === 0 ? (["fastest", "eco"] as RoutePreference[]) : [],
          eco: { co2Kg, savedCo2Kg, creditsEarned, calories: Math.round(distanceM * 0.05), cleanAirIndex: 85 },
          label: idx === 0 ? "Fastest & Eco" : `Alternative ${idx + 1}`,
        } as VerdenRoute;
      });
    });
  },

  async isochrone(
    point: LngLat,
    minutes: number[],
    profile: TravelProfile = "walking",
  ): Promise<IsochroneContour[]> {
    const key = `iso:${profile}:${geoKey(point.lng, point.lat, 3)}:${minutes.join(",")}`;
    return cached(key, TTL.isochrone, async () => {
      const data = await post<{ features: Feature<Polygon | MultiPolygon>[] }>(
        "/api/map/isochrone",
        { lat: point.lat, lng: point.lng, minutes, profile },
      );
      return (data.features ?? []).map((polygon, i) => ({
        minutes: minutes[minutes.length - 1 - i] ?? minutes[i],
        polygon,
      }));
    });
  },
};

/** Pick the alternative that best serves a lens. */
export function routeForPreference(
  routes: VerdenRoute[],
  preference: RoutePreference,
): VerdenRoute | null {
  if (routes.length === 0) return null;
  return [...routes].sort((a, b) => b.scores[preference] - a.scores[preference])[0];
}

export function formatDurationShort(seconds: number) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function formatDistanceShort(meters: number) {
  if (meters < 950) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
