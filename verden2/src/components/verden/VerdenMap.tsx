/**
 * VerdenMap — Mapbox GL v3 (Standard style) canvas for the whole app.
 *
 * Browser-only: this module imports mapbox-gl at the top level and must be
 * loaded through MapCanvas, which gates it behind hydration.
 */

import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { FeatureCollection } from "geojson";
import { MODEL_MIN_ZOOM, VehicleModelLayer, type ModelEntity } from "./model-layer";
import { moodConfig, moodTerrainExaggeration } from "@/lib/map/moods";
import type { AlertKind, MapMood, VerdenPlace, VerdenRoute } from "@/lib/map/types";

export type ConvoyMember = ModelEntity & { name: string; status?: string };

export type MapAlertPin = {
  id: string;
  kind: AlertKind;
  lat: number;
  lng: number;
  note?: string | null;
};

export type VerdenMapProps = {
  mood?: MapMood;
  center?: { lat: number; lng: number } | null;
  zoom?: number;
  pitch?: number;
  followMode?: boolean;
  isNavigating?: boolean;
  self?: (ModelEntity & { name?: string }) | null;
  convoy?: ConvoyMember[];
  routes?: VerdenRoute[];
  selectedRouteId?: string | null;
  onSelectRoute?: (id: string) => void;
  places?: VerdenPlace[];
  alerts?: MapAlertPin[];
  destination?: { lat: number; lng: number; name?: string } | null;
  onMapClick?: (point: { lat: number; lng: number }) => void;
  onUserInteract?: () => void;
  onPlaceClick?: (place: VerdenPlace) => void;
  onMapReady?: (map: mapboxgl.Map) => void;
  className?: string;
};

const ROUTE_SOURCE = "verden-routes";
const PIN_SOURCE = "verden-vehicle-pins";
const PLACE_SOURCE = "verden-places";
const ALERT_SOURCE = "verden-alerts";
const DEST_SOURCE = "verden-destination";

const ALERT_EMOJI: Record<AlertKind, string> = {
  road_closed: "🚧",
  coffee_stop: "☕",
  danger: "⚠️",
  meet_here: "📍",
  lost_item: "🎒",
  fuel_stop: "⛽",
};

function emptyCollection(): FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

export default function VerdenMap({
  mood = "explorer",
  center,
  zoom = 16,
  pitch = 55,
  followMode = true,
  isNavigating = false,
  self = null,
  convoy = [],
  routes = [],
  selectedRouteId = null,
  onSelectRoute,
  places = [],
  alerts = [],
  destination = null,
  onMapClick,
  onUserInteract,
  onPlaceClick,
  onMapReady,
  className = "w-full h-full",
}: VerdenMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const modelLayerRef = useRef<VehicleModelLayer | null>(null);
  const readyRef = useRef(false);
  const programmaticRef = useRef(false);
  const callbacks = useRef({ onUserInteract, onMapClick, onSelectRoute, onPlaceClick, onMapReady });
  callbacks.current = { onUserInteract, onMapClick, onSelectRoute, onPlaceClick, onMapReady };

  const token = (import.meta.env["VITE_MAPBOX_ACCESS_TOKEN"] ||
    import.meta.env["VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN"]) as
    | string
    | undefined;

  const entities = useMemo<ModelEntity[]>(() => {
    const list: ModelEntity[] = [];
    if (self) list.push({ ...self, sizeM: self.sizeM ?? 4.8 });
    for (const member of convoy) list.push({ ...member, sizeM: member.sizeM ?? 4.4 });
    return list;
  }, [self, convoy]);

  /* ---------------------------------------------------------------- init */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!token) {
      console.error("Verden: Mapbox public token is not configured.");
      return;
    }
    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: center ? [center.lng, center.lat] : [10.7522, 59.9139],
      zoom,
      pitch,
      bearing: 0,
      antialias: true,
      attributionControl: true,
      cooperativeGestures: false,
    });
    mapRef.current = map;

    // Trigger initial resize
    map.on("load", () => {
      map.resize();
    });

    map.on("style.load", () => {
      map.resize();
      // 3D terrain + atmosphere.
      if (!map.getSource("mapbox-dem")) {
        map.addSource("mapbox-dem", {
          type: "raster-dem",
          url: "mapbox://mapbox.mapbox-terrain-dem-v1",
          tileSize: 512,
          maxzoom: 14,
        });
      }
      map.setTerrain({ source: "mapbox-dem", exaggeration: moodTerrainExaggeration(mood) });
      map.setFog({
        range: [0.5, 10],
        "horizon-blend": 0.25,
        color: "#dfeee6",
        "high-color": "#b8d8ff",
        "space-color": "#0b1a14",
        "star-intensity": 0.15,
      });

      applyMood(map, mood);
      addDataLayers(map);
      readyRef.current = true;

      const layer = new VehicleModelLayer(mapboxgl.MercatorCoordinate);
      modelLayerRef.current = layer;
      map.addLayer(layer);

      callbacks.current.onMapReady?.(map);
    });

    // Resize observer to ensure map canvas adjusts to container dimensions
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const flagUser = () => {
      if (!programmaticRef.current) callbacks.current.onUserInteract?.();
    };
    map.on("dragstart", flagUser);
    map.on("zoomstart", flagUser);
    map.on("rotatestart", flagUser);

    map.on("click", (event) => {
      const features = map.queryRenderedFeatures(event.point, {
        layers: ["verden-route-line", "verden-place-circle"],
      });
      const routeFeature = features.find((f) => f.layer?.id === "verden-route-line");
      if (routeFeature?.properties?.["id"]) {
        callbacks.current.onSelectRoute?.(String(routeFeature.properties["id"]));
        return;
      }
      const placeFeature = features.find((f) => f.layer?.id === "verden-place-circle");
      if (placeFeature?.properties?.["payload"]) {
        try {
          callbacks.current.onPlaceClick?.(
            JSON.parse(String(placeFeature.properties["payload"])) as VerdenPlace,
          );
          return;
        } catch {
          /* ignore malformed payload */
        }
      }
      callbacks.current.onMapClick?.({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    });

    return () => {
      resizeObserver.disconnect();
      readyRef.current = false;
      modelLayerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  /* ---------------------------------------------------------------- mood */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    applyMood(map, mood);
    map.setTerrain({ source: "mapbox-dem", exaggeration: moodTerrainExaggeration(mood) });
  }, [mood]);

  /* -------------------------------------------------------------- routes */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const source = map.getSource(ROUTE_SOURCE) as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;
    source.setData({
      type: "FeatureCollection",
      features: routes.map((route) => ({
        type: "Feature",
        id: route.alternativeIndex,
        properties: {
          id: route.id,
          selected: route.id === selectedRouteId ? 1 : 0,
          label: route.label,
        },
        geometry: { type: "LineString", coordinates: route.geometry },
      })),
    });
  }, [routes, selectedRouteId]);

  /* ------------------------------------------------------ vehicles + pins */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    modelLayerRef.current?.setEntities(entities);
    const source = map.getSource(PIN_SOURCE) as mapboxgl.GeoJSONSource | undefined;
    source?.setData({
      type: "FeatureCollection",
      features: entities.map((entity) => ({
        type: "Feature",
        properties: { id: entity.id, isSelf: self?.id === entity.id ? 1 : 0 },
        geometry: { type: "Point", coordinates: [entity.lng, entity.lat] },
      })),
    });
  }, [entities, self]);

  /* -------------------------------------------------- places / alerts / dest */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    (map.getSource(PLACE_SOURCE) as mapboxgl.GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: places.map((place) => ({
        type: "Feature",
        properties: { name: place.name, payload: JSON.stringify(place) },
        geometry: { type: "Point", coordinates: [place.lng, place.lat] },
      })),
    });
    (map.getSource(ALERT_SOURCE) as mapboxgl.GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features: alerts.map((alert) => ({
        type: "Feature",
        properties: { emoji: ALERT_EMOJI[alert.kind] ?? "📍", note: alert.note ?? "" },
        geometry: { type: "Point", coordinates: [alert.lng, alert.lat] },
      })),
    });
    (map.getSource(DEST_SOURCE) as mapboxgl.GeoJSONSource | undefined)?.setData(
      destination
        ? {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: { name: destination.name ?? "Destination" },
                geometry: { type: "Point", coordinates: [destination.lng, destination.lat] },
              },
            ],
          }
        : emptyCollection(),
    );
  }, [places, alerts, destination]);

  /* ---------------------------------------------------------- follow mode */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !self) return;
    if (!followMode) return;
    programmaticRef.current = true;
    map.easeTo({
      center: [self.lng, self.lat],
      zoom: isNavigating ? Math.max(map.getZoom(), 16.8) : map.getZoom(),
      bearing: isNavigating ? self.heading : map.getBearing(),
      pitch: isNavigating ? 60 : map.getPitch(),
      duration: 700,
      essential: true,
    });
    const timer = window.setTimeout(() => {
      programmaticRef.current = false;
    }, 800);
    return () => window.clearTimeout(timer);
  }, [self, followMode, isNavigating]);

  /* ------------------------------------------------------ external center */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !center || followMode) return;
    programmaticRef.current = true;
    map.easeTo({ center: [center.lng, center.lat], duration: 600 });
    const timer = window.setTimeout(() => {
      programmaticRef.current = false;
    }, 700);
    return () => window.clearTimeout(timer);
  }, [center, followMode]);

  return (
    <div className={`${className} relative w-full h-full`}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      {!token && (
        <div className="absolute inset-0 grid place-items-center bg-secondary text-sm text-muted-foreground">
          Map unavailable — Mapbox token missing.
        </div>
      )}
    </div>
  );
}

/** Mapbox Standard exposes mood-relevant switches through style config. */
function applyMood(map: mapboxgl.Map, mood: MapMood) {
  const config = moodConfig(mood);
  const set = (key: string, value: unknown) => {
    try {
      map.setConfigProperty("basemap", key, value);
    } catch {
      /* older style versions ignore unknown config keys */
    }
  };
  set("lightPreset", config.lightPreset);
  set("showPlaceLabels", config.showPlaceLabels);
  set("showPointOfInterestLabels", config.showPointOfInterestLabels);
  set("show3dObjects", config.show3dObjects);
  set("theme", config.theme);
}

function addDataLayers(map: mapboxgl.Map) {
  const sources = [ROUTE_SOURCE, PIN_SOURCE, PLACE_SOURCE, ALERT_SOURCE, DEST_SOURCE];
  for (const id of sources) {
    if (!map.getSource(id)) map.addSource(id, { type: "geojson", data: emptyCollection() });
  }

  map.addLayer({
    id: "verden-route-casing",
    type: "line",
    source: ROUTE_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#062b1c",
      "line-opacity": 0.55,
      "line-width": ["case", ["==", ["get", "selected"], 1], 13, 8],
    },
  });

  map.addLayer({
    id: "verden-route-line",
    type: "line",
    source: ROUTE_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": ["case", ["==", ["get", "selected"], 1], "#22c55e", "#94a3b8"],
      "line-opacity": ["case", ["==", ["get", "selected"], 1], 1, 0.6],
      "line-width": ["case", ["==", ["get", "selected"], 1], 8, 4.5],
    },
  });

  // Light vector fallback for the vehicle puck below the model zoom threshold.
  map.addLayer({
    id: "verden-vehicle-pins",
    type: "circle",
    source: PIN_SOURCE,
    maxzoom: MODEL_MIN_ZOOM,
    paint: {
      "circle-radius": ["case", ["==", ["get", "isSelf"], 1], 9, 7],
      "circle-color": ["case", ["==", ["get", "isSelf"], 1], "#22c55e", "#38bdf8"],
      "circle-stroke-width": 2.5,
      "circle-stroke-color": "#ffffff",
    },
  });

  map.addLayer({
    id: "verden-place-circle",
    type: "circle",
    source: PLACE_SOURCE,
    paint: {
      "circle-radius": 7,
      "circle-color": "#0ea5e9",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  });

  map.addLayer({
    id: "verden-place-label",
    type: "symbol",
    source: PLACE_SOURCE,
    minzoom: 13,
    layout: {
      "text-field": ["get", "name"],
      "text-size": 12,
      "text-offset": [0, 1.3],
      "text-anchor": "top",
    },
    paint: { "text-color": "#0f172a", "text-halo-color": "#ffffff", "text-halo-width": 1.4 },
  });

  map.addLayer({
    id: "verden-alert-label",
    type: "symbol",
    source: ALERT_SOURCE,
    layout: { "text-field": ["get", "emoji"], "text-size": 22, "text-allow-overlap": true },
  });

  map.addLayer({
    id: "verden-destination",
    type: "circle",
    source: DEST_SOURCE,
    paint: {
      "circle-radius": 10,
      "circle-color": "#f97316",
      "circle-stroke-width": 3,
      "circle-stroke-color": "#ffffff",
    },
  });
}
