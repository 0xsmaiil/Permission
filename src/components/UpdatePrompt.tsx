import { useState, useEffect } from "react";
import { ArrowClockwise, X } from "@phosphor-icons/react";
import { useT } from "../lib/i18n";

export function UpdatePrompt() {
  const t = useT();
  const [updateReady, setUpdateReady] = useState(false);
  const [swReg, setSwReg] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then((reg) => {
      setSwReg(reg);
      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateReady(true);
          }
        });
      });
    });

    let recheck: ReturnType<typeof setInterval>;
    // Re-check every 10 min for new SW versions
    if (!import.meta.env.DEV) {
      recheck = setInterval(async () => {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) await reg.update();
      }, 600_000);
    }
    return () => clearInterval(recheck);
  }, []);

  const handleUpdate = () => {
    if (swReg?.waiting) {
      swReg.waiting.postMessage({ type: "SKIP_WAITING" });
    }
    window.location.reload();
  };

  if (!updateReady) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999] animate-scale-in">
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-lg bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-800">
        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
          {t("update.ready")}
        </span>
        <button
          onClick={handleUpdate}
          className="btn btn-sm btn-primary"
        >
          <ArrowClockwise size={14} weight="duotone" />
          {t("update.refresh")}
        </button>
        <button
          onClick={() => setUpdateReady(false)}
          className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 bg-transparent border-none cursor-pointer p-1 rounded-md"
          aria-label={t("update.close")}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
