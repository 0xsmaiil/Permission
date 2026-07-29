import { useState, useEffect, useCallback } from "react";
import { Plus, Trash, CalendarBlank } from "@phosphor-icons/react";
import { getCustomHolidays, addCustomHoliday, removeCustomHoliday, type CustomHoliday } from "../lib/storage";
import { useT } from "../lib/i18n";

export function CustomHolidaySettings() {
  const t = useT();
  const [holidays, setHolidays] = useState<CustomHoliday[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    setHolidays(getCustomHolidays());
  }, []);

  const refresh = useCallback(() => {
    setHolidays(getCustomHolidays());
  }, []);

  const handleAdd = useCallback(() => {
    if (!name.trim() || !date) return;
    addCustomHoliday(name.trim(), date);
    setName("");
    setDate("");
    refresh();
  }, [name, date, refresh]);

  const handleRemove = useCallback((id: string) => {
    removeCustomHoliday(id);
    refresh();
  }, [refresh]);

  return (
    <section className="section custom-holidays">
      <button type="button" className="custom-holidays-header" onClick={() => setOpen((o) => !o)}>
        <CalendarBlank size={16} weight="duotone" />
        <span>{t("customHolidays.title")}</span>
        {holidays.length > 0 && <span className="custom-holidays-count">{holidays.length}</span>}
      </button>

      {open && (
        <div className="custom-holidays-body">
          <div className="custom-holidays-add">
            <label className="sr-only" htmlFor="ch-name">{t("customHolidays.nameLabel")}</label>
            <input
              id="ch-name"
              type="text"
              className="input"
              placeholder={t("customHolidays.nameLabel")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              dir="rtl"
            />
            <label className="sr-only" htmlFor="ch-date">{t("customHolidays.dateLabel")}</label>
            <input
              id="ch-date"
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={handleAdd} disabled={!name.trim() || !date}>
              <Plus size={16} /> {t("customHolidays.add")}
            </button>
          </div>

          {holidays.length > 0 && (
            <div className="custom-holidays-list">
              {holidays.map((h) => (
                <div key={h.id} className="custom-holidays-item">
                  <div className="custom-holidays-info">
                    <span className="custom-holidays-name">{h.name}</span>
                    <span className="custom-holidays-date">{h.date}</span>
                  </div>
                  <button type="button" className="custom-holidays-remove" onClick={() => handleRemove(h.id)}>
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
