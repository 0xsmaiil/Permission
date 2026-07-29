import type { Icon } from "@phosphor-icons/react";
import { useT } from "@/lib/i18n";

interface Tab {
  icon: Icon;
  labelKey: string;
}

interface Props {
  tabs: Tab[];
  activeTab: number;
  onTabChange: (id: number) => void;
}

export function TabBar({ tabs, activeTab, onTabChange }: Props) {
  const t = useT();
  return (
    <nav
      dir="ltr"
      className="fixed bottom-0 inset-x-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border/50 safe-bottom"
      role="tablist"
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const isActive = activeTab === i;
          return (
            <button
              key={i}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(i)}
              className="relative flex flex-col items-center justify-center gap-0.5 h-full w-full transition-all duration-200"
            >
              <span
                className={`flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-primary-500/15 dark:bg-primary-400/15 text-primary-600 dark:text-primary-400"
                    : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-all duration-200 ${
                    isActive ? "scale-110" : ""
                  }`}
                  weight={isActive ? "fill" : "bold"}
                />
                <span className={`text-[10px] ${isActive ? "font-semibold" : "font-medium"}`}>
                  {t(tab.labelKey)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}