import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { t } from "../lib/i18n";

const LOCAL_FLAG = "push_subscribed";

function safeRemoveFlag(): void {
  try {
    localStorage.removeItem(LOCAL_FLAG);
  } catch {
    // Storage unavailable (private mode, quota) — fail silently.
  }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    arr[i] = rawData.charCodeAt(i);
  }
  return arr.buffer.slice(0, arr.length) as ArrayBuffer;
}

export type PermissionState =
  | "idle"
  | "loading"
  | "granted"
  | "denied"
  | "error";

export function usePushSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let flag: string | null = null;
    try {
      flag = localStorage.getItem(LOCAL_FLAG);
    } catch {
      // Storage unavailable — ignore.
    }
    if (flag !== "true") return;
    // If the flag says subscribed but there is no active push subscription
    // (VAPID rotation, cleared data, etc.), reset the flag so the user sees
    // the gate and can re-subscribe.
    const verify = async () => {
      try {
        if (!("Notification" in window) || Notification.permission !== "granted") {
          safeRemoveFlag();
          return;
        }
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          safeRemoveFlag();
          return;
        }
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          safeRemoveFlag();
          return;
        }
        setIsSubscribed(true);
        setPermissionState("granted");
      } catch {
        safeRemoveFlag();
      }
    };
    void verify();
  }, []);

  const subscribe = useCallback(async () => {
    setError(null);
    setPermissionState("loading");

    let swTimer: ReturnType<typeof setTimeout> | undefined;

    try {
      if (!supabase) {
        throw new Error(t("pushGate.error.supabase"));
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error(t("pushGate.error.unsupported"));
      }

      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setPermissionState("denied");
        return false;
      }
      if (permission !== "granted") {
        setPermissionState("idle");
        return false;
      }

      const swReadyTimeout = new Promise<never>((_, reject) => {
        swTimer = setTimeout(() => reject(new Error(t("pushGate.error.sw"))), 15000);
      });
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        swReadyTimeout,
      ]);
      clearTimeout(swTimer);

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) throw new Error("VAPID public key is not configured.");

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
      }

      const subJson = subscription.toJSON();
      const endpoint = subJson.endpoint;
      if (!endpoint) throw new Error(t("pushGate.error.unexpected"));
      const p256dh = subJson.keys?.p256dh ?? "";
      const auth = subJson.keys?.auth ?? "";

      // Use insert instead of upsert — upsert requires an UPDATE policy for
      // the anon role, which may not exist. If the endpoint already exists
      // the UNIQUE constraint will trigger a harmless 409 that we ignore.
      const { error: dbError } = await supabase
        .from("push_subscriptions")
        .insert({ endpoint, p256dh, auth });

      // 23505 is the Postgres code for unique_violation — the user already
      // subscribed from this browser. Treat it as success.
      if (dbError && dbError.code !== "23505") throw new Error(dbError.message);

      try {
        localStorage.setItem(LOCAL_FLAG, "true");
      } catch {
        // Storage unavailable (private mode, quota) — still report success.
      }
      setIsSubscribed(true);
      setPermissionState("granted");
      return true;
    } catch (err: unknown) {
      clearTimeout(swTimer);
      const message = err instanceof Error ? err.message : t("pushGate.error.unexpected");
      setError(message);
      setPermissionState("error");
      return false;
    }
  }, []);

  return { isSubscribed, permissionState, error, subscribe };
}
