import { useState, useEffect, useCallback, useRef } from "react";
import { CalendarBlank, ChartBar, Bell, ArrowLeft, ArrowRight, X } from "@phosphor-icons/react";
import { useT, getLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useSwipe } from "@/hooks/useSwipe";

const ONBOARDING_KEY = "permission-onboarding";

const ICONS = [
  <CalendarBlank key="0" size={36} weight="duotone" />,
  <ChartBar key="1" size={36} weight="duotone" />,
  <Bell key="2" size={36} weight="duotone" />,
];

function StepContent({ step }: { step: number }) {
  const t = useT();
  const stepNum = step + 1;

  return (
    <div className="w-full h-full shrink-0 flex flex-col items-center text-center gap-3 px-4 justify-center overflow-y-auto py-4">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {ICONS[step]}
      </div>
      <h2 className="text-xl font-bold">{t(`onboarding.step${stepNum}.title`)}</h2>
      <p className="text-sm text-muted-foreground max-w-xs">{t(`onboarding.step${stepNum}.desc`)}</p>
    </div>
  );
}

export function Onboarding() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const prevStepRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const isRTL = getLocale() === "ar";

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const el = panelRef.current;
    if (el) el.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [visible, dismiss]);

  const goTo = useCallback((s: number) => {
    prevStepRef.current = step;
    setStep(s);
  }, [step]);

  const prev = useCallback(() => goTo(Math.max(0, step - 1)), [step, goTo]);
  const next = useCallback(() => {
    if (step < ICONS.length - 1) {
      goTo(step + 1);
    } else {
      dismiss();
    }
  }, [step, dismiss, goTo]);

  const swipe = useSwipe({
    onSwipeLeft: () => { if (step < ICONS.length - 1) goTo(step + 1); },
    onSwipeRight: prev,
    threshold: 40,
  });

  if (!visible) return null;

  const isLast = step === ICONS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label={t("onboarding.aria")}
    >
      <div className="flex items-center justify-between px-4 h-14 shrink-0">
        <button
          type="button"
          className="p-2 -ms-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted min-w-[44px] min-h-[44px] flex items-center justify-center"
          onClick={dismiss}
          aria-label={t("onboarding.skip")}
        >
          <X size={22} />
        </button>
        <span className="text-sm text-muted-foreground tabular-nums">{step + 1}/{ICONS.length}</span>
      </div>

      <div
        className="flex-1 relative overflow-hidden"
        tabIndex={-1}
        ref={panelRef}
        {...swipe}
      >
        <div
          className="absolute inset-0 flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${step * 100}%)` }}
        >
          {ICONS.map((_, i) => (
            <StepContent key={i} step={i} />
          ))}
        </div>
      </div>

      <div className="shrink-0 px-4" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}>
        <div className="flex justify-center gap-1 py-2">
          {ICONS.map((_, i) => (
            <button
              key={i}
              type="button"
              className="min-w-[44px] min-h-[40px] flex items-center justify-center -my-1"
              onClick={() => goTo(i)}
              aria-label={t("onboarding.dot", { index: i + 1 })}
            >
              <span
                className={`block w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  i === step ? "bg-primary scale-125" : "bg-muted-foreground/30"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {step > 0 ? (
            <Button variant="outline" size="lg" onClick={prev} className="flex-1 h-12 rounded-xl">
              {isRTL ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
              <span className="ms-1.5">{t("onboarding.prev")}</span>
            </Button>
          ) : (
            <div className="flex-1" />
          )}
          <Button size="lg" onClick={next} className={`h-12 rounded-xl ${step === 0 ? "flex-1" : "flex-[2]"}`}>
            <span className="me-1.5">{isLast ? t("onboarding.done") : t("onboarding.next")}</span>
            {isLast ? null : isRTL ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
