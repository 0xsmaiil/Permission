import { useState, useCallback, useEffect } from "react";
import { Calculator, SquaresFour, Sun, Moon, Monitor, Translate } from "@phosphor-icons/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TabBar } from "@/components/TabBar";
import { PushPermissionGate } from "@/components/PushPermissionGate";
import { ToastContainer } from "@/components/Toast";
import { Onboarding } from "@/components/Onboarding";
import { NotificationBell } from "@/components/NotificationBell";
import { CalculatorTab } from "@/components/CalculatorTab";
import { DashboardTab } from "@/components/DashboardTab";
import { useSwipe } from "@/hooks/useSwipe";
import { useLocale, useT, setLocale } from "@/lib/i18n";
import { getHistory, type CalculationRecord } from "@/lib/storage";
import { getStoredTheme, setTheme, type Theme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { InstallLandingPage } from "@/components/InstallLandingPage";
import { startReminderScheduler } from "@/lib/reminderNotifications";

const TABS = [
  { icon: Calculator, labelKey: "tab.calc" },
  { icon: SquaresFour, labelKey: "tab.dashboard" },
];

function cycleTheme(t: Theme): Theme {
  if (t === "light") return "dark";
  if (t === "dark") return "auto";
  return "light";
}

function themeIcon(t: Theme) {
  if (t === "dark") return <Sun className="h-[18px] w-[18px]" />;
  if (t === "auto") return <Monitor className="h-[18px] w-[18px]" />;
  return <Moon className="h-[18px] w-[18px]" />;
}

function App() {
  const { isStandalone, deferredPrompt } = usePWAInstall();
  const [locale] = useLocale();
  const t = useT();
  const [activeTab, setActiveTab] = useState(0);
  const [loadData, setLoadData] = useState<{ departure: string; duration: string; leaveType?: string } | null>(null);
  const [history, setHistory] = useState<CalculationRecord[]>([]);
  const [theme, setThemeState] = useState<Theme>(getStoredTheme());

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const refreshHistory = useCallback(() => {
    setHistory(getHistory());
  }, []);

  const handleLoadCalc = useCallback((departure: string, duration: string, leaveType?: string) => {
    setLoadData({ departure, duration, leaveType });
    setActiveTab(0);
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      startReminderScheduler();
    }
  }, []);

  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: () => setActiveTab((prev) => Math.min(prev + 1, 1)),
    onSwipeRight: () => setActiveTab((prev) => Math.max(prev - 1, 0)),
  });

  const handleThemeCycle = () => {
    const next = cycleTheme(theme);
    setThemeState(next);
    setTheme(next);
  };

  if (!isStandalone) {
    return <InstallLandingPage deferredPrompt={deferredPrompt} />;
  }

  return (
    <PushPermissionGate>
      <div
        className="flex flex-col h-dvh bg-background text-foreground selection:bg-primary-200 dark:selection:bg-primary-800"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <header dir="ltr" className="sticky top-0 z-40 flex items-center justify-between px-5 py-3 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <h1 className="text-lg font-extrabold tracking-tight" style={{ fontFamily: '"Chillax", sans-serif' }}>
            <span className="text-primary-600 dark:text-primary-400">Per</span>
            <span className="text-foreground">mission</span>
          </h1>
          <div className="flex items-center gap-0.5">
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocale(locale === "ar" ? "fr" : "ar")}
              aria-label={t("common.langSwitch")}
              className="h-9 w-9 rounded-lg"
            >
              <Translate className="h-[18px] w-[18px]" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleThemeCycle}
              aria-label={t("settings.theme")}
              className="h-9 w-9 rounded-lg"
            >
              {themeIcon(theme)}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full pb-20">
            <ErrorBoundary>
              {activeTab === 0 && (
                <CalculatorTab
                  loadData={loadData}
                  onDataLoaded={() => setLoadData(null)}
                  onHistoryChange={refreshHistory}
                />
              )}
              {activeTab === 1 && <DashboardTab history={history} onLoadCalculation={handleLoadCalc} onHistoryChange={refreshHistory} />}
            </ErrorBoundary>
          </div>
        </main>

        <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        <ToastContainer />
        <Onboarding />
      </div>
    </PushPermissionGate>
  );
}

export default App;
