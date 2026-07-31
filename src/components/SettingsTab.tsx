import { useState, type ReactNode } from "react";
import { Sun, Moon, Monitor, Translate, Trash, Check } from "@phosphor-icons/react";
import { useT } from "@/lib/i18n";
import { useLocale, setLocale } from "@/lib/i18n";
import { useTheme, type Theme } from "@/lib/theme";
import { clearAllData } from "@/lib/storage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; labelKey: string }[] = [
  { value: "light", icon: Sun, labelKey: "settings.theme.light" },
  { value: "dark", icon: Moon, labelKey: "settings.theme.dark" },
  { value: "auto", icon: Monitor, labelKey: "settings.theme.auto" },
];

function AlgeriaFlag() {
  return (
    <svg viewBox="0 0 30 20" className="h-4 w-5 shrink-0 rounded-[3px]">
      <rect width="30" height="20" fill="#fff" />
      <rect width="15" height="20" fill="#006233" />
      <path d="M15 4.5a5.5 5.5 0 1 0 0 11 6.5 6.5 0 1 1 0-11z" fill="#d21034" />
      <path d="M17.2 10l1 1.5 1.7-.6-1 1.5 1 1.5-1.7-.6-1 1.5V10z" fill="#d21034" />
    </svg>
  );
}

function FranceFlag() {
  return (
    <svg viewBox="0 0 30 20" className="h-4 w-5 shrink-0 rounded-[3px]">
      <rect width="10" height="20" fill="#002395" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#ED2939" />
    </svg>
  );
}

function ListOptions<T extends string>({ value, onSelect, options }: {
  value: T;
  onSelect: (v: T) => void;
  options: { value: T; label: string; icon?: ReactNode }[];
}) {
  return (
    <div className="rounded-xl overflow-hidden ring-1 ring-border/60 divide-y divide-border/50 bg-muted/30">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            aria-pressed={active}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors",
              active
                ? "bg-primary-500/10 text-primary-700 dark:text-primary-300"
                : "text-foreground/80 hover:bg-muted/60"
            )}
          >
            {opt.icon && <span className="flex items-center">{opt.icon}</span>}
            <span className="flex-1 text-start">{opt.label}</span>
            {active && <Check className="h-4 w-4 shrink-0" weight="bold" />}
          </button>
        );
      })}
    </div>
  );
}

export function SettingsTab() {
  const t = useT();
  const [locale] = useLocale();
  const [theme, setThemeState] = useTheme();
  const [resetOpen, setResetOpen] = useState(false);

  const handleReset = () => {
    clearAllData();
    window.location.reload();
  };

  return (
    <div className="max-w-md mx-auto px-5 py-6 space-y-6">
      <Card className="border-border/60 shadow-card rounded-2xl overflow-hidden">
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground/70">
            <Sun className="h-4 w-4" />
            {t("settings.theme")}
          </div>
          <ListOptions
            value={theme}
            onSelect={(v) => setThemeState(v)}
            options={THEME_OPTIONS.map((o) => {
              const Icon = o.icon;
              return {
                value: o.value,
                label: t(o.labelKey),
                icon: <Icon className="h-4 w-4" />,
              };
            })}
          />
        </div>
      </Card>

      <Card className="border-border/60 shadow-card rounded-2xl overflow-hidden">
        <div className="p-5 space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-foreground/70">
            <Translate className="h-4 w-4" />
            {t("settings.language")}
          </div>
          <ListOptions
            value={locale}
            onSelect={(v) => setLocale(v)}
            options={[
              { value: "ar", label: t("settings.language.ar"), icon: <AlgeriaFlag /> },
              { value: "fr", label: t("settings.language.fr"), icon: <FranceFlag /> },
            ]}
          />
        </div>
      </Card>

      <div className="pt-2 space-y-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("settings.reset.desc")}
        </p>
        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogTrigger
            render={
              <Button variant="destructive" size="sm" className="w-full h-11 text-xs font-semibold gap-1.5 rounded-xl">
                <Trash className="h-4 w-4" />
                {t("dashboard.resetData")}
              </Button>
            }
          />
          <DialogContent className="rounded-2xl pt-6" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">{t("dashboard.resetData")}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">{t("dashboard.resetConfirm")}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row">
              <Button variant="outline" className="rounded-lg" onClick={() => setResetOpen(false)}>{t("common.cancel")}</Button>
              <Button variant="destructive" className="rounded-lg" onClick={handleReset}>{t("dashboard.resetConfirmYes")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
