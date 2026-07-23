import { useState, useCallback, Component } from "react";
import { SplashScreen } from "./components/SplashScreen";
import { TabBar } from "./components/TabBar";
import { Calculator } from "./components/Calculator";
import { HomeTab } from "./components/HomeTab";
import { HistoryTab } from "./components/HistoryTab";
import { PushPermissionGate } from "./components/PushPermissionGate";
import { useSwipe } from "./hooks/useSwipe";

class ErrorBoundary extends Component<{children: React.ReactNode}, {error: Error | null}> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e }; }
  render() {
    if (this.state.error) {
      return <div style={{padding:24,textAlign:"center",color:"red"}}>
        <h2>Error</h2>
        <pre>{this.state.error.message}</pre>
        <pre>{this.state.error.stack}</pre>
      </div>;
    }
    return this.props.children;
  }
}

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
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <ErrorBoundary>
      <PushPermissionGate>
        {appContent}
      </PushPermissionGate>
    </ErrorBoundary>
  );
}

export default App;
