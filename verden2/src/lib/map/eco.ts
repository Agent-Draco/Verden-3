/**
 * EcoMoov impact model. Shared by navigation, routing APIs and trip logging so
 * every surface reports identical numbers.
 */

import type { RoutePreference, TravelProfile } from "./types";

/** kg CO2 per km. */
export const EMISSION_FACTORS: Record<TravelProfile, number> = {
  driving: 0.171,
  cycling: 0,
  walking: 0,
};

export type EcoInput = {
  distanceM: number;
  durationS: number;
  profile: TravelProfile;
  preference: RoutePreference;
  /** 0..1 share of the route adjacent to greenery. */
  greenScore?: number;
  /** Distance of the fastest driving alternative, for savings comparison. */
  baselineDistanceM?: number;
};

export type EcoResult = {
  co2Kg: number;
  savedCo2Kg: number;
  greenScore: number;
  creditsEarned: number;
};

export function computeEco(input: EcoInput): EcoResult {
  const km = input.distanceM / 1000;
  const baselineKm = (input.baselineDistanceM ?? input.distanceM) / 1000;
  const factor = EMISSION_FACTORS[input.profile];

  // Eco preference assumes smoother speed profiles, worth ~8% less fuel burn.
  const preferenceModifier = input.preference === "eco" ? 0.92 : 1;
  const co2Kg = km * factor * preferenceModifier;
  const baselineCo2 = baselineKm * EMISSION_FACTORS.driving;
  const savedCo2Kg = Math.max(0, baselineCo2 - co2Kg);

  const greenScore = clamp01(input.greenScore ?? 0);
  const credits = Math.round(savedCo2Kg * 10 + greenScore * 5 + (factor === 0 ? km * 2 : 0));

  return {
    co2Kg: round(co2Kg, 3),
    savedCo2Kg: round(savedCo2Kg, 3),
    greenScore: round(greenScore, 3),
    creditsEarned: Math.max(0, credits),
  };
}

export function ecoLabel(preference: RoutePreference): string {
  switch (preference) {
    case "eco":
      return "Lowest emissions";
    case "scenic":
      return "Scenic";
    case "shade":
      return "In the shade";
    case "sun":
      return "In the sun";
    case "battery-saver":
      return "Battery saver";
    default:
      return "Fastest";
  }
}

export function formatDuration(seconds: number) {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  return `${h} h ${mins % 60} min`;
}

export function formatDistance(meters: number) {
  if (meters < 950) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function round(n: number, digits: number) {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}