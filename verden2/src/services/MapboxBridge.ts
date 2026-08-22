import { registerPlugin } from "@capacitor/core";

export interface RouteCoordinates {
  latitude: number;
  longitude: number;
}

export interface NavigationOptions {
  origin: RouteCoordinates;
  destination: RouteCoordinates;
  waypoints?: RouteCoordinates[];
  profile?: "driving" | "walking" | "cycling";
  tripId?: string;
}

export interface SearchSuggestionResult {
  id?: string;
  name: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface MapboxNavPluginInterface {
  startNavigation(options: NavigationOptions): Promise<{ success: boolean; message?: string }>;
  stopNavigation(): Promise<{ success: boolean }>;
  searchPlaces(options: { query: string; latitude?: number; longitude?: number }): Promise<{ results: SearchSuggestionResult[] }>;
}

const MapboxNav = registerPlugin<MapboxNavPluginInterface>("MapboxNav");

export class MapboxBridge {
  static async searchPlaces(query: string, latitude?: number, longitude?: number): Promise<SearchSuggestionResult[]> {
    try {
      const res = await MapboxNav.searchPlaces({ query, latitude, longitude });
      return res?.results ?? [];
    } catch (error) {
      console.error("Failed to execute native searchPlaces:", error);
      return [];
    }
  }

  static async startDrivingSession(options: NavigationOptions): Promise<boolean> {
    try {
      const result = await MapboxNav.startNavigation(options);
      return result.success;
    } catch (error) {
      console.error("Failed to launch Native Mapbox Navigation:", error);
      return false;
    }
  }

  static async exitDrivingSession(): Promise<boolean> {
    try {
      const result = await MapboxNav.stopNavigation();
      return result.success;
    } catch (error) {
      console.error("Failed to stop Navigation:", error);
      return false;
    }
  }
}
