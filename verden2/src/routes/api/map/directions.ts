import { createFileRoute } from "@tanstack/react-router";
import { MapboxError, clampNumber, jsonError, mapboxGet } from "@/lib/map/mapbox-gateway.server";
import { computeEco, ecoLabel } from "@/lib/map/eco";
import { bearing, shadeScore, sunPosition } from "@/lib/map/solar";
import type { RoutePreference, RouteScores, TravelProfile, VerdenRoute } from "@/lib/map/types";

const PROFILES: TravelProfile[] = ["driving", "walking", "cycling"];
const PREFERENCES: RoutePreference[] = [
  "fastest",
  "eco",
  "scenic",
  "shade",
  "sun",
  "battery-saver",
];

type MapboxRoute = {
  distance: number;
  duration: number;
  weight: number;
  geometry: { coordinates: [number, number][] };
  legs?: Array<{
    annotation?: { congestion?: string[] };
    steps?: Array<{
      distance: number;
      duration: number;
      maneuver?: {
        instruction?: string;
        type?: string;
        modifier?: string;
        location?: [number, number];
      };
    }>;
  }>;
};

type DirectionsResponse = { routes?: MapboxRoute[] };

/** Sampled landcover/building signal, memoised per worker to cut API requests. */
const terrainMemo = new Map<string, { green: number; buildings: number }>();

async function sampleTerrain(lng: number, lat: number) {
  const key = `${lng.toFixed(3)},${lat.toFixed(3)}`;
  const cached = terrainMemo.get(key);
  if (cached) return cached;
  try {
    const data = await mapboxGet<{
      features?: Array<{ properties?: Record<string, unknown> }>;
    }>(`/v4/mapbox.mapbox-streets-v8/tilequery/${lng},${lat}.json`, {
      radius: 140,
      limit: 30,
      layers: "landuse,water,building",
      dedupe: true,
    });
    const features = data.features ?? [];
    let green = 0;
    let buildings = 0;
    for (const f of features) {
      const props = (f.properties ?? {}) as Record<string, unknown>;
      const layer = (props["tilequery"] as { layer?: string } | undefined)?.layer;
      const cls = String(props["class"] ?? "");
      if (layer === "water" || cls === "water") green += 1;
      if (["park", "wood", "grass", "scrub", "national_park", "pitch", "cemetery"].includes(cls)) {
        green += 1;
      }
      if (layer === "building") buildings += 1;
    }
    const result = { green: Math.min(1, green / 6), buildings: Math.min(1, buildings / 12) };
    terrainMemo.set(key, result);
    if (terrainMemo.size > 800) terrainMemo.clear();
    return result;
  } catch {
    return { green: 0, buildings: 0.3 };
  }
}

function sampleIndexes(length: number, count: number) {
  if (length <= count) return Array.from({ length }, (_, i) => i);
  return Array.from({ length: count }, (_, i) => Math.floor(((i + 0.5) / count) * length));
}

function aggregateTraffic(congestion?: string[]): VerdenRoute["traffic"] {
  if (!congestion || congestion.length === 0) return "unknown";
  const heavy = congestion.filter((c) => c === "heavy" || c === "severe").length;
  const moderate = congestion.filter((c) => c === "moderate").length;
  if (heavy / congestion.length > 0.15) return "heavy";
  if ((heavy + moderate) / congestion.length > 0.25) return "moderate";
  return "low";
}

/** Higher is better. Normalised against the best value across alternatives. */
function invRatio(value: number, best: number) {
  if (!Number.isFinite(value) || value <= 0 || best <= 0) return 0;
  return Math.max(0, Math.min(1, best / value));
}

export const Route = createFileRoute("/api/map/directions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            origin?: { lat: number; lng: number };
            destination?: { lat: number; lng: number };
            waypoints?: Array<{ lat: number; lng: number }>;
            profile?: TravelProfile;
            preferences?: RoutePreference[];
          };

          const oLat = clampNumber(body.origin?.lat, -90, 90);
          const oLng = clampNumber(body.origin?.lng, -180, 180);
          const dLat = clampNumber(body.destination?.lat, -90, 90);
          const dLng = clampNumber(body.destination?.lng, -180, 180);
          if (oLat === null || oLng === null || dLat === null || dLng === null) {
            return jsonError(400, "A valid start and destination are required.");
          }

          const profile: TravelProfile = PROFILES.includes(body.profile as TravelProfile)
            ? (body.profile as TravelProfile)
            : "driving";

          const waypoints = (body.waypoints ?? [])
            .slice(0, 10)
            .filter(
              (w) => clampNumber(w.lat, -90, 90) !== null && clampNumber(w.lng, -180, 180) !== null,
            );

          const coords = [
            `${oLng},${oLat}`,
            ...waypoints.map((w) => `${w.lng},${w.lat}`),
            `${dLng},${dLat}`,
          ].join(";");

          const data = await mapboxGet<DirectionsResponse>(
            `/directions/v5/mapbox/${profile === "driving" ? "driving-traffic" : profile}/${coords}`,
            {
              alternatives: true,
              geometries: "geojson",
              overview: "full",
              steps: true,
              annotations:
                profile === "driving" ? "duration,distance,congestion" : "duration,distance",
              language: "en",
            },
          );

          const raw = (data.routes ?? []).slice(0, 3);
          if (raw.length === 0) return jsonError(404, "No route could be found for that trip.");

          const baselineDistanceM = Math.min(...raw.map((r) => r.distance));
          const fastestDurationS = Math.min(...raw.map((r) => r.duration));
          const sun = sunPosition(new Date(), oLat, oLng);

          // Measure every Mapbox alternative on its own merits.
          const measured = await Promise.all(
            raw.map(async (route, index) => {
              const line = route.geometry.coordinates;
              const indexes = sampleIndexes(line.length, 5);
              const samples = await Promise.all(
                indexes.map((i) => sampleTerrain(line[i][0], line[i][1])),
              );
              const green = samples.reduce((s, x) => s + x.green, 0) / Math.max(1, samples.length);
              const buildings =
                samples.reduce((s, x) => s + x.buildings, 0) / Math.max(1, samples.length);
              const shade =
                indexes.reduce((sum, i) => {
                  const next = line[Math.min(i + 1, line.length - 1)];
                  return sum + shadeScore(bearing(line[i], next), sun, buildings);
                }, 0) / Math.max(1, indexes.length);
              return { route, index, green, buildings, shade };
            }),
          );

          const routes: VerdenRoute[] = measured.map(
            ({ route, index, green, buildings, shade }) => {
              const eco = computeEco({
                distanceM: route.distance,
                durationS: route.duration,
                profile,
                preference: "eco",
                greenScore: green,
                baselineDistanceM,
              });

              // Stop-and-go traffic is the main battery/fuel penalty.
              const traffic = aggregateTraffic(route.legs?.[0]?.annotation?.congestion);
              const trafficPenalty =
                traffic === "heavy" ? 0.35 : traffic === "moderate" ? 0.15 : 0;

              const scores: RouteScores = {
                fastest: invRatio(route.duration, fastestDurationS),
                eco: invRatio(route.distance, baselineDistanceM) * (1 - trafficPenalty * 0.5),
                scenic: green,
                shade,
                sun: 1 - shade,
                "battery-saver":
                  invRatio(route.distance, baselineDistanceM) * (1 - trafficPenalty),
              };

              const maneuvers = (route.legs ?? []).flatMap((leg) =>
                (leg.steps ?? []).map((step) => ({
                  instruction: step.maneuver?.instruction ?? "Continue",
                  distanceM: step.distance,
                  durationS: step.duration,
                  type: step.maneuver?.type ?? "continue",
                  modifier: step.maneuver?.modifier,
                  lat: step.maneuver?.location?.[1] ?? 0,
                  lng: step.maneuver?.location?.[0] ?? 0,
                })),
              );

              return {
                id: `alt-${index}`,
                profile,
                alternativeIndex: index,
                distanceM: route.distance,
                durationS: route.duration,
                geometry: route.geometry.coordinates,
                maneuvers,
                traffic,
                weight: route.weight,
                measures: { greenScore: green, shadeScore: shade, buildingDensity: buildings },
                scores,
                bestFor: [],
                eco,
                label: index === 0 ? "Mapbox recommended" : `Alternative ${index + 1}`,
              } satisfies VerdenRoute;
            },
          );

          // Award each lens to the alternative that actually wins it.
          for (const preference of PREFERENCES) {
            let winner = routes[0];
            for (const r of routes) {
              if (r.scores[preference] > winner.scores[preference]) winner = r;
            }
            winner.bestFor.push(preference);
          }
          for (const r of routes) {
            if (r.bestFor.length > 0) r.label = ecoLabel(r.bestFor[0]);
          }

          return Response.json({ routes, sun, profile });
        } catch (error) {
          if (error instanceof MapboxError) {
            return jsonError(error.status, "Routing is temporarily unavailable. Please try again.");
          }
          console.error("map/directions failed", error);
          return jsonError(500, "The route could not be calculated.");
        }
      },
    },
  },
});
