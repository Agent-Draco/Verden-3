import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "verden.theme";

function systemPrefersDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(mode: ThemeMode): "light" | "dark" {
  return mode === "system" ? (systemPrefersDark() ? "dark" : "light") : mode;
}

/** Applies the resolved theme to <html>. Safe to call repeatedly. */
export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const resolved = resolve(mode);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

/**
 * Dark mode. Reads localStorage only after hydration so SSR markup and the
 * first client render agree.
 */
export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const next = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    setMode(next);
    applyTheme(next);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const setTheme = useCallback((next: ThemeMode) => {
    setMode(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }, []);

  const resolved = hydrated ? resolve(mode) : "light";

  return {
    mode,
    resolved,
    hydrated,
    setTheme,
    toggle: () => setTheme(resolved === "dark" ? "light" : "dark"),
  };
}