/**
 * Shared map domain types. UI components consume these — never raw Mapbox
 * response shapes — so the provider stays swappable behind MapService.
 */

import type { Feature, MultiPolygon, Polygon } from "geojson";

export type LngLat = { lng: number; lat: number };

/** Travel profiles. Additional profiles can be added without refactoring. */
export type TravelProfile = "driving" | "walking" | "cycling";

export type RoutePreference =
  | "fastest"
  | "eco"
  | "scenic"
  | "shade"
  | "sun"
  | "battery-saver";

export type PlaceCategory =
  | "restaurant"
  | "cafe"
  | "hotel"
  | "parking"
  | "attraction"
  | "park"
  | "ev_charging"
  | "toilet"
  | "drinking_water"
  | "bicycle_parking"
  | "defibrillator"
  | "playground"
  | "museum"
  | "zoo"
  | "ice_cream"
  | "skate_park";

export type VerdenPlace = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  categories: string[];
  maki?: string;
  distanceM?: number;
  metadata: {
    openHours?: string;
    openNow?: boolean | null;
    phone?: string;
    website?: string;
    wheelchairAccessible?: boolean | null;
    wifi?: boolean | null;
    popularity?: number | null;
    rating?: number | null;
    priceLevel?: string | null;
  };
};

export type RouteManeuver = {
  instruction: string;
  distanceM: number;
  durationS: number;
  type: string;
  modifier?: string;
  lat: number;
  lng: number;
};

/**
 * Normalised 0..1 desirability of one Mapbox alternative for each Verden lens.
 * Every alternative is measured independently — alternatives are never collapsed
 * into a single "route per preference".
 */
export type RouteScores = Record<RoutePreference, number>;

export type VerdenRoute = {
  id: string;
  profile: TravelProfile;
  /** Index of this alternative in the Mapbox response (0 = Mapbox primary). */
  alternativeIndex: number;
  distanceM: number;
  durationS: number;
  /** GeoJSON LineString coordinates ([lng, lat][]) for native route rendering. */
  geometry: [number, number][];
  maneuvers: RouteManeuver[];
  /** Aggregated congestion label when Mapbox supplies traffic annotations. */
  traffic?: "low" | "moderate" | "heavy" | "unknown";
  weight: number;
  /** Raw environmental measurements sampled along this alternative. */
  measures: {
    greenScore: number;
    shadeScore: number;
    buildingDensity: number;
  };
  scores: RouteScores;
  /** Lenses this alternative wins outright. */
  bestFor: RoutePreference[];
  eco: {
    co2Kg: number;
    savedCo2Kg: number;
    greenScore: number;
    creditsEarned: number;
  };
  label: string;
};

export type IsochroneContour = {
  minutes: number;
  polygon: Feature<Polygon | MultiPolygon>;
};

export type MapMood = "explorer" | "cyberpunk" | "vintage" | "minimal" | "adventure";

export type ExperienceMode = "kid" | "teen" | "adult";

export type ActivityStatus =
  | "driving"
  | "walking"
  | "cycling"
  | "waiting"
  | "shopping"
  | "coffee"
  | "hotel"
  | "stopped";

export type AlertKind =
  | "road_closed"
  | "coffee_stop"
  | "danger"
  | "meet_here"
  | "lost_item"
  | "fuel_stop";