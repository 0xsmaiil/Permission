import { useState, useCallback } from "react";
import { SplashScreen } from "./components/SplashScreen";
import { TabBar } from "./components/TabBar";
import { Calculator } from "./components/Calculator";
import { HomeTab } from "./components/HomeTab";
import { HistoryTab } from "./components/HistoryTab";
import { PushPermissionGate } from "./components/PushPermissionGate";
import { useSwipe } from "./hooks/useSwipe";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState(1);

  console.log("App rendering, showSplash:", showSplash);

  const handleLoadCalc = useCallback(() => {
    setActiveTab(1);
  }, []);

  const handleTabChange = useCallback((tab: number) => {
    setActiveTab(tab);
  }, []);

  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: () => setActiveTab((prev) => Math.min(prev + 1, 2)),
    onSwipeRight: () => setActiveTab((prev) => Math.max(prev - 1, 0)),
  });

  const appContent = (
    <div className="app-container" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="content-wrapper">
        <div
          className="content-slider"
          style={{ transform: `translateX(-${activeTab * 100}%)` }}
        >
          <div className="slide-panel"><HomeTab /></div>
          <div className="slide-panel"><Calculator /></div>
          <div className="slide-panel"><HistoryTab onLoadCalculation={handleLoadCalc} onTabChange={handleTabChange} /></div>
        </div>
      </div>
      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );

  if (showSplash) {
    return (
      <div style={{ width: "100%", height: "100dvh" }}>
        <div style={{position:"fixed", top:0, left:0, right:0, background:"yellow", padding:8, zIndex:99999, textAlign:"center", fontWeight:"bold"}}>
          DEBUG: App loaded ✓ (splash phase)
        </div>
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </div>
    );
  }

  return (
    <PushPermissionGate>
      <div style={{width:"100%", height:"100dvh"}}>
        <div style={{position:"fixed", top:0, left:0, right:0, background:"lime", padding:8, zIndex:99999, textAlign:"center", fontWeight:"bold"}}>
          DEBUG: App loaded ✓ (main phase)
        </div>
        {appContent}
      </div>
    </PushPermissionGate>
  );
}

export default App;
