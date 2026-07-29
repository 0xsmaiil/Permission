import { Coffee, CopySimple, BellRinging } from "@phosphor-icons/react";
import { useState, useEffect, useCallback } from "react";
import { ReminderBanner } from "./ReminderBanner";
import { CustomHolidaySettings } from "./CustomHolidays";
import { AnalyticsCard } from "./AnalyticsCard";
import type { CalculationRecord, LeaveType } from "../lib/storage";
import { getHistory } from "../lib/storage";
import { toast } from "../lib/toast";
import { useT } from "../lib/i18n";
import { usePushSubscription } from "../hooks/usePushSubscription";

interface Props {
  onLoadCalculation: (departure: string, duration: string, leaveType: LeaveType) => void;
  onTabChange: (tab: number) => void;
}

export function HomeTab({ onLoadCalculation, onTabChange }: Props) {
  const t = useT();
  const [history, setHistory] = useState<CalculationRecord[]>([]);
  const { isSubscribed, permissionState, subscribe } = usePushSubscription();

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleSelect = useCallback((departure: string, duration: string, leaveType: LeaveType) => {
    onLoadCalculation(departure, duration, leaveType);
    onTabChange(1);
  }, [onLoadCalculation, onTabChange]);

  return (
    <div className="tab-page home-page">
      <ReminderBanner />
      {!isSubscribed && (
        <div className="subscribe-banner">
          <BellRinging size={18} />
          <span className="subscribe-banner-text">{t("pushGate.title")} — {t("pushGate.desc")}</span>
          <button
            className="subscribe-banner-btn"
            onClick={subscribe}
            disabled={permissionState === "loading"}
          >
            {permissionState === "loading" ? t("pushGate.subscribing") : t("pushGate.subscribe")}
          </button>
        </div>
      )}
      <CustomHolidaySettings />

      <AnalyticsCard history={history} onSelect={handleSelect} />

      <div className="donation-row">
        <span className="donation-row-text">
          <Coffee size={14} weight="duotone" /> {t("home.donate.title")}
        </span>
        <button
          className="btn-copy"
          onClick={() => {
            navigator.clipboard.writeText("00799999001875074808");
            toast(t("home.donate.copied"));
          }}
        >
          <CopySimple size={14} weight="duotone" /> {t("home.donate.copy")}
        </button>
      </div>
    </div>
  );
}
