import { useState, useEffect, useCallback } from "react";
import { Gear, PencilSimple } from "@phosphor-icons/react";
import { getAnnualEntitlement, setAnnualEntitlement, getTotalDaysUsed } from "../lib/storage";
import { useT } from "../lib/i18n";

export function EntitlementSettings() {
  const t = useT();
  const [entitlement, setEntitlement] = useState(0);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    setEntitlement(getAnnualEntitlement());
  }, []);

  const handleSave = useCallback(() => {
    const v = parseInt(input, 10);
    if (v > 0 && v <= 365) {
      setAnnualEntitlement(v);
      setEntitlement(v);
    }
    setEditing(false);
  }, [input]);

  if (editing) {
    return (
      <div className="ent-bar">
        <label className="ent-label" htmlFor="ent-input">{t("entitlement.label.edit")}</label>
        <div className="ent-edit-row">
          <input
            id="ent-input"
            type="number"
            min={1}
            max={365}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="ent-input"
            placeholder={t("entitlement.placeholder")}
            dir="rtl"
          />
          <button type="button" className="ent-save-btn" onClick={handleSave}>{t("entitlement.save")}</button>
        </div>
      </div>
    );
  }

  if (entitlement === 0) {
    return (
      <div className="ent-bar ent-bar-empty">
        <div className="ent-row">
          <Gear size={16} />
          <span className="ent-label">{t("entitlement.label.set")}</span>
          <button type="button" className="ent-set-btn" onClick={() => { setInput(""); setEditing(true); }}>
            <PencilSimple size={14} /> {t("entitlement.set")}
          </button>
        </div>
      </div>
    );
  }

  const used = getTotalDaysUsed();
  const remaining = Math.max(0, entitlement - used);
  const pct = Math.min(100, (used / entitlement) * 100);

  return (
    <div className="ent-bar">
      <div className="ent-row">
        <span className="ent-label">{t("entitlement.label.show")}</span>
        <button type="button" className="ent-set-btn" onClick={() => { setInput(String(entitlement)); setEditing(true); }}>
          <PencilSimple size={14} /> {t("entitlement.edit")}
        </button>
      </div>
      <div className="ent-stats">
        <span>{t("entitlement.used")}: <strong>{used}</strong></span>
        <span>{t("entitlement.remaining")}: <strong>{remaining}</strong></span>
        <span>{t("entitlement.total")}: <strong>{entitlement}</strong></span>
      </div>
      <div className="ent-bar-track">
        <div className="ent-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
