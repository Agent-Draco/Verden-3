/**
 * Map Moods. Each mood is expressed purely through Mapbox Standard style
 * configuration plus Verden route colours, so the base style never changes.
 */

import type { MapMood } from "./types";

export type MoodConfig = {
  id: MapMood;
  name: string;
  description: string;
  emoji: string;
  /** Mapbox Standard `lightPreset` config property. */
  lightPreset: "dawn" | "day" | "dusk" | "night";
  showPlaceLabels: boolean;
  showPointOfInterestLabels: boolean;
  show3dObjects: boolean;
  theme: "default" | "faded" | "monochrome";
};

export const MAP_MOODS: MoodConfig[] = [
  {
    id: "explorer",
    name: "Explorer",
    description: "Balanced daylight with full labels — the Verden default.",
    emoji: "🧭",
    lightPreset: "day",
    showPlaceLabels: true,
    showPointOfInterestLabels: true,
    show3dObjects: true,
    theme: "default",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Night city, neon routes, glowing buildings.",
    emoji: "🌃",
    lightPreset: "night",
    showPlaceLabels: true,
    showPointOfInterestLabels: false,
    show3dObjects: true,
    theme: "monochrome",
  },
  {
    id: "vintage",
    name: "Vintage",
    description: "Warm dusk light with a faded, paper-map palette.",
    emoji: "📜",
    lightPreset: "dusk",
    showPlaceLabels: true,
    showPointOfInterestLabels: true,
    show3dObjects: true,
    theme: "faded",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Quiet map, no clutter, routes front and centre.",
    emoji: "◻️",
    lightPreset: "day",
    showPlaceLabels: false,
    showPointOfInterestLabels: false,
    show3dObjects: false,
    theme: "monochrome",
  },
  {
    id: "adventure",
    name: "Adventure",
    description: "Golden dawn light, terrain exaggerated for the outdoors.",
    emoji: "🏔️",
    lightPreset: "dawn",
    showPlaceLabels: true,
    showPointOfInterestLabels: true,
    show3dObjects: true,
    theme: "default",
  },
];

export function moodConfig(mood: MapMood): MoodConfig {
  return MAP_MOODS.find((m) => m.id === mood) ?? MAP_MOODS[0];
}

/** Terrain exaggeration per mood — adventure leans into relief. */
export function moodTerrainExaggeration(mood: MapMood) {
  return mood === "adventure" ? 1.5 : mood === "minimal" ? 0 : 1;
}
