import { House, Calculator, ClockCounterClockwise } from "@phosphor-icons/react";
import { useT as useTr } from "../lib/i18n";

const tabs = [
  { id: 0, label: "tab.home", icon: House },
  { id: 1, label: "tab.calc", icon: Calculator },
  { id: 2, label: "tab.history", icon: ClockCounterClockwise },
];

interface Props {
  activeTab: number;
  onTabChange: (id: number) => void;
}

export function TabBar({ activeTab, onTabChange }: Props) {
  const tr = useTr();
  return (
    <nav className="tab-bar" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={activeTab === t.id}
          onClick={() => onTabChange(t.id)}
          className={`tab-item ${activeTab === t.id ? "tab-active" : ""}`}
        >
          <t.icon size={22} weight={activeTab === t.id ? "fill" : "duotone"} />
          <span className="tab-label">{tr(t.label)}</span>
        </button>
      ))}
    </nav>
  );
}
