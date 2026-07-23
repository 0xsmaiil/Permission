import { useState, useCallback } from "react";
import { SplashScreen } from "./components/SplashScreen";
import { TabBar } from "./components/TabBar";
import { Calculator } from "./components/Calculator";
import { HomeTab } from "./components/HomeTab";
import { HistoryTab } from "./components/HistoryTab";
import { ToastContainer } from "./components/Toast";
import { useSwipe } from "./hooks/useSwipe";

function App() {
  const [showSplash, setShowSplash] = useState(true);
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

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="app-container" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="content-wrapper">
        <div
          className="content-slider"
          style={{ transform: `translateX(${activeTab * 100}%)` }}
        >
          <div className="slide-panel"><HomeTab /></div>
          <div className="slide-panel"><Calculator /></div>
          <div className="slide-panel"><HistoryTab onLoadCalculation={handleLoadCalc} onTabChange={handleTabChange} /></div>
        </div>
      </div>
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
      <ToastContainer />
    </div>
  );
}

export default App;
