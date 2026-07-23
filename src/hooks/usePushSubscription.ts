import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const LOCAL_FLAG = "push_subscribed";

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    arr[i] = rawData.charCodeAt(i);
  }
  return arr.buffer as ArrayBuffer;
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
    if (typeof window !== "undefined") {
      const flag = localStorage.getItem(LOCAL_FLAG);
      if (flag === "true") {
        setIsSubscribed(true);
        setPermissionState("granted");
      }
    }
  }, []);

  const subscribe = useCallback(async () => {
    setError(null);
    setPermissionState("loading");

    try {
      if (!supabase) {
        throw new Error("Supabase غير مهيأ. تأكد من ضبط المتغيرات.");
      }

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("المتصفح لا يدعم الإشعارات الفورية.");
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

      const swReadyTimeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("لم يتم تفعيل Service Worker")), 5000),
      );
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        swReadyTimeout,
      ]);

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
      const endpoint = subJson.endpoint!;
      const p256dh = subJson.keys?.p256dh ?? "";
      const auth = subJson.keys?.auth ?? "";

      const { error: dbError } = await supabase
        .from("push_subscriptions")
        .upsert({ endpoint, p256dh, auth }, { onConflict: "endpoint" });

      if (dbError) throw new Error(dbError.message);

      localStorage.setItem(LOCAL_FLAG, "true");
      setIsSubscribed(true);
      setPermissionState("granted");
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع.";
      setError(message);
      setPermissionState("error");
      return false;
    }
  }, []);

  return { isSubscribed, permissionState, error, subscribe };
}
