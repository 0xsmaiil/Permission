import type { Locale } from "./i18n";

export const algerianMonths = {
  ar: [
    "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
    "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ] as const,
  fr: [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ] as const,
};

export function getMonthName(month: number, locale: Locale = "ar"): string {
  return algerianMonths[locale][month];
}
