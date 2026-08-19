import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bike,
  Car,
  Crown,
  Footprints,
  Leaf,
  LocateFixed,
  Navigation2,
  Search,
  SunMedium,
  TreePine,
  Volume2,
  VolumeX,
  X,
  Zap,
  CloudSun,
  Gauge,
  CheckCircle2,
  Loader2,
  Settings,
  Route as RouteIcon,
  Users,
  User,
  Home,
} from "lucide-react";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import MapCanvas from "@/components/verden/MapCanvas";
import { MapboxBridge } from "@/services/MapboxBridge";
import { supabase } from "@/integrations/supabase/client";
import { usePlan, PLAN_LABEL } from "@/hooks/usePlan";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useGarage } from "@/hooks/useGarage";
import {
  MapService,
  formatDistanceShort,
  formatDurationShort,
  routeForPreference,
} from "@/lib/map/service";
import type { RoutePreference, TravelProfile, VerdenPlace, VerdenRoute } from "@/lib/map/types";

export type ScreenType =
  | "map"
  | "settings"
  | "trips"
  | "convoy"
  | "home"
  | "profile"
  | "ecomoov"
  | "auth"
  | "privacy"
  | "saved";

interface MapViewProps {
  onOpenScreen: (screen: ScreenType) => void;
  activeScreen?: ScreenType;
}

type LngLat = { lat: number; lng: number };

const LENSES: Array<{
  id: RoutePreference;
  label: string;
  icon: typeof Leaf;
  hint: string;
}> = [
  { id: "fastest", label: "Fastest", icon: Zap, hint: "Lowest travel time" },
  { id: "eco", label: "EcoMoov", icon: Leaf, hint: "Lowest emissions" },
  { id: "scenic", label: "Scenic", icon: TreePine, hint: "Most greenery & water" },
  { id: "shade", label: "Shade", icon: CloudSun, hint: "Coolest, most shaded" },
  { id: "sun", label: "Sun", icon: SunMedium, hint: "Brightest ride" },
  { id: "battery-saver", label: "Battery saver", icon: Gauge, hint: "Least stop-and-go" },
];

const PROFILE_OPTIONS: Array<{ id: TravelProfile; label: string; icon: typeof Car }> = [
  { id: "driving", label: "Drive", icon: Car },
  { id: "cycling", label: "Cycle", icon: Bike },
  { id: "walking", label: "Walk", icon: Footprints },
];

function metresBetween(a: LngLat, b: LngLat) {
  const R = 6371e3;
  const p1 = (a.lat * Math.PI) / 180;
  const p2 = (b.lat * Math.PI) / 180;
  const dp = p2 - p1;
  const dl = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function bearingBetween(a: LngLat, b: LngLat) {
  const dl = ((b.lng - a.lng) * Math.PI) / 180;
  const l1 = (a.lat * Math.PI) / 180;
  const l2 = (b.lat * Math.PI) / 180;
  const y = Math.sin(dl) * Math.cos(l2);
  const x = Math.cos(l1) * Math.sin(l2) - Math.sin(l1) * Math.cos(l2) * Math.cos(dl);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export default function MapView({ onOpenScreen, activeScreen = "map" }: MapViewProps) {
  const plan = usePlan();
  const { settings } = useUserSettings();
  const garage = useGarage();

  const [profile, setProfile] = useState<TravelProfile>("driving");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VerdenPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [origin, setOrigin] = useState<LngLat | null>(null);
  const [destination, setDestination] = useState<VerdenPlace | null>(null);
  const [routes, setRoutes] = useState<VerdenRoute[]>([]);
  const [lens, setLens] = useState<RoutePreference>("eco");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  const [isNavigating, setIsNavigating] = useState(false);
  const [followMode, setFollowMode] = useState(true);
  const [userLocation, setUserLocation] = useState<LngLat | null>(null);
  const [heading, setHeading] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [remainingM, setRemainingM] = useState(0);
  const [remainingS, setRemainingS] = useState(0);
  const [muted, setMuted] = useState(false);
  const [arrival, setArrival] = useState<{ savedCo2: number; credits: number } | null>(null);
  const [savingTrip, setSavingTrip] = useState(false);

  const watchRef = useRef<number | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const announcedRef = useRef(-1);
  const navStateRef = useRef({ isNavigating: false, routeId: null as string | null });

  const mood = plan.moods ? settings.mapMood : "explorer";
  const kidMode = settings.experienceMode === "kid";

  const allowedLenses = useMemo(
    () => LENSES.filter((l) => plan.allowedRouteTypes.includes(l.id)),
    [plan.allowedRouteTypes],
  );

  useEffect(() => {
    if (!plan.loading && !plan.allowedRouteTypes.includes(lens)) {
      setLens(plan.allowedRouteTypes[0] ?? "fastest");
    }
  }, [plan.loading, plan.allowedRouteTypes, lens]);

  /* -------------------------------------------------------- initial fix */
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOrigin(coords);
        setUserLocation(coords);
      },
      () => {
        toast.info("Using a default start point — enable location for accurate routing.");
        const fallback = { lat: 59.9139, lng: 10.7522 };
        setOrigin(fallback);
        setUserLocation(fallback);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }, []);

  /* ------------------------------------------------------------- search */
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        setResults(await MapService.search(query, origin));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Search failed.");
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, origin]);

  /* ----------------------------------------------------------- routing */
  const selectedRoute = useMemo(
    () => routes.find((r) => r.id === selectedRouteId) ?? null,
    [routes, selectedRouteId],
  );

  const lensWinner = useMemo(() => routeForPreference(routes, lens), [routes, lens]);

  useEffect(() => {
    if (lensWinner) setSelectedRouteId(lensWinner.id);
  }, [lensWinner]);

  const calculate = useCallback(
    async (target: VerdenPlace) => {
      if (!origin) {
        toast.error("Your start location isn't ready yet.");
        return;
      }
      setCalculating(true);
      try {
        const found = await MapService.directions({
          origin,
          destination: { lat: target.lat, lng: target.lng },
          profile,
        });
        setRoutes(found);
        const winner = routeForPreference(found, lens);
        setSelectedRouteId(winner?.id ?? found[0]?.id ?? null);
        toast.success(
          `${found.length} route${found.length === 1 ? "" : "s"} scored on Verden metrics.`,
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Routing failed.");
      } finally {
        setCalculating(false);
      }
    },
    [origin, profile, lens],
  );

  function pickPlace(place: VerdenPlace) {
    setDestination(place);
    setQuery(place.name);
    setResults([]);
    setRoutes([]);
    setSelectedRouteId(null);
    void calculate(place);
  }

  /* -------------------------------------------------------- navigation */
  const geometry = selectedRoute?.geometry ?? [];

  const cumulativeToEnd = useMemo(() => {
    if (geometry.length === 0) return [];
    const out = new Array<number>(geometry.length).fill(0);
    let total = 0;
    for (let i = geometry.length - 2; i >= 0; i--) {
      total += metresBetween(
        { lng: geometry[i][0], lat: geometry[i][1] },
        { lng: geometry[i + 1][0], lat: geometry[i + 1][1] },
      );
      out[i] = total;
    }
    return out;
  }, [geometry]);

  const finishTrip = useCallback(async () => {
    const route = selectedRoute;
    if (!route || !destination) return;
    stopNavigation();
    setSavingTrip(true);
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (uid) {
      const { error } = await supabase.from("trips").insert({
        user_id: uid,
        origin_label: "Current location",
        destination_label: destination.name,
        origin_lat: origin?.lat ?? route.geometry[0][1],
        origin_lng: origin?.lng ?? route.geometry[0][0],
        dest_lat: destination.lat,
        dest_lng: destination.lng,
        distance_km: +(route.distanceM / 1000).toFixed(2),
        duration_min: +(route.durationS / 60).toFixed(1),
        co2_kg: route.eco.co2Kg,
        transport_mode: profile === "driving" ? "car" : profile,
        travel_profile: profile,
        route_type: lens,
        credits_earned: route.eco.creditsEarned,
        greenery_score: route.measures.greenScore,
      });
      if (error) {
        toast.error("Trip finished, but it could not be saved.");
      } else {
        const { data: prof } = await supabase
          .from("profiles")
          .select("credits,total_co2_saved")
          .eq("id", uid)
          .maybeSingle();
        await supabase
          .from("profiles")
          .update({
            credits: (prof?.credits ?? 0) + route.eco.creditsEarned,
            total_co2_saved: Number(prof?.total_co2_saved ?? 0) + route.eco.savedCo2Kg,
          })
          .eq("id", uid);
      }
    }
    setSavingTrip(false);
    setArrival({ savedCo2: route.eco.savedCo2Kg, credits: route.eco.creditsEarned });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoute, destination, origin, profile, lens]);

  const onPosition = useCallback(
    (pos: GeolocationPosition) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(coords);
      if (pos.coords.speed !== null) setSpeedKmh(Math.max(0, Math.round(pos.coords.speed * 3.6)));

      const route = selectedRoute;
      if (!route || geometry.length === 0) return;

      let closest = 0;
      let best = Infinity;
      for (let i = 0; i < geometry.length; i++) {
        const d = metresBetween(coords, { lng: geometry[i][0], lat: geometry[i][1] });
        if (d < best) {
          best = d;
          closest = i;
        }
      }

      if (pos.coords.heading !== null && !Number.isNaN(pos.coords.heading)) {
        setHeading(pos.coords.heading);
      } else if (closest < geometry.length - 1) {
        setHeading(
          bearingBetween(coords, {
            lng: geometry[closest + 1][0],
            lat: geometry[closest + 1][1],
          }),
        );
      }

      const remaining = cumulativeToEnd[closest] ?? 0;
      setRemainingM(remaining);
      setRemainingS(
        Math.round(route.durationS * (route.distanceM > 0 ? remaining / route.distanceM : 0)),
      );

      let nextStep = 0;
      let bestStep = Infinity;
      route.maneuvers.forEach((m, i) => {
        const d = metresBetween(coords, { lat: m.lat, lng: m.lng });
        if (d < bestStep) {
          bestStep = d;
          nextStep = i;
        }
      });
      setStepIndex((prev) => (nextStep > prev ? nextStep : prev));

      const step = route.maneuvers[nextStep];
      if (
        step &&
        nextStep !== announcedRef.current &&
        !muted &&
        plan.voiceGuidance &&
        settings.voiceGuidance &&
        typeof window !== "undefined" &&
        window.speechSynthesis
      ) {
        announcedRef.current = nextStep;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(step.instruction));
      }

      const end = geometry[geometry.length - 1];
      if (end && metresBetween(coords, { lng: end[0], lat: end[1] }) < 40) {
        void finishTrip();
      }
    },
    [
      selectedRoute,
      geometry,
      cumulativeToEnd,
      muted,
      plan.voiceGuidance,
      settings.voiceGuidance,
      finishTrip,
    ],
  );

  async function startNavigation() {
    const route = selectedRoute;
    if (!route) return;

    if (Capacitor.isNativePlatform() && origin && destination) {
      const launched = await MapboxBridge.startDrivingSession({
        origin: { latitude: origin.lat, longitude: origin.lng },
        destination: { latitude: destination.lat, longitude: destination.lng },
        profile:
          profile === "driving" || profile === "walking" || profile === "cycling"
            ? profile
            : "driving",
      });
      if (launched) return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("This device has no GPS available.");
      return;
    }
    setIsNavigating(true);
    setFollowMode(true);
    setStepIndex(0);
    announcedRef.current = -1;
    setRemainingM(route.distanceM);
    setRemainingS(route.durationS);
    navStateRef.current = { isNavigating: true, routeId: route.id };

    watchRef.current = navigator.geolocation.watchPosition(
      onPosition,
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Location permission denied — Verden needs GPS to navigate.");
          stopNavigation();
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          toast.error("GPS signal unavailable. Move to an open area.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
    );
  }

  function stopNavigation() {
    if (Capacitor.isNativePlatform()) {
      void MapboxBridge.exitDrivingSession();
    }
    setIsNavigating(false);
    setSpeedKmh(0);
    navStateRef.current = { isNavigating: false, routeId: null };
    if (watchRef.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
  }

  useEffect(() => () => stopNavigation(), []);

  const currentStep = selectedRoute?.maneuvers[stepIndex] ?? null;

  const selfEntity = userLocation
    ? {
        id: "self",
        lng: userLocation.lng,
        lat: userLocation.lat,
        heading,
        modelKey: garage.activeModelKey,
        tint: garage.active?.color,
      }
    : null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-background text-foreground select-none">
      {/* Persistent MapCanvas */}
      <MapCanvas
        className="absolute inset-0 w-full h-full"
        mood={mood}
        center={origin}
        self={selfEntity}
        routes={routes}
        selectedRouteId={selectedRouteId}
        onSelectRoute={setSelectedRouteId}
        destination={
          destination
            ? { lat: destination.lat, lng: destination.lng, name: destination.name }
            : null
        }
        places={destination ? [] : results}
        isNavigating={isNavigating}
        followMode={followMode}
        onUserInteract={() => setFollowMode(false)}
        onPlaceClick={pickPlace}
        onMapClick={async (point) => {
          if (isNavigating) return;
          try {
            pickPlace(await MapService.reverse(point));
          } catch {
            /* ignore reverse-geocode misses */
          }
        }}
      />

      {/* Top Floating Bar: Search & Quick Navigation */}
      {!isNavigating && (
        <div className="absolute inset-x-3 top-3 z-30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pointer-events-none">
          {/* Search Box */}
          <div className="w-full md:max-w-md pointer-events-auto">
            <div className="glass flex items-center gap-2 rounded-2xl px-4 py-3 shadow-lg">
              <Search size={18} className="text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={kidMode ? "Where to?" : "Search a place, address or landmark"}
                aria-label="Search destinations"
                className={`flex-1 bg-transparent outline-none placeholder:text-muted-foreground ${
                  kidMode || settings.largeText ? "text-lg" : "text-sm"
                }`}
              />
              {searching && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQuery("");
                    setResults([]);
                    setDestination(null);
                    setRoutes([]);
                  }}
                  className="cursor-pointer"
                >
                  <X size={16} className="text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Travel Profiles */}
            <div className="mt-2 flex gap-2">
              {PROFILE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setProfile(option.id);
                    if (destination) void calculate(destination);
                  }}
                  className={`glass flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition cursor-pointer ${
                    profile === option.id ? "gradient-eco text-white" : "text-muted-foreground"
                  }`}
                >
                  <option.icon size={14} />
                  {option.label}
                </button>
              ))}
            </div>

            {/* Search Results Dropdown */}
            {results.length > 0 && (
              <ul className="glass mt-2 max-h-72 divide-y divide-border/50 overflow-auto rounded-2xl shadow-lg">
                {results.map((place) => (
                  <li key={place.id}>
                    <button
                      type="button"
                      onClick={() => pickPlace(place)}
                      className="w-full px-4 py-3 text-left hover:bg-secondary/70 cursor-pointer"
                    >
                      <p className="font-display text-sm font-semibold">{place.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{place.address}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick Floating Screen Switcher Icons */}
          <div className="hidden sm:flex items-center gap-1.5 glass rounded-2xl p-1.5 shadow-lg pointer-events-auto">
            <button
              type="button"
              onClick={() => onOpenScreen("home")}
              className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                activeScreen === "home"
                  ? "gradient-eco text-white shadow-eco"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
              title="Dashboard"
            >
              <Home size={18} />
              <span className="hidden md:inline">Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenScreen("trips")}
              className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                activeScreen === "trips"
                  ? "gradient-eco text-white shadow-eco"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
              title="Trips"
            >
              <RouteIcon size={18} />
              <span className="hidden md:inline">Trips</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenScreen("convoy")}
              className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                activeScreen === "convoy"
                  ? "gradient-eco text-white shadow-eco"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
              title="Convoy"
            >
              <Users size={18} />
              <span className="hidden md:inline">Convoy</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenScreen("profile")}
              className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                activeScreen === "profile"
                  ? "gradient-eco text-white shadow-eco"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
              title="Profile & Garage"
            >
              <User size={18} />
              <span className="hidden md:inline">Garage</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenScreen("settings")}
              className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                activeScreen === "settings"
                  ? "gradient-eco text-white shadow-eco"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Return to vehicle */}
      {!followMode && (
        <button
          type="button"
          onClick={() => setFollowMode(true)}
          className="glass absolute bottom-32 sm:bottom-24 right-3 z-30 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-lg cursor-pointer"
        >
          <LocateFixed size={16} className="text-primary" />
          Return to car
        </button>
      )}

      {/* Route panel */}
      {!isNavigating && routes.length > 0 && (
        <div className="absolute inset-x-3 bottom-20 md:bottom-6 z-30 md:left-auto md:right-3 md:w-96">
          <div className="glass rounded-3xl p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-sm font-bold">
                {routes.length} Mapbox alternative{routes.length === 1 ? "" : "s"}
              </p>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                {PLAN_LABEL[plan.plan]}
              </span>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {LENSES.map((item) => {
                const unlocked = allowedLenses.some((l) => l.id === item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      unlocked
                        ? setLens(item.id)
                        : toast.info(`${item.label} routing unlocks on Horizon and Frontier.`)
                    }
                    title={item.hint}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
                      lens === item.id
                        ? "gradient-eco text-white"
                        : unlocked
                          ? "bg-secondary text-muted-foreground"
                          : "bg-secondary/60 text-muted-foreground/60"
                    }`}
                  >
                    {unlocked ? <item.icon size={12} /> : <Crown size={12} />}
                    {item.label}
                  </button>
                );
              })}
            </div>

            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {routes.map((route) => {
                const active = route.id === selectedRouteId;
                return (
                  <li key={route.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedRouteId(route.id)}
                      className={`w-full rounded-2xl border p-3 text-left transition cursor-pointer ${
                        active ? "border-primary bg-primary/10" : "border-border bg-secondary/40"
                      }`}
                    >
                      <div className="flex items-baseline justify-between">
                        <p className="font-display text-sm font-bold">
                          {formatDurationShort(route.durationS)}
                          <span className="ml-2 text-xs font-medium text-muted-foreground">
                            {formatDistanceShort(route.distanceM)}
                          </span>
                        </p>
                        <p className="text-xs font-semibold text-primary">
                          {route.eco.co2Kg.toFixed(2)} kg CO₂
                        </p>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {route.bestFor.map((preference) => (
                          <span
                            key={preference}
                            className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary"
                          >
                            Best {LENSES.find((l) => l.id === preference)?.label ?? preference}
                          </span>
                        ))}
                        {route.traffic && route.traffic !== "unknown" && (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                            {route.traffic} traffic
                          </span>
                        )}
                      </div>
                      <dl className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
                        <div>
                          <dt>Green</dt>
                          <dd className="font-semibold text-foreground">
                            {Math.round(route.measures.greenScore * 100)}%
                          </dd>
                        </div>
                        <div>
                          <dt>Shade</dt>
                          <dd className="font-semibold text-foreground">
                            {Math.round(route.measures.shadeScore * 100)}%
                          </dd>
                        </div>
                        <div>
                          <dt>Credits</dt>
                          <dd className="font-semibold text-foreground">
                            +{route.eco.creditsEarned}
                          </dd>
                        </div>
                      </dl>
                    </button>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={() => void startNavigation()}
              disabled={!selectedRoute || calculating}
              className="gradient-eco mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-display font-bold text-white shadow-eco disabled:opacity-60 cursor-pointer"
            >
              {calculating ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Navigation2 size={18} />
              )}
              Start navigation
            </button>
          </div>
        </div>
      )}

      {calculating && routes.length === 0 && (
        <div className="glass absolute inset-x-3 bottom-20 md:bottom-6 z-30 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm md:left-auto md:right-3 md:w-96">
          <Loader2 size={16} className="animate-spin text-primary" /> Scoring alternatives…
        </div>
      )}

      {/* Turn-by-turn HUD */}
      {isNavigating && (
        <>
          <div className="absolute inset-x-3 top-3 z-30 md:max-w-lg">
            <div className="glass rounded-3xl p-4 shadow-xl">
              <p className="font-display text-lg font-bold leading-snug">
                {currentStep?.instruction ?? "Continue on your route"}
              </p>
              {currentStep && (
                <p className="text-xs text-muted-foreground">
                  in {formatDistanceShort(currentStep.distanceM)}
                </p>
              )}
            </div>
          </div>

          <div className="absolute inset-x-3 bottom-6 z-30 md:left-auto md:right-3 md:w-96">
            <div className="glass rounded-3xl p-4 shadow-xl">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="font-display text-lg font-bold">
                    {formatDurationShort(remainingS)}
                  </p>
                  <p className="text-[10px] uppercase text-muted-foreground">Left</p>
                </div>
                <div>
                  <p className="font-display text-lg font-bold">
                    {formatDistanceShort(remainingM)}
                  </p>
                  <p className="text-[10px] uppercase text-muted-foreground">Distance</p>
                </div>
                <div>
                  <p className="font-display text-lg font-bold">{speedKmh}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">km/h</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!plan.voiceGuidance) {
                      toast.info("Voice guidance unlocks on Horizon and Frontier.");
                      return;
                    }
                    setMuted((m) => !m);
                  }}
                  className="glass flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold cursor-pointer"
                >
                  {muted || !plan.voiceGuidance ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  Voice
                </button>
                <button
                  type="button"
                  onClick={stopNavigation}
                  className="flex-1 rounded-2xl bg-destructive py-3 text-sm font-bold text-destructive-foreground cursor-pointer"
                >
                  End
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Arrival Celebration Modal */}
      {arrival && (
        <div className="absolute inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur animate-scaleIn">
          <div className="glass w-full max-w-sm rounded-3xl p-6 text-center shadow-2xl">
            <CheckCircle2 size={44} className="mx-auto text-primary" />
            <h2 className="mt-3 font-display text-2xl font-bold">You've arrived</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {savingTrip ? "Saving your trip…" : "Trip logged to your Verden impact."}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-secondary p-3">
                <p className="font-display text-xl font-bold">{arrival.savedCo2.toFixed(2)}</p>
                <p className="text-[10px] uppercase text-muted-foreground">kg CO₂ saved</p>
              </div>
              <div className="rounded-2xl bg-secondary p-3">
                <p className="font-display text-xl font-bold">+{arrival.credits}</p>
                <p className="text-[10px] uppercase text-muted-foreground">Credits</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setArrival(null);
                setRoutes([]);
                setDestination(null);
                setQuery("");
              }}
              className="gradient-eco mt-5 w-full rounded-2xl py-3 font-display font-bold text-white shadow-eco cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      {!isNavigating && (
        <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 glass border-t border-border/60 px-2 py-2 flex justify-around">
          <button
            type="button"
            onClick={() => onOpenScreen("home")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-medium transition cursor-pointer ${
              activeScreen === "home" ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <Home size={18} />
            Home
          </button>
          <button
            type="button"
            onClick={() => onOpenScreen("map")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-medium transition cursor-pointer ${
              activeScreen === "map" ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <Navigation2 size={18} />
            Navigate
          </button>
          <button
            type="button"
            onClick={() => onOpenScreen("trips")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-medium transition cursor-pointer ${
              activeScreen === "trips" ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <RouteIcon size={18} />
            Trips
          </button>
          <button
            type="button"
            onClick={() => onOpenScreen("convoy")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-medium transition cursor-pointer ${
              activeScreen === "convoy" ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <Users size={18} />
            Convoy
          </button>
          <button
            type="button"
            onClick={() => onOpenScreen("profile")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-medium transition cursor-pointer ${
              activeScreen === "profile" ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <User size={18} />
            Profile
          </button>
          <button
            type="button"
            onClick={() => onOpenScreen("settings")}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-medium transition cursor-pointer ${
              activeScreen === "settings" ? "text-primary font-bold" : "text-muted-foreground"
            }`}
          >
            <Settings size={18} />
            Settings
          </button>
        </nav>
      )}
    </div>
  );
}
