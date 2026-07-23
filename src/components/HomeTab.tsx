import { CalendarBlank, ChartBar, DeviceMobile, Coffee, CopySimple } from "@phosphor-icons/react";
import { toast } from "../lib/toast";

export function HomeTab() {
  return (
    <div className="tab-page home-page">
      <div className="home-hero">
        <div className="home-logo">P</div>
        <h1 className="home-title">Permission</h1>
        <p className="home-sub">حاسبة العطل للموظفين الجزائريين</p>
      </div>

      <div className="home-features">
        <div className="feature-item">
          <span className="feature-icon"><CalendarBlank size={24} weight="duotone" /></span>
          <div>
            <p className="feature-title">حساب تاريخ العودة</p>
            <p className="feature-desc">مع مراعاة الأعياد الرسمية الإسلامية والوطنية</p>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon"><ChartBar size={24} weight="duotone" /></span>
          <div>
            <p className="feature-title">تفاصيل الفترة</p>
            <p className="feature-desc">تاريخ الانطلاق، العودة، والاستئناف</p>
          </div>
        </div>
        <div className="feature-item">
          <span className="feature-icon"><DeviceMobile size={24} weight="duotone" /></span>
          <div>
            <p className="feature-title">يعمل بدون إنترنت</p>
            <p className="feature-desc">بعد التثبيت، كل شيء محلي على جهازك</p>
          </div>
        </div>
      </div>

      <section className="donation-section">
        <div className="donation-header">
          <span className="donation-icon"><Coffee size={20} weight="duotone" /></span>
          <h3>دعم التطبيق</h3>
        </div>
        <p className="donation-desc">
          إذا أعجبك التطبيق، يمكنك دعمي بأي مبلغ عبر بريدي موب:
        </p>
        <div className="donation-card">
          <span className="method-icon"><DeviceMobile size={20} weight="duotone" /></span>
          <div>
            <p className="method-label">بريدي موب (Edahabia)</p>
            <p className="method-value" dir="ltr" id="baridimob-number">0079 9999 0018 7507 4808</p>
          </div>
          <button
            className="btn-copy"
            onClick={() => {
              navigator.clipboard.writeText("00799999001875074808");
              toast("تم النسخ!");
            }}
          >
            <CopySimple size={14} weight="duotone" /> نسخ
          </button>
        </div>
        <p className="donation-thanks">جزاك الله خيراً</p>
      </section>
    </div>
  );
}
