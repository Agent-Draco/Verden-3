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

const DEFAULTS: UserSettings = {
  mapMood: "explorer",
  experienceMode: "adult",
  voiceGuidance: true,
  shareLocation: true,
  reduceMotion: false,
  largeText: false,
  notifyConvoy: true,
};

/**
 * Adaptive Modes + Map Moods live in `user_settings`. The hook always resolves
 * to sensible defaults so the map renders even before the row exists.
 */
export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
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
        setSettings({
          mapMood: (data.map_mood as MapMood) ?? DEFAULTS.mapMood,
          experienceMode: (data.experience_mode as ExperienceMode) ?? DEFAULTS.experienceMode,
          voiceGuidance: (nav["voiceGuidance"] as boolean) ?? DEFAULTS.voiceGuidance,
          shareLocation: (privacy["shareLocation"] as boolean) ?? DEFAULTS.shareLocation,
          reduceMotion: (a11y["reduceMotion"] as boolean) ?? DEFAULTS.reduceMotion,
          largeText: (a11y["largeText"] as boolean) ?? DEFAULTS.largeText,
          notifyConvoy: (notifications["convoy"] as boolean) ?? DEFAULTS.notifyConvoy,
        });
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const update = useCallback(async (patch: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const next = { ...settings, ...patch };
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
  }, [settings]);

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
