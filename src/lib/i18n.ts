import { useState, useEffect } from "react";
import { ar as dfnsAr, fr as dfnsFr } from "date-fns/locale";

const LOCALE_KEY = "permission-locale";

export type Locale = "ar" | "fr";

const strings: Record<Locale, Record<string, string>> = {
  ar: {
    "tab.home": "الرئيسية",
    "tab.calc": "الحاسبة",
    "tab.history": "السجل",

    "calc.duration.label": "مدة العطلة (بالأيام)",
    "calc.duration.placeholder": "أدخل المدة",
    "calc.duration.error.invalid": "يرجى إدخال مدة صحيحة",
    "calc.duration.error.max": "المدة لا تتجاوز 90 يوم",
    "calc.date.label": "تاريخ الذهاب",
    "calc.date.placeholder": "اختر التاريخ",
    "calc.date.warning": "تنبيه: التاريخ يوافق عطلة رسمية",
    "calc.date.error": "يرجى اختيار تاريخ الذهاب",
    "calc.workweek.label": "نظام العمل",
    "calc.workweek.sun-thu": "أحد – خميس",
    "calc.workweek.sat-wed": "سبت – أربعاء",
    "calc.workweek.off.sun-thu": "عطلة: الجمعة + السبت",
    "calc.workweek.off.sat-wed": "عطلة: الخميس + الجمعة",
    "calc.calculate": "احسب",
    "calc.reset": "حساب جديد",

    "results.returnDate": "تاريخ العودة",
    "results.resumeDate": "تاريخ الاستئناف",
    "results.period": "تفاصيل الفترة",
    "results.departure": "تاريخ الانطلاق",
    "results.days": "أيام",
    "results.overlaps.title": "تنبيه: تداخل مع الأعياد ({count})",
    "results.overlaps.badge": "عطلة رسمية",
    "results.overlaps.none": "لا توجد أعياد رسمية خلال هذه الفترة",
    "results.copy": "نسخ الملخص",
    "results.share": "مشاركة",
    "results.print": "طباعة",
    "results.leaveRequest": "إنشاء طلب عطلة",
    "results.copied": "تم نسخ الملخص",
    "results.share.fail": "تعذر النسخ",
    "results.entitlement.used": "المستخدم",
    "results.entitlement.remaining": "المتبقي",
    "results.entitlement.total": "الرصيد",
    "results.disclaimer": "هذه النتائج تقديرية — يرجى تأكيد التواريخ مع مصلحة الموارد البشرية.",
    "results.summary.title": "حاسبة العطل - Permission",

    "home.hero.subtitle": "حاسبة العطل للموظفين الجزائريين",
    "home.feature.calc.title": "حساب تاريخ العودة",
    "home.feature.calc.desc": "مع مراعاة الأعياد الرسمية الإسلامية والوطنية",
    "home.feature.detail.title": "تفاصيل الفترة",
    "home.feature.detail.desc": "تاريخ الانطلاق، العودة، والاستئناف",
    "home.feature.offline.title": "يعمل بدون إنترنت",
    "home.feature.offline.desc": "بعد التثبيت، كل شيء محلي على جهازك",
    "home.donate.title": "دعم التطبيق",
    "home.donate.desc": "إذا أعجبك التطبيق، يمكنك دعمي بأي مبلغ عبر بريدي موب:",
    "home.donate.method": "بريدي موب (Edahabia)",
    "home.donate.copy": "نسخ",
    "home.donate.copied": "تم النسخ!",
    "home.donate.thanks": "جزاك الله خيراً",

    "history.title": "السجل",
    "history.clear": "مسح الكل",
    "history.empty.title": "لا توجد عمليات سابقة",
    "history.empty.desc": "استخدم الحاسبة لحساب عطلتك وسيظهر السجل هنا",
    "history.empty.action": "اذهب للحاسبة",
    "history.day": "يوم",
    "history.overlap": "عطلة",

    "entitlement.label.set": "حدد رصيد العطل السنوي",
    "entitlement.label.edit": "رصيد العطل السنوي (أيام)",
    "entitlement.placeholder": "مثلاً: 30",
    "entitlement.save": "حفظ",
    "entitlement.set": "تعيين",
    "entitlement.edit": "تعديل",
    "entitlement.used": "المستخدم",
    "entitlement.remaining": "المتبقي",
    "entitlement.total": "الإجمالي",
    "entitlement.label.show": "الرصيد السنوي",

    "reminder.dismiss": "تجاهل",
    "reminder.tomorrow": "تاريخ الاستئناف غداً — {date}",
    "reminder.upcoming": "تاريخ الاستئناف بعد {days} أيام — {date}",

    "install.text": "ثبّت التطبيق لاستخدامه دون اتصال",
    "install.button": "تثبيت",

    "onboarding.aria": "شرح التطبيق",
    "onboarding.skip": "تخطي",
    "onboarding.prev": "السابق",
    "onboarding.next": "التالي",
    "onboarding.done": "ابدأ الاستخدام",
    "onboarding.step1.title": "مرحباً بك في Permission",
    "onboarding.step1.desc": "حاسبة العطل للموظفين الجزائريين — تحسب تاريخ عودتك مع مراعاة الأعياد الرسمية الإسلامية والوطنية.",
    "onboarding.step2.title": "تتبع رصيد العطل",
    "onboarding.step2.desc": "حدد رصيدك السنوي مرة واحدة واعرف كم يوماً استخدمت وكم تبقى مباشرة من الصفحة الرئيسية.",
    "onboarding.step3.title": "تذكير بالعودة",
    "onboarding.step3.desc": "بعد كل عملية حساب، يُضاف تذكير آلي يظهر قبل موعد عودتك بثلاثة أيام لتكون مستعداً.",
    "onboarding.step4.title": "حساب العطلة",
    "onboarding.step4.desc": "اختر تاريخ الذهاب وعدد الأيام — التطبيق يحسب تاريخ العودة مع احتساب أيام العطل الرسمية.",
    "onboarding.step5.title": "سجل العمليات",
    "onboarding.step5.desc": "كل عملية حساب تُحفظ تلقائياً في سجل العمليات لتراجعها لاحقاً أو تعيد تحميلها بنقرة واحدة.",

    "error.title": "حدث خطأ في هذه اللوحة",
    "error.retry": "إعادة المحاولة",

    "toast.close": "إغلاق",
    "dp.prev": "الشهر السابق",
    "dp.next": "الشهر التالي",
    "dp.day": "اختيار يوم",
    "dp.dayNamesShort": "ح,ن,ث,ر,خ,ج,س",

    "customHolidays.title": "أعياد مخصصة",
    "customHolidays.nameLabel": "اسم العطلة",
    "customHolidays.dateLabel": "التاريخ",
    "customHolidays.add": "إضافة",

    "pushGate.title": "تنبيهات التطبيق",
    "pushGate.desc": "فعّل الإشعارات لتلقي تحديثات وإعلانات التطبيق مباشرة على هاتفك.",
    "pushGate.feature1": "إشعارات فورية من مسؤول التطبيق",
    "pushGate.feature2": "لا حاجة لحساب — مجاني وآمن",
    "pushGate.feature3": "تعمل حتى في وضع الخلفية",
    "pushGate.subscribe": "تفعيل الإشعارات",
    "pushGate.subscribing": "جارٍ التفعيل…",
    "pushGate.required": "هذه الإشعارات ضرورية لاستخدام التطبيق.",
    "pushGate.denied.title": "الإشعارات مرفوضة",
    "pushGate.denied.desc": "يرجى تفعيل الإذن يدوياً من إعدادات المتصفح.",
    "pushGate.denied.retry": "حاول مجدداً",
    "pushGate.granted.title": "تم التفعيل!",
    "pushGate.granted.desc": "جارٍ فتح التطبيق…",
    "pushGate.error.title": "حدث خطأ",
    "pushGate.error.retry": "إعادة المحاولة",

    "leaveRequest.title": "طلب عطلة",
    "leaveRequest.subtitle": "حاسبة العطل - Permission",
    "leaveRequest.section": "معلومات العطلة",
    "leaveRequest.duration": "مدة العطلة",
    "leaveRequest.day": "يوم",
    "leaveRequest.departure": "تاريخ الانطلاق",
    "leaveRequest.return": "تاريخ العودة",
    "leaveRequest.resume": "تاريخ الاستئناف",
    "leaveRequest.holidays": "الأعياد المتداخلة",
    "leaveRequest.none": "لا يوجد",
    "leaveRequest.employeeSig": "توقيع الموظف",
    "leaveRequest.supervisorSig": "توقيع المشرف",
    "leaveRequest.generatedBy": "تم الإنشاء بواسطة Permission — حاسبة العطل",
    "leaveRequest.fail": "تعذر فتح نافذة الطباعة",

    "results.comma": "،",
  },
  fr: {
    "tab.home": "Accueil",
    "tab.calc": "Calculatrice",
    "tab.history": "Historique",

    "calc.duration.label": "Durée du congé (en jours)",
    "calc.duration.placeholder": "Entrez la durée",
    "calc.duration.error.invalid": "Veuillez entrer une durée valide",
    "calc.duration.error.max": "La durée ne peut pas dépasser 90 jours",
    "calc.date.label": "Date de départ",
    "calc.date.placeholder": "Choisir une date",
    "calc.date.warning": "Attention: cette date est un jour férié",
    "calc.date.error": "Veuillez choisir la date de départ",
    "calc.workweek.label": "Semaine de travail",
    "calc.workweek.sun-thu": "Dim – Jeu",
    "calc.workweek.sat-wed": "Sam – Mer",
    "calc.workweek.off.sun-thu": "Repos: Ven + Sam",
    "calc.workweek.off.sat-wed": "Repos: Jeu + Ven",
    "calc.calculate": "Calculer",
    "calc.reset": "Nouveau calcul",

    "results.returnDate": "Date de retour",
    "results.resumeDate": "Date de reprise",
    "results.period": "Détails de la période",
    "results.departure": "Date de départ",
    "results.days": "jours",
    "results.overlaps.title": "Attention: chevauchement avec des jours fériés ({count})",
    "results.overlaps.badge": "Jour férié",
    "results.overlaps.none": "Aucun jour férié pendant cette période",
    "results.copy": "Copier le résumé",
    "results.share": "Partager",
    "results.leaveRequest": "Générer une demande",
    "results.print": "Imprimer",
    "results.copied": "Résumé copié",
    "results.share.fail": "Échec de la copie",
    "results.entitlement.used": "Utilisé",
    "results.entitlement.remaining": "Restant",
    "results.entitlement.total": "Solde",
    "results.disclaimer": "Ces résultats sont indicatifs — veuillez confirmer les dates auprès des RH.",
    "results.summary.title": "Calculateur de congés - Permission",

    "home.hero.subtitle": "Calculateur de congés pour les employés algériens",
    "home.feature.calc.title": "Calcul de la date de retour",
    "home.feature.calc.desc": "En tenant compte des jours fériés nationaux et religieux",
    "home.feature.detail.title": "Détails de la période",
    "home.feature.detail.desc": "Date de départ, retour et reprise",
    "home.feature.offline.title": "Fonctionne hors ligne",
    "home.feature.offline.desc": "Après installation, tout est stocké localement",
    "home.donate.title": "Soutenir l'application",
    "home.donate.desc": "Si vous aimez l'application, vous pouvez me soutenir via Baridimob:",
    "home.donate.method": "Baridimob (Edahabia)",
    "home.donate.copy": "Copier",
    "home.donate.copied": "Copié!",
    "home.donate.thanks": "Merci beaucoup",

    "history.title": "Historique",
    "history.clear": "Tout effacer",
    "history.empty.title": "Aucun calcul précédent",
    "history.empty.desc": "Utilisez la calculatrice pour calculer votre congé, l'historique apparaîtra ici",
    "history.empty.action": "Aller à la calculatrice",
    "history.day": "jour",
    "history.overlap": "férié",

    "entitlement.label.set": "Définir le solde annuel de congés",
    "entitlement.label.edit": "Solde annuel de congés (jours)",
    "entitlement.placeholder": "Ex: 30",
    "entitlement.save": "Enregistrer",
    "entitlement.set": "Définir",
    "entitlement.edit": "Modifier",
    "entitlement.used": "Utilisé",
    "entitlement.remaining": "Restant",
    "entitlement.total": "Total",
    "entitlement.label.show": "Solde annuel",

    "reminder.dismiss": "Ignorer",
    "reminder.tomorrow": "Reprise demain — {date}",
    "reminder.upcoming": "Reprise dans {days} jours — {date}",

    "install.text": "Installez l'application pour l'utiliser hors ligne",
    "install.button": "Installer",

    "onboarding.aria": "Guide de l'application",
    "onboarding.skip": "Passer",
    "onboarding.prev": "Précédent",
    "onboarding.next": "Suivant",
    "onboarding.done": "Commencer",
    "onboarding.step1.title": "Bienvenue sur Permission",
    "onboarding.step1.desc": "Calculateur de congés pour les employés algériens — calcule votre date de retour en tenant compte des jours fériés nationaux et religieux.",
    "onboarding.step2.title": "Suivi du solde",
    "onboarding.step2.desc": "Définissez votre solde annuel une fois et voyez combien de jours vous avez utilisés et combien il reste directement depuis l'accueil.",
    "onboarding.step3.title": "Rappel de reprise",
    "onboarding.step3.desc": "Après chaque calcul, un rappel automatique s'affiche trois jours avant votre date de reprise.",
    "onboarding.step4.title": "Calcul du congé",
    "onboarding.step4.desc": "Choisissez la date de départ et la durée — l'application calcule la date de retour en incluant les jours fériés.",
    "onboarding.step5.title": "Historique",
    "onboarding.step5.desc": "Chaque calcul est automatiquement sauvegardé dans l'historique pour le consulter ou le recharger en un clic.",

    "error.title": "Une erreur est survenue",
    "error.retry": "Réessayer",

    "toast.close": "Fermer",
    "dp.prev": "Mois précédent",
    "dp.next": "Mois suivant",
    "dp.day": "Choisir un jour",
    "dp.dayNamesShort": "D,L,Ma,Me,J,V,S",

    "customHolidays.title": "Jours fériés personnalisés",
    "customHolidays.nameLabel": "Nom du jour férié",
    "customHolidays.dateLabel": "Date",
    "customHolidays.add": "Ajouter",

    "pushGate.title": "Notifications de l'application",
    "pushGate.desc": "Activez les notifications pour recevoir les mises à jour et annonces directement sur votre téléphone.",
    "pushGate.feature1": "Notifications instantanées de l'administrateur",
    "pushGate.feature2": "Pas de compte requis — gratuit et sécurisé",
    "pushGate.feature3": "Fonctionne même en arrière-plan",
    "pushGate.subscribe": "Activer les notifications",
    "pushGate.subscribing": "Activation en cours…",
    "pushGate.required": "Ces notifications sont nécessaires pour utiliser l'application.",
    "pushGate.denied.title": "Notifications refusées",
    "pushGate.denied.desc": "Veuillez activer l'autorisation manuellement dans les paramètres du navigateur.",
    "pushGate.denied.retry": "Réessayer",
    "pushGate.granted.title": "Activé !",
    "pushGate.granted.desc": "Ouverture de l'application…",
    "pushGate.error.title": "Une erreur est survenue",
    "pushGate.error.retry": "Réessayer",

    "leaveRequest.title": "Demande de congé",
    "leaveRequest.subtitle": "Calculateur de congés - Permission",
    "leaveRequest.section": "Informations du congé",
    "leaveRequest.duration": "Durée du congé",
    "leaveRequest.day": "jour",
    "leaveRequest.departure": "Date de départ",
    "leaveRequest.return": "Date de retour",
    "leaveRequest.resume": "Date de reprise",
    "leaveRequest.holidays": "Jours fériés inclus",
    "leaveRequest.none": "Aucun",
    "leaveRequest.employeeSig": "Signature de l'employé",
    "leaveRequest.supervisorSig": "Signature du responsable",
    "leaveRequest.generatedBy": "Généré par Permission — Calculateur de congés",
    "leaveRequest.fail": "Impossible d'ouvrir la fenêtre d'impression",

    "results.comma": ",",
  },
};

export function getStoredLocale(): Locale {
  const v = localStorage.getItem(LOCALE_KEY);
  if (v === "fr") return "fr";
  return "ar";
}

export function setStoredLocale(l: Locale): void {
  localStorage.setItem(LOCALE_KEY, l);
}

let currentLocale: Locale = getStoredLocale();
const listeners = new Set<() => void>();

export function setLocale(l: Locale): void {
  currentLocale = l;
  setStoredLocale(l);
  document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = l;
  listeners.forEach((fn) => fn());
}

// Initialize direction on load
document.documentElement.dir = currentLocale === "ar" ? "rtl" : "ltr";
document.documentElement.lang = currentLocale;

export function getLocale(): Locale {
  return currentLocale;
}

export function useLocale(): [Locale, (l: Locale) => void] {
  const [loc, setLoc] = useState(currentLocale);
  useEffect(() => {
    const fn = () => setLoc(currentLocale);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return [loc, setLocale];
}

export function t(key: string, params?: Record<string, string | number>): string {
  let val = strings[currentLocale]?.[key] ?? strings.ar[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      val = val.replace(`{${k}}`, String(v));
    }
  }
  return val;
}

export function useT() {
  useLocale();
  return t;
}

export function getDateFnsLocale() {
  return currentLocale === "fr" ? dfnsFr : dfnsAr;
}
