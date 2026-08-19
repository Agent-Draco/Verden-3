import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RoutePreference } from "@/lib/map/types";

/** Stored membership values stay `free | pro | max`; Verden 3 renames the tiers. */
export type Plan = "free" | "pro" | "max";

export type PlanFeatures = {
  plan: Plan;
  isPro: boolean;
  isMax: boolean;
  loading: boolean;
  /** Re-reads the membership row (call after redeeming a code). */
  refresh: () => void;
  /** Route lenses this tier can select. */
  allowedRouteTypes: RoutePreference[];
  voiceGuidance: boolean;
  convoy: boolean;
  offlineMaps: boolean;
  maxOfflineRegions: number;
  moods: boolean;
  unlimitedGroups: boolean;
  maxGroups: number;
  maxTrips: number;
  advancedAnalytics: boolean;
  autoUnlockAllCars: boolean;
};

type Gates = Omit<PlanFeatures, "plan" | "isPro" | "isMax" | "loading" | "refresh">;

const PLAN_FEATURES: Record<Plan, Gates> = {
  free: {
    allowedRouteTypes: ["fastest", "eco"],
    voiceGuidance: false,
    convoy: false,
    offlineMaps: false,
    maxOfflineRegions: 0,
    moods: false,
    unlimitedGroups: false,
    maxGroups: 1,
    maxTrips: 2,
    advancedAnalytics: false,
    autoUnlockAllCars: false,
  },
  pro: {
    allowedRouteTypes: ["fastest", "eco", "scenic", "battery-saver"],
    voiceGuidance: true,
    convoy: true,
    offlineMaps: true,
    maxOfflineRegions: 3,
    moods: true,
    unlimitedGroups: false,
    maxGroups: 5,
    maxTrips: 10,
    advancedAnalytics: true,
    autoUnlockAllCars: false,
  },
  max: {
    allowedRouteTypes: ["fastest", "eco", "scenic", "shade", "sun", "battery-saver"],
    voiceGuidance: true,
    convoy: true,
    offlineMaps: true,
    maxOfflineRegions: 12,
    moods: true,
    unlimitedGroups: true,
    maxGroups: Infinity,
    maxTrips: Infinity,
    advancedAnalytics: true,
    autoUnlockAllCars: true,
  },
};

export function usePlan(): PlanFeatures {
  const [plan, setPlan] = useState<Plan>("free");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        if (mounted) setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("membership_profiles")
        .select("membership")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (!mounted) return;
      setPlan(normalizePlan(data?.membership));
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [tick]);

  return {
    plan,
    isPro: plan === "pro" || plan === "max",
    isMax: plan === "max",
    loading,
    refresh,
    ...PLAN_FEATURES[plan],
  };
}

/**
 * Membership rows store Verden 3 tier names (mark/horizon/frontier); the gate
 * table is keyed by the legacy free/pro/max identifiers.
 */
export function normalizePlan(value: string | null | undefined): Plan {
  switch ((value ?? "").toLowerCase()) {
    case "horizon":
    case "pro":
      return "pro";
    case "frontier":
    case "max":
      return "max";
    default:
      return "free";
  }
}

/** Verden 3 tier names. */
export const PLAN_LABEL: Record<Plan, string> = {
  free: "Mark",
  pro: "Horizon",
  max: "Frontier",
};

export const PLAN_TAGLINE: Record<Plan, string> = {
  free: "Everything you need to start navigating greener.",
  pro: "Convoys, moods, offline packs and scenic routing.",
  max: "The whole of Verden — every lens, every car, no limits.",
};

export const PLAN_ORDER: Plan[] = ["free", "pro", "max"];

export function planFeatureList(plan: Plan): string[] {
  const gates = PLAN_FEATURES[plan];
  return [
    `${gates.allowedRouteTypes.length} route lenses`,
    gates.convoy ? "Convoy live sharing" : "Solo navigation",
    gates.offlineMaps ? `${gates.maxOfflineRegions} offline map packs` : "Online maps",
    gates.moods ? "All Map Moods" : "Explorer mood",
    gates.maxGroups === Infinity ? "Unlimited EcoMoov groups" : `${gates.maxGroups} EcoMoov group(s)`,
    gates.maxTrips === Infinity ? "Unlimited collaborative trips" : `${gates.maxTrips} trips`,
    gates.voiceGuidance ? "Voice guidance" : "On-screen guidance",
    ...(gates.autoUnlockAllCars ? ["Every garage vehicle unlocked"] : []),
  ];
}
