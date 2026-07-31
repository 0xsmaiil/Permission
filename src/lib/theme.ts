import { useState, useEffect, useCallback } from "react";

const THEME_KEY = "permission-theme";
export type Theme = "light" | "dark" | "auto";

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode, quota) — fail silently.
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "auto") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.remove("dark");
  }
}

export function getStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "dark" || v === "auto") return v;
  } catch {
    // Storage unavailable — fall through to default.
  }
  return "light";
}

export function setTheme(theme: Theme): void {
  safeSet(THEME_KEY, theme);
  applyTheme(theme);
}

applyTheme(getStoredTheme());

if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const current = getStoredTheme();
    if (current === "auto") applyTheme("auto");
  });
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState(getStoredTheme);
  useEffect(() => {
    const handler = () => {
      if (getStoredTheme() === "auto") setThemeState("auto");
    };
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  const update = useCallback((t: Theme) => {
    setThemeState(t);
    setTheme(t);
  }, []);
  return [theme, update];
}
