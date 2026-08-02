import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let _deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
}

function getIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
  const iOSStandalone =
    "standalone" in navigator &&
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isStandaloneMedia || iOSStandalone;
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function usePWAInstall() {
  const [isStandalone, setIsStandalone] = useState(getIsStandalone);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(_deferredPrompt);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setDeferredPrompt(_deferredPrompt);
    });
    // Sync once in case event fired before subscribe
    setDeferredPrompt(_deferredPrompt);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const checkStandalone = () => setIsStandalone(getIsStandalone());
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", checkStandalone);
    return () => mediaQuery.removeEventListener("change", checkStandalone);
  }, []);

  return { isStandalone, deferredPrompt };
}
