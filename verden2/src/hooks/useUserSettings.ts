import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ExperienceMode, MapMood } from "@/lib/map/types";

export type UserSettings = {
  mapMood: MapMood;
  experienceMode: ExperienceMode;
  voiceGuidance: boolean;
  shareLocation: boolean;
  reduceMotion: boolean;
  largeText: boolean;
  notifyConvoy: boolean;
};

const STORAGE_KEY = "verden.user_settings";

const DEFAULTS: UserSettings = {
  mapMood: "explorer",
  experienceMode: "adult",
  voiceGuidance: true,
  shareLocation: true,
  reduceMotion: false,
  largeText: false,
  notifyConvoy: true,
};

function getLocalSettings(): UserSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function saveLocalSettings(settings: UserSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota or disabled localStorage
  }
}

/**
 * Adaptive Modes + Map Moods live in `user_settings` and are cached in `localStorage`.
 * The hook always resolves to sensible defaults so the map renders immediately.
 */
export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(getLocalSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      // 1. Load from localStorage first
      const local = getLocalSettings();
      if (mounted) setSettings(local);

      // 2. Fetch from Supabase if logged in
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        if (mounted) setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (!mounted) return;
      if (data) {
        const nav = (data.navigation ?? {}) as Record<string, unknown>;
        const privacy = (data.privacy ?? {}) as Record<string, unknown>;
        const a11y = (data.accessibility ?? {}) as Record<string, unknown>;
        const notifications = (data.notifications ?? {}) as Record<string, unknown>;
        const serverSettings: UserSettings = {
          mapMood: (data.map_mood as MapMood) ?? local.mapMood,
          experienceMode: (data.experience_mode as ExperienceMode) ?? local.experienceMode,
          voiceGuidance: (nav["voiceGuidance"] as boolean) ?? local.voiceGuidance,
          shareLocation: (privacy["shareLocation"] as boolean) ?? local.shareLocation,
          reduceMotion: (a11y["reduceMotion"] as boolean) ?? local.reduceMotion,
          largeText: (a11y["largeText"] as boolean) ?? local.largeText,
          notifyConvoy: (notifications["convoy"] as boolean) ?? local.notifyConvoy,
        };
        setSettings(serverSettings);
        saveLocalSettings(serverSettings);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const update = useCallback(async (patch: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveLocalSettings(next);
      return next;
    });

    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const current = getLocalSettings();
    const next = { ...current, ...patch };
    await supabase.from("user_settings").upsert(
      {
        user_id: u.user.id,
        map_mood: next.mapMood,
        experience_mode: next.experienceMode,
        navigation: { voiceGuidance: next.voiceGuidance },
        privacy: { shareLocation: next.shareLocation },
        accessibility: { reduceMotion: next.reduceMotion, largeText: next.largeText },
        notifications: { convoy: next.notifyConvoy },
      },
      { onConflict: "user_id" },
    );
  }, []);

  return { settings, loading, update };
}

/** Adaptive Modes shape how much complexity the UI exposes. */
export const EXPERIENCE_MODES: Array<{
  id: ExperienceMode;
  name: string;
  emoji: string;
  description: string;
}> = [
  {
    id: "kid",
    name: "Kid",
    emoji: "🧒",
    description: "Big buttons, playful cars, only safe places and no live sharing.",
  },
  {
    id: "teen",
    name: "Teen",
    emoji: "🛹",
    description: "Discovery-first with friends, convoys and hangout spots.",
  },
  {
    id: "adult",
    name: "Adult",
    emoji: "🧑‍💼",
    description: "Full detail: traffic, every route lens and trip planning.",
  },
];
