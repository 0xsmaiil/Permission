import { CalendarBlank, ChartBar, DeviceMobile, Coffee, CopySimple, Translate } from "@phosphor-icons/react";
import { ReminderBanner } from "./ReminderBanner";
import { EntitlementSettings } from "./EntitlementBar";
import { CustomHolidaySettings } from "./CustomHolidays";
import { toast } from "../lib/toast";
import { useT, useLocale } from "../lib/i18n";

export function HomeTab() {
  const t = useT();
  const [locale, setLocale] = useLocale();

  return (
    <div className="tab-page home-page">
      <ReminderBanner />
      <EntitlementSettings />
      <CustomHolidaySettings />
      <div className="home-hero">
        <div className="home-logo">P</div>
        <h1 className="home-title">Permission</h1>
        <p className="home-sub">{t("home.hero.subtitle")}</p>
        <button
          type="button"
          className="locale-toggle"
          onClick={() => setLocale(locale === "ar" ? "fr" : "ar")}
          aria-label={locale === "ar" ? "Français" : "العربية"}
        >
          <Translate size={16} />
          {locale === "ar" ? "FR" : "AR"}
        </button>
      </div>

      <div className="home-features">
        <div className="feature-item">
          <span className="feature-icon"><CalendarBlank size={24} weight="duotone" /></span>
          <div>
            <p className="feature-title">{t("home.feature.calc.title")}</p>
            <p className="feature-desc">{t("home.feature.calc.desc")}</p>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon"><ChartBar size={24} weight="duotone" /></span>
          <div>
            <p className="feature-title">{t("home.feature.detail.title")}</p>
            <p className="feature-desc">{t("home.feature.detail.desc")}</p>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon"><DeviceMobile size={24} weight="duotone" /></span>
          <div>
            <p className="feature-title">{t("home.feature.offline.title")}</p>
            <p className="feature-desc">{t("home.feature.offline.desc")}</p>
          </div>
        </div>
      </div>

      <section className="donation-section">
        <div className="donation-header">
          <span className="donation-icon"><Coffee size={20} weight="duotone" /></span>
          <h3>{t("home.donate.title")}</h3>
        </div>
        <p className="donation-desc">{t("home.donate.desc")}</p>
        <div className="donation-card">
          <span className="method-icon"><DeviceMobile size={20} weight="duotone" /></span>
          <div>
            <p className="method-label">{t("home.donate.method")}</p>
            <p className="method-value" dir="ltr" id="baridimob-number">0079 9999 0018 7507 4808</p>
          </div>
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
        <p className="donation-thanks">{t("home.donate.thanks")}</p>
      </section>
    </div>
  );
}
