import { useEffect, useState } from "react";

interface Props {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: Props) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 1200);
    const t2 = setTimeout(onFinish, 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onFinish]);

  return (
    <div className={`splash ${fadeOut ? "splash-fade-out" : ""}`}>
      <div className="splash-content">
        <div className="splash-icon">P</div>
        <h1 className="splash-title">Permission</h1>
        <p className="splash-sub">حاسبة العطل</p>
      </div>
    </div>
  );
}
