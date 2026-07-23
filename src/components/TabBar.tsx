import { House, Calculator, ClockCounterClockwise } from "@phosphor-icons/react";

const tabs = [
  { id: 0, label: "الرئيسية", icon: House },
  { id: 1, label: "الحاسبة", icon: Calculator },
  { id: 2, label: "السجل", icon: ClockCounterClockwise },
];

interface Props {
  activeTab: number;
  onTabChange: (id: number) => void;
}

export function TabBar({ activeTab, onTabChange }: Props) {
  return (
    <nav className="tab-bar">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          className={`tab-item ${activeTab === t.id ? "tab-active" : ""}`}
        >
          <t.icon size={22} weight={activeTab === t.id ? "fill" : "duotone"} />
          <span className="tab-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
