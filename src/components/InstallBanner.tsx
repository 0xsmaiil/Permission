import { DownloadSimple, X } from "@phosphor-icons/react";
import { useState } from "react";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { useT } from "../lib/i18n";

export function InstallBanner() {
  const t = useT();
  const { install, showPrompt } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!showPrompt || dismissed) return null;

  return (
    <div className="install-banner">
      <div className="install-banner-content">
        <DownloadSimple size={20} className="install-banner-icon" />
        <span className="install-banner-text">{t("install.text")}</span>
      </div>
      <div className="install-banner-actions">
        <button type="button" className="install-banner-btn" onClick={install}>
          {t("install.button")}
        </button>
        <button type="button" className="install-banner-close" onClick={() => setDismissed(true)}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
