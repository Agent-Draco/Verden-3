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

export interface MapboxNavPluginInterface {
  startNavigation(options: NavigationOptions): Promise<{ success: boolean; message?: string }>;
  stopNavigation(): Promise<{ success: boolean }>;
}

const MapboxNav = registerPlugin<MapboxNavPluginInterface>("MapboxNav");

export class MapboxBridge {
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
