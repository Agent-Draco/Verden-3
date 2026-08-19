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
    const key = `search:${q.toLowerCase()}:${proximity ? geoKey(proximity.lng, proximity.lat, 2) : "any"}:${limit}`;
    return cached(key, TTL.search, async () => {
      const data = await post<{ places: VerdenPlace[] }>("/api/map/search", {
        query: q,
        proximity: proximity ?? undefined,
        limit,
      });
      return data.places ?? [];
    });
  },

  async reverse(point: LngLat): Promise<VerdenPlace> {
    const key = `reverse:${geoKey(point.lng, point.lat, 4)}`;
    return cached(key, TTL.reverse, async () => {
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
      const data = await post<{ routes: VerdenRoute[] }>("/api/map/directions", {
        origin: input.origin,
        destination: input.destination,
        waypoints: input.waypoints,
        profile: input.profile ?? "driving",
      });
      return data.routes ?? [];
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
