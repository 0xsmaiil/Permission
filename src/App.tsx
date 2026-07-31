import { useState, useCallback, useEffect, useRef } from "react";
import { Calculator, SquaresFour, GearSix } from "@phosphor-icons/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TabBar } from "@/components/TabBar";
import { PushPermissionGate } from "@/components/PushPermissionGate";
import { ToastContainer } from "@/components/Toast";
import { Onboarding } from "@/components/Onboarding";
import { NotificationBell } from "@/components/NotificationBell";
import { CalculatorTab } from "@/components/CalculatorTab";
import { DashboardTab } from "@/components/DashboardTab";
import { SettingsTab } from "@/components/SettingsTab";
import { useSwipe } from "@/hooks/useSwipe";
import { getHistory, type CalculationRecord } from "@/lib/storage";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { InstallLandingPage } from "@/components/InstallLandingPage";
import { startReminderScheduler } from "@/lib/reminderNotifications";

const TABS = [
  { icon: Calculator, labelKey: "tab.calc" },
  { icon: SquaresFour, labelKey: "tab.dashboard" },
  { icon: GearSix, labelKey: "tab.settings" },
];

function App() {
  const { isStandalone, deferredPrompt } = usePWAInstall();
  const [activeTab, setActiveTab] = useState(0);
  const [loadData, setLoadData] = useState<{ departure: string; duration: string; leaveType?: string } | null>(null);
  const [history, setHistory] = useState<CalculationRecord[]>([]);

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
    onSwipeLeft: () => setActiveTab((prev) => Math.min(prev + 1, 2)),
    onSwipeRight: () => setActiveTab((prev) => Math.max(prev - 1, 0)),
  });

  const lockedTouchRef = useRef(false);

  const guardedTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-swipe-lock]")) {
      lockedTouchRef.current = true;
      return;
    }
    lockedTouchRef.current = false;
    onTouchStart(e);
  }, [onTouchStart]);

  const guardedTouchEnd = useCallback((e: React.TouchEvent) => {
    if (lockedTouchRef.current) {
      lockedTouchRef.current = false;
      return;
    }
    onTouchEnd(e);
  }, [onTouchEnd]);

  if (!isStandalone) {
    return <InstallLandingPage deferredPrompt={deferredPrompt} />;
  }

  return (
    <PushPermissionGate>
      <div
        className="flex flex-col h-dvh bg-background text-foreground selection:bg-primary-200 dark:selection:bg-primary-800"
        onTouchStart={guardedTouchStart}
        onTouchEnd={guardedTouchEnd}
      >
        <header className="sticky top-0 z-40 flex items-center justify-between px-5 py-3 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <h1 dir="ltr" className="text-lg font-extrabold tracking-tight" style={{ fontFamily: '"Chillax", sans-serif' }}>
            <span className="text-primary-700 dark:text-primary-400">Per</span>
            <span className="text-foreground">mission</span>
          </h1>
          <div className="flex items-center gap-0.5">
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full pb-[calc(5rem+env(safe-area-inset-bottom))]">
            <ErrorBoundary>
              <div id="tab-panel-0" role="tabpanel" aria-labelledby="tab-0" className={activeTab === 0 ? "block" : "hidden"}>
                <CalculatorTab
                  loadData={loadData}
                  onDataLoaded={() => setLoadData(null)}
                  onHistoryChange={refreshHistory}
                  active={activeTab === 0}
                />
              </div>
              <div id="tab-panel-1" role="tabpanel" aria-labelledby="tab-1" className={activeTab === 1 ? "block" : "hidden"}>
                <DashboardTab history={history} onLoadCalculation={handleLoadCalc} onHistoryChange={refreshHistory} active={activeTab === 1} />
              </div>
              <div id="tab-panel-2" role="tabpanel" aria-labelledby="tab-2" className={activeTab === 2 ? "block" : "hidden"}>
                <SettingsTab />
              </div>
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
