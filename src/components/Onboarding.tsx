import { useState, useEffect, useCallback, useRef } from "react";
import {
  House,
  Calculator,
  ChartBar,
  Bell,
  ArrowLeft,
  ArrowRight,
  X,
  CalendarBlank,
} from "@phosphor-icons/react";
import { useT, getLocale } from "../lib/i18n";

const ONBOARDING_KEY = "permission-onboarding";

const ICONS = [
  <House key="0" size={28} weight="duotone" />,
  <ChartBar key="1" size={28} weight="duotone" />,
  <Bell key="2" size={28} weight="duotone" />,
  <Calculator key="3" size={28} weight="duotone" />,
  <CalendarBlank key="4" size={28} weight="duotone" />,
];

export function Onboarding() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const isRTL = getLocale() === "ar";

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const el = panelRef.current;
    if (el) el.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [visible, step]);

  const dismiss = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setVisible(false);
  }, []);

  const prev = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);
  const next = useCallback(() => {
    if (step < ICONS.length - 1) {
      setStep((s) => s + 1);
    } else {
      dismiss();
    }
  }, [step, dismiss]);

  if (!visible) return null;

  const stepNum = step + 1;

  return (
    <div className="onboarding-backdrop" role="dialog" aria-modal="true" aria-label={t("onboarding.aria")}>
      <div className="onboarding-panel" tabIndex={-1} ref={panelRef}>
        <button type="button" className="onboarding-skip" onClick={dismiss} aria-label={t("onboarding.skip")}>
          <X size={18} />
        </button>

        <div className="onboarding-icon">{ICONS[step]}</div>
        <h2 className="onboarding-title">{t(`onboarding.step${stepNum}.title`)}</h2>
        <p className="onboarding-desc">{t(`onboarding.step${stepNum}.desc`)}</p>

        <div className="onboarding-dots">
          {ICONS.map((_, i) => (
            <span key={i} className={`onboarding-dot ${i === step ? "onboarding-dot-active" : ""}`} />
          ))}
        </div>

        <div className="onboarding-actions">
          {step > 0 && (
            <button type="button" className="btn btn-outline btn-sm" onClick={prev}>
              {isRTL ? <ArrowRight size={16} /> : <ArrowLeft size={16} />} {t("onboarding.prev")}
            </button>
          )}
          <button type="button" className="btn btn-primary btn-sm" onClick={next}>
            {step < ICONS.length - 1 ? <>{t("onboarding.next")} {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}</> : t("onboarding.done")}
          </button>
        </div>
      </div>
    </div>
  );
}
