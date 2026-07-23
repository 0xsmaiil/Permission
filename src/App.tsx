import { useState, useCallback } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { TabBar } from "./components/TabBar";
import { Calculator } from "./components/Calculator";
import { HomeTab } from "./components/HomeTab";
import { HistoryTab } from "./components/HistoryTab";
import { ToastContainer } from "./components/Toast";
import { Onboarding } from "./components/Onboarding";
import { useSwipe } from "./hooks/useSwipe";
import { useLocale } from "./lib/i18n";

function App() {
  const [locale] = useLocale();
  const [activeTab, setActiveTab] = useState(1);

  const handleLoadCalc = useCallback(() => {
    setActiveTab(1);
  }, []);

  const handleTabChange = useCallback((tab: number) => {
    setActiveTab(tab);
  }, []);

  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: () => setActiveTab((prev) => Math.max(prev - 1, 0)),
    onSwipeRight: () => setActiveTab((prev) => Math.min(prev + 1, 2)),
  });

  return (
    <div className="app-container" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="content-wrapper">
        <div
          className="content-slider"
          style={{ transform: `translateX(${(locale === "ar" ? 1 : -1) * activeTab * 100}%)` }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="slide-panel" style={{ opacity: activeTab === i ? 1 : 0.4 }}>
              <ErrorBoundary key={i}>
                {i === 0 && <HomeTab />}
                {i === 1 && <Calculator />}
                {i === 2 && <HistoryTab onLoadCalculation={handleLoadCalc} onTabChange={handleTabChange} />}
              </ErrorBoundary>
            </div>
          ))}
        </div>
      </div>
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
      <ToastContainer />
      <Onboarding />
    </div>
  );
}

export default App;
