import { useEffect, useState, useRef } from "react";
import { AppleLogo, AndroidLogo, GlobeHemisphereWest, ShareNetwork, CheckCircle } from "@phosphor-icons/react";
import { useT } from "@/lib/i18n";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface Props {
  deferredPrompt: BeforeInstallPromptEvent | null;
}

export function InstallLandingPage({ deferredPrompt }: Props) {
  const t = useT();
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [installStatus, setInstallStatus] = useState<"idle" | "installing" | "installed">("idle");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<number>(0);

  useEffect(() => {

    const handleAppInstalled = () => {
      setInstallStatus((prev) => (prev === "installing" ? prev : "installed"));
    };
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => window.removeEventListener("appinstalled", handleAppInstalled);
  }, []);

  const handleAndroidClick = async () => {
    setShowIOSHint(false);
    setInfoMessage(null);

    if (installStatus === "installing") {
      setInfoMessage(t("install.landing.alreadyInstalling"));
      return;
    }
    if (installStatus === "installed") {
      setInfoMessage(t("install.landing.alreadyInstalled"));
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        startProgressAnimation();
      }
    } else {
      setInfoMessage(t("install.landing.androidFallback"));
    }
  };

  const handleIOSClick = () => {
    setShowIOSHint(true);
  };

  const startProgressAnimation = () => {
    setInstallStatus("installing");
    setProgress(0);
    progressRef.current = 0;
    const startTime = performance.now();
    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const next = Math.min((elapsed / 3000) * 100, 100);
      progressRef.current = next;
      setProgress(next);
      if (next >= 100) {
        clearInterval(interval);
        setInstallStatus("installed");
      }
    }, 50);
  };

  const buttonContent = () => {
    if (installStatus === "installing") {
      return (
        <>
          {t("install.landing.installing")} ({Math.round(progress)}%)
        </>
      );
    }
    if (installStatus === "installed") {
      return (
        <>
          {t("install.landing.installed")}
          <CheckCircle size={24} weight="fill" />
        </>
      );
    }
    return (
      <>
        {t("install.landing.android")}
        <AndroidLogo size={24} weight="fill" />
      </>
    );
  };

  const buttonStyle = () => {
    if (installStatus === "installed") {
      return "flex items-center justify-center gap-3 leading-none rounded-xl px-6 py-4 font-semibold bg-zinc-100 text-emerald-600 cursor-default w-full";
    }
    if (installStatus === "installing") {
      return "flex items-center justify-center gap-3 leading-none rounded-xl px-6 py-4 font-semibold bg-emerald-700/10 text-zinc-800 cursor-wait relative z-10 w-full";
    }
    return "flex items-center justify-center gap-3 leading-none rounded-xl px-6 py-4 font-semibold text-white transition-all duration-150 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] w-full";
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white p-6 text-center text-zinc-900">
      <div className="flex flex-col items-center justify-center flex-1">
        <img src="/pwa-maskable-192x192.png" alt="Permission App Logo" className="w-24 h-24 mx-auto mb-6 object-contain" />

        <p className="mb-10 text-sm text-zinc-500 max-w-xs mx-auto">
          {t("install.landing.desc")}
        </p>

        <div className="flex w-full max-w-xs flex-col gap-4">
          <div className="relative overflow-hidden rounded-xl">
            {installStatus === "installing" && (
              <div
                className="absolute left-0 top-0 bottom-0 bg-emerald-200 transition-all duration-300 ease-out rounded-xl"
                style={{ width: `${progress}%` }}
              />
            )}
            <button onClick={handleAndroidClick} className={buttonStyle()}>
              {buttonContent()}
            </button>
          </div>

          <button
            onClick={handleIOSClick}
            className="flex items-center justify-center gap-3 leading-none rounded-xl bg-zinc-100 px-6 py-4 font-semibold text-zinc-700 border border-zinc-200 transition-all duration-150 hover:bg-zinc-200 active:scale-[0.97] w-full"
          >
            {t("install.landing.ios")}
            <AppleLogo size={24} weight="fill" />
          </button>
        </div>

        {installStatus === "installing" && (
          <p className="mt-4 text-xs text-emerald-600 animate-pulse max-w-xs">
            {t("install.landing.installingHint")}
          </p>
        )}

        {infoMessage && (
          <div className="mt-8 flex max-w-xs flex-col items-center gap-4 transition-all duration-300">
            <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-6 py-3 border border-zinc-200">
              <GlobeHemisphereWest size={20} className="text-emerald-500" />
              <span className="font-medium text-zinc-700">{t("install.landing.androidHintLabel")}</span>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">
              {infoMessage}
            </p>
          </div>
        )}

        {showIOSHint && (
          <div className="mt-8 flex max-w-xs flex-col items-center gap-4 transition-all duration-300">
            <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-6 py-3 border border-zinc-200">
              <ShareNetwork size={20} className="text-blue-500" />
              <span className="font-medium text-zinc-700">{t("install.landing.shareLabel")}</span>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed">
              {t("install.landing.iosHint")}
            </p>
          </div>
        )}
      </div>

      <p className="text-zinc-400 text-xs pt-8">
        {t("install.landing.subtitle")}
      </p>
    </div>
  );
}
