import { useState, useEffect } from "react";
import { ar as dfnsAr, fr as dfnsFr, type Locale as DfnsLocale } from "date-fns/locale";

const ALGERIAN_MONTHS = {
  narrow: ["ج", "ف", "م", "أ", "م", "ج", "ج", "أ", "س", "أ", "ن", "د"],
  abbreviated: [
    "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
    "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ],
  wide: [
    "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
    "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
  ],
};

function algerianMonthName(monthIndex: number, options?: { width?: string }): string {
  const width = (options?.width ?? "wide") as keyof typeof ALGERIAN_MONTHS;
  return ALGERIAN_MONTHS[width]?.[monthIndex] ?? "";
}

const arDzLocale: DfnsLocale = {
  ...dfnsAr,
  code: "ar-DZ",
  localize: {
    ...dfnsAr.localize,
    month: algerianMonthName,
  },
};

const LOCALE_KEY = "permission-locale";

export type Locale = "ar" | "fr";

export const strings: Record<Locale, Record<string, string>> = {
  ar: {
    "tab.home": "الرئيسية",
    "tab.calc": "الحاسبة",
    "tab.history": "السجل",
    "tab.calendar": "الرزنامة",
    "tab.dashboard": "لوحة التحكم",
    "tab.settings": "الإعدادات",
    "tab.aria": "التنقل بين الأقسام",

    "calc.duration.label": "مدة العطلة (بالأيام)",
    "calc.duration.help": "أدخل عدد أيام الغياب عن العمل يحسب تاريخ العودة من هذه المدة الحد الأقصى سنتان (730 يومًا).",
    "calc.duration.placeholder": "أدخل المدة",
    "calc.duration.error.invalid": "يرجى إدخال مدة صحيحة",
    "calc.duration.error.max": "المدة لا تتجاوز سنتين",
    "calc.date.label": "تاريخ الذهاب",
    "calc.date.help": "حدد اليوم الذي تبدأ فيه عطلتك تحسب تواريخ العودة والاستئناف تلقائيًا مع مراعاة الأعياد الوطنية والإسلامية مع تنبيهك إذا كان التاريخ يوافق عطلة ما.",
    "calc.date.placeholder": "اختر التاريخ",
    "calc.date.warning": "تنبيه: التاريخ يوافق عطلة رسمية",
    "calc.date.error": "يرجى اختيار تاريخ الذهاب",
    "calc.calculate": "احسب",
    "calc.reset": "حساب جديد",
    "calc.saved": "تم الحفظ في السجل",
    "calc.duplicate": "موجود مسبقاً في السجل",
    "calc.returnIn": "العودة بعد",
    "calc.leaveIn": "المغادرة بعد",
    "calc.nextLeave.ask": "متى تكون إجازتك القادمة؟",
    "calc.return.confirm": "تأكيد العودة",
    "calc.return.overdue": "متأخر {days} أيام",
    "calc.return.late": "تأخر {days} أيام عن الموعد",
    "calc.return.onTime": "في الوقت المحدد",
    "calc.work.inputLabel": "عدد أيام العمل قبل العطلة القادمة",
    "calc.work.inputError": "أدخل عدد أيام صحيح بين 1 و {max}",
    "calc.work.remaining": "متبقي {days} يوم عمل",

    "calc.type.label": "نوع العطلة",
    "calc.type.help": "اختر نوع العطلة — يظهر في سجلّك ويُصنّف إحصائياتك في لوحة التحكم.",
    "calc.type.conge": "سنوية",
    "calc.type.permission": "إجازة",
    "calc.type.convalescence": "مرضية",
    "calc.type.absent": "غياب",
    "calc.type.other": "أخرى",
    "calc.type.other.placeholder": "اكتب نوع العطلة...",

    "results.returnDate": "تاريخ العودة",
    "results.resumeDate": "تاريخ الاستئناف",
    "results.period": "تفاصيل الفترة",
    "results.departure": "تاريخ الانطلاق",
    "results.days": "أيام",
    "results.title": "ملخص العطلة",
    "results.overlaps.title": "تنبيه: تداخل مع الأعياد ({count})",
    "results.overlaps.badge": "عطلة رسمية",
    "results.overlaps.none": "لا توجد أعياد رسمية خلال هذه الفترة",
    "results.copy": "نسخ الملخص",
    "results.share": "مشاركة",
    "results.print": "طباعة",
    "results.leaveRequest": "إنشاء طلب عطلة",
    "results.copied": "تم نسخ الملخص",
    "results.share.fail": "تعذر النسخ",
    "results.save": "حفظ في السجل",
    "results.saved": "تم الحفظ ✓",
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

    "settings.theme": "المظهر",
    "settings.theme.light": "فاتح",
    "settings.theme.dark": "داكن",
    "settings.theme.auto": "تلقائي",
    "settings.language": "اللغة",
    "settings.language.ar": "العربية",
    "settings.language.fr": "الفرنسية",
    "settings.reset.desc": "سيؤدي الضغط على هذا الزر إلى مسح جميع بياناتك من هذا الجهاز بشكل نهائي: سجل الحسابات، رصيد العطل السنوي، التذكيرات المجدولة والإعدادات. بعد المزامنة ستبدأ من الصفر، ولا يمكن استرجاع أي من هذه البيانات. تأكد قبل المتابعة.",

    "home.holidays.title": "الأعياد الرسمية {year}",

    "analytics.chart.label": "{year}",
    "analytics.leaves": "عطلة",
    "analytics.avgDays": "متوسط الأيام",
    "analytics.overlaps": "أعياد",
    "analytics.topMonth": "أكثر شهر",
    "analytics.noData": "لا بيانات",
    "analytics.recent": "آخر العمليات",

    "dashboard.holidays.thisMonth": "أعياد هذا الشهر",
    "dashboard.holidays.nextMonth": "الشهر القادم: {count} أعياد",
    "dashboard.holidays.none": "لا توجد أعياد رسمية هذا الشهر",
    "dashboard.chartAria": "مخطط الرصيد: {days} يوم إجمالاً",
    "dashboard.upcoming": "القادمة",
    "dashboard.resetData": "مسح كل البيانات",
    "dashboard.resetConfirm": "سيتم مسح كل البيانات (السجل، الرصيد، التذكيرات) بشكل نهائي. هل أنت متأكد؟",
    "dashboard.resetConfirmYes": "نعم، امسح الكل",
    "dashboard.reminders.title": "التذكيرات",
    "dashboard.reminders.none": "لا توجد تذكيرات",
    "dashboard.reminders.departure": "ذهاب",
    "dashboard.reminders.return": "عودة",
    "dashboard.reminders.today": "اليوم",
    "dashboard.reminders.tomorrow": "غداً",
    "dashboard.reminders.inDays": "بعد {days} أيام",

    "holiday.type.national": "وطني",
    "holiday.type.religious": "ديني",
    "holiday.type.custom": "مخصص",

    "report.title": "التقرير السنوي",
    "report.totalDays": "مجموع الأيام",
    "report.leaves": "عطلة",
    "report.byType": "حسب النوع",
    "report.topMonth": "أكثر شهر",
    "report.noData": "لا توجد بيانات",
    "report.avg": "معدل",

    "history.title": "السجل",
    "history.clear": "مسح الكل",
    "history.empty.title": "لا توجد عمليات سابقة",
    "history.empty.desc": "استخدم الحاسبة لحساب عطلتك وسيظهر السجل هنا",
    "history.empty.action": "اذهب للحاسبة",
    "history.day": "يوم",
    "history.overlap": "عطلة",
    "history.returnLabel": "العودة",
    "history.clearConfirm": "هل تريد مسح كل السجل؟",
    "history.clearConfirmYes": "نعم، امسح",
    "history.clearConfirmDesc": "سيتم حذف كل السجل بشكل دائم ولا يمكن التراجع عن هذا الإجراء.",
    "common.cancel": "إلغاء",
    "common.close": "إغلاق",
    "common.dialog": "نافذة منبثقة",
    "common.notifications": "الإشعارات",
    "common.noNotifications": "لا توجد إشعارات بعد",
    "common.push": "إشعارات",
    "common.langSwitch": "الفرنسية",
    "common.dismiss": "تجاهل",

    "entitlement.save": "حفظ",

    "reminder.dismiss": "تجاهل",
    "reminder.tomorrow": "تاريخ الاستئناف غداً — {date}",
    "reminder.upcoming": "تاريخ الاستئناف بعد {days} أيام — {date}",
    "reminder.leavesTomorrow": "العطلة تبدأ غداً — {date}",
    "reminder.leavesIn": "العطلة تبدأ بعد {days} أيام — {date}",
    "reminder.departureTomorrow": "تبدأ عطلتك غداً — {date}",

    "update.ready": "تحديث جديد",
    "update.refresh": "تحديث",
    "update.close": "إغلاق",

    "install.landing.title": "حاسبة العطل",
    "install.landing.desc": "ثبّت التطبيق لاستخدامه دون اتصال مع احتساب الأعياد الرسمية",
    "install.landing.android": "تثبيت على Android",
    "install.landing.ios": "تثبيت على iPhone",
    "install.landing.shareLabel": "مشاركة",
    "install.landing.iosHint": "اضغط على أيقونة المشاركة أعلاه ثم اختر 'إضافة إلى الشاشة الرئيسية'",
    "install.landing.androidFallback": "للتثبيت على أندرويد، يرجى فتح الرابط في متصفح Google Chrome.",
    "install.landing.androidHintLabel": "Google Chrome",
    "install.landing.installing": "جاري التثبيت...",
    "install.landing.installed": "تم التثبيت ✓",
    "install.landing.installingHint": "لا داعي للضغط مرة أخرى، التطبيق يُثبّت الآن",
    "install.landing.alreadyInstalling": "التثبيت قيد التنفيذ، تحقق من شاشتك الرئيسية",
    "install.landing.alreadyInstalled": "التطبيق مثبت مسبقاً على جهازك",
    "install.landing.subtitle": "حاسبة العطل للموظفين الجزائريين",
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
    "onboarding.dot": "الخطوة {index}",

    "error.title": "حدث خطأ في هذه اللوحة",
    "error.retry": "إعادة المحاولة",

    "toast.close": "إغلاق",
    "dp.prev": "الشهر السابق",
    "dp.next": "الشهر التالي",
    "dp.day": "اختيار يوم",
    "dp.dayNamesShort": "ح,ن,ث,ر,خ,ج,س",

    "calendar.title": "الرزنامة",
    "bridge.title": "أفضل مواعيد العطل",
    "bridge.month": "اختر الشهر",
    "bridge.result": "انطلاق {date}: {total} أيام عطلة (بـ 3 أيام عمل)",

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
    "pushGate.error.supabase": "Supabase غير مهيأ. تأكد من ضبط المتغيرات.",
    "pushGate.error.unsupported": "المتصفح لا يدعم الإشعارات الفورية.",
    "pushGate.error.sw": "لم يتم تفعيل Service Worker",
    "pushGate.error.unexpected": "حدث خطأ غير متوقع.",
    "pushGate.skip": "تخطي",

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

    "share.title": "تفاصيل العطلة",
    "share.body": "📋 تفاصيل العطلة:\n\n• نوع العطلة: {leaveType}\n• تاريخ الخروج: {startDate}\n• المدة: {duration} يوم\n• تاريخ انتهاء العطلة: {returnDate}\n\n✅ تاريخ استئناف العمل: {resumeDate}\n\n⏳ تم الحساب بواسطة تطبيق حاسبة العطل.",
    "share.button": "مشاركة",
    "share.copy": "نسخ",
    "share.copied": "تم النسخ",

    "leaveType.conge": "سنوية",
    "leaveType.permission": "إجازة",
    "leaveType.convalescence": "مرضية",
    "leaveType.absent": "غياب",
    "leaveType.annual": "سنوية",
    "leaveType.sick": "مرضية",
    "leaveType.monthly": "شهرية",
    "leaveType.other": "أخرى",
  },
  fr: {
    "tab.home": "Accueil",
    "tab.calc": "Calculatrice",
    "tab.history": "Historique",
    "tab.calendar": "Calendrier",
    "tab.dashboard": "Tableau de bord",
    "tab.settings": "Paramètres",
    "tab.aria": "Navigation entre les onglets",

    "calc.duration.label": "Durée du congé (en jours)",
    "calc.duration.help": "Indiquez le nombre de jours d'absence du travail. La date de retour est calculée à partir de cette durée. Maximum : deux ans (730 jours).",
    "calc.duration.placeholder": "Entrez la durée",
    "calc.duration.error.invalid": "Veuillez entrer une durée valide",
    "calc.duration.error.max": "La durée ne peut pas dépasser 2 ans",
    "calc.date.label": "Date de départ",
    "calc.date.help": "Choisissez le jour où votre congé commence. Les dates de retour et de reprise sont calculées automatiquement en tenant compte des fêtes nationales et islamiques, avec un avertissement si la date coïncide avec un jour férié.",
    "calc.date.placeholder": "Choisir une date",
    "calc.date.warning": "Attention: cette date est un jour férié",
    "calc.date.error": "Veuillez choisir la date de départ",
    "calc.calculate": "Calculer",
    "calc.reset": "Nouveau calcul",
    "calc.saved": "Enregistré dans l'historique",
    "calc.duplicate": "Déjà enregistré",
    "calc.returnIn": "Retour dans",
    "calc.leaveIn": "Départ dans",
    "calc.nextLeave.ask": "Quand est votre prochain congé ?",
    "calc.return.confirm": "Confirmer le retour",
    "calc.return.overdue": "En retard de {days} jours",
    "calc.return.late": "{days} jours de retard",
    "calc.return.onTime": "À l'heure",
    "calc.work.inputLabel": "Jours de travail avant le prochain congé",
    "calc.work.inputError": "Entrez un nombre de jours valide entre 1 et {max}",
    "calc.work.remaining": "{days} jours de travail restants",

    "calc.type.label": "Type de congé",
    "calc.type.help": "Choisissez le type de congé — il figure dans votre historique et classe vos statistiques dans le tableau de bord.",
    "calc.type.conge": "Congé",
    "calc.type.permission": "Permission",
    "calc.type.convalescence": "Convalescence",
    "calc.type.absent": "Absent",
    "calc.type.other": "Autre",
    "calc.type.other.placeholder": "Saisir le type de congé...",

    "results.returnDate": "Date de retour",
    "results.resumeDate": "Date de reprise",
    "results.period": "Détails de la période",
    "results.departure": "Date de départ",
    "results.days": "jours",
    "results.title": "Résumé du congé",
    "results.overlaps.title": "Attention: chevauchement avec des jours fériés ({count})",
    "results.overlaps.badge": "Jour férié",
    "results.overlaps.none": "Aucun jour férié pendant cette période",
    "results.copy": "Copier le résumé",
    "results.share": "Partager",
    "results.leaveRequest": "Générer une demande",
    "results.print": "Imprimer",
    "results.copied": "Résumé copié",
    "results.share.fail": "Échec de la copie",
    "results.save": "Enregistrer",
    "results.saved": "Enregistré ✓",
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

    "settings.theme": "Thème",
    "settings.theme.light": "Clair",
    "settings.theme.dark": "Sombre",
    "settings.theme.auto": "Auto",
    "settings.language": "Langue",
    "settings.language.ar": "العربية",
    "settings.language.fr": "Français",
    "settings.reset.desc": "Appuyer sur ce bouton effacera définitivement toutes vos données de cet appareil : l'historique de vos congés, votre solde annuel, vos rappels programmés et vos paramètres. Vous repartirez de zéro et aucune de ces données ne pourra être récupérée. Assurez-vous avant de continuer.",

    "home.holidays.title": "Jours fériés {year}",

    "analytics.chart.label": "{year}",
    "analytics.leaves": "congés",
    "analytics.avgDays": "moy. jours",
    "analytics.overlaps": "fériés",
    "analytics.topMonth": "pic",
    "analytics.noData": "aucune donnée",
    "analytics.recent": "Récents",

    "dashboard.holidays.thisMonth": "Jours fériés ce mois",
    "dashboard.holidays.nextMonth": "Mois prochain: {count} jours fériés",
    "dashboard.holidays.none": "Aucun jour férié ce mois",
    "dashboard.chartAria": "Graphique du solde: {days} jours au total",
    "dashboard.upcoming": "À venir",
    "dashboard.resetData": "Réinitialiser les données",
    "dashboard.resetConfirm": "Toutes les données (historique, solde, rappels) seront définitivement effacées. Êtes-vous sûr ?",
    "dashboard.resetConfirmYes": "Oui, tout effacer",
    "dashboard.reminders.title": "Rappels",
    "dashboard.reminders.none": "Aucun rappel",
    "dashboard.reminders.departure": "Départ",
    "dashboard.reminders.return": "Retour",
    "dashboard.reminders.today": "Aujourd'hui",
    "dashboard.reminders.tomorrow": "Demain",
    "dashboard.reminders.inDays": "Dans {days} jours",

    "holiday.type.national": "National",
    "holiday.type.religious": "Religieux",
    "holiday.type.custom": "Personnalisé",

    "report.title": "Rapport annuel",
    "report.totalDays": "Total jours",
    "report.leaves": "congés",
    "report.byType": "Par type",
    "report.topMonth": "Mois le plus chargé",
    "report.noData": "Aucune donnée",
    "report.avg": "moy.",

    "history.title": "Historique",
    "history.clear": "Tout effacer",
    "history.empty.title": "Aucun calcul précédent",
    "history.empty.desc": "Utilisez la calculatrice pour calculer votre congé, l'historique apparaîtra ici",
    "history.empty.action": "Aller à la calculatrice",
    "history.day": "jour",
    "history.overlap": "férié",
    "history.returnLabel": "Retour",
    "history.clearConfirm": "Effacer tout l'historique ?",
    "history.clearConfirmYes": "Oui, effacer",
    "history.clearConfirmDesc": "Tout l'historique sera définitivement supprimé. Cette action est irréversible.",
    "common.cancel": "Annuler",
    "common.close": "Fermer",
    "common.dialog": "Boîte de dialogue",
    "common.notifications": "Notifications",
    "common.noNotifications": "Pas encore de notifications",
    "common.push": "Push",
    "common.langSwitch": "العربية",
    "common.dismiss": "Ignorer",

    "entitlement.save": "Enregistrer",

    "reminder.dismiss": "Ignorer",
    "reminder.tomorrow": "Reprise demain — {date}",
    "reminder.upcoming": "Reprise dans {days} jours — {date}",
    "reminder.leavesTomorrow": "Congé demain — {date}",
    "reminder.leavesIn": "Congé dans {days} jours — {date}",
    "reminder.departureTomorrow": "Votre congé commence demain — {date}",

    "update.ready": "Nouvelle mise à jour disponible",
    "update.refresh": "Mettre à jour",
    "update.close": "Fermer",

    "install.landing.title": "Permission",
    "install.landing.desc": "Installez l'application pour l'utiliser hors ligne avec calcul des jours fériés",
    "install.landing.android": "Installer sur Android",
    "install.landing.ios": "Installer sur iPhone",
    "install.landing.shareLabel": "Partager",
    "install.landing.iosHint": "Appuyez sur l'icône de partage ci-dessus puis 'Ajouter à l'écran d'accueil'",
    "install.landing.androidFallback": "Pour installer sur Android, veuillez ouvrir le lien dans Google Chrome.",
    "install.landing.androidHintLabel": "Google Chrome",
    "install.landing.installing": "Installation en cours...",
    "install.landing.installed": "Installée ✓",
    "install.landing.installingHint": "Pas besoin de cliquer à nouveau, l'application s'installe",
    "install.landing.alreadyInstalling": "L'installation est déjà en cours, vérifiez votre écran d'accueil",
    "install.landing.alreadyInstalled": "L'application est déjà installée sur votre appareil",
    "install.landing.subtitle": "Calculateur de congés pour les employés algériens",
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
    "onboarding.dot": "Étape {index}",

    "error.title": "Une erreur est survenue",
    "error.retry": "Réessayer",

    "toast.close": "Fermer",
    "dp.prev": "Mois précédent",
    "dp.next": "Mois suivant",
    "dp.day": "Choisir un jour",
    "dp.dayNamesShort": "D,L,Ma,Me,J,V,S",

    "calendar.title": "Calendrier",
    "bridge.title": "Meilleures dates de congé",
    "bridge.month": "Choisir un mois",
    "bridge.result": "Départ {date}: {total} jours de congé (avec 3 jours)",

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
    "pushGate.error.supabase": "Supabase n'est pas configuré. Vérifiez les variables d'environnement.",
    "pushGate.error.unsupported": "Le navigateur ne prend pas en charge les notifications push.",
    "pushGate.error.sw": "Le Service Worker n'a pas pu être activé",
    "pushGate.error.unexpected": "Une erreur inattendue est survenue.",
    "pushGate.skip": "Passer",

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

    "share.title": "Détails du congé",
    "share.body": "📋 Détails du congé :\n\n• Type de congé : {leaveType}\n• Date de départ : {startDate}\n• Durée : {duration} jours\n• Date de retour : {returnDate}\n\n✅ Date de reprise : {resumeDate}\n\n⏳ Calculé par Permission — Calculateur de congés.",
    "share.button": "Partager",
    "share.copy": "Copier",
    "share.copied": "Copié !",

    "leaveType.conge": "Congé",
    "leaveType.permission": "Permission",
    "leaveType.convalescence": "Convalescence",
    "leaveType.absent": "Absent",
    "leaveType.annual": "Annuel",
    "leaveType.sick": "Maladie",
    "leaveType.monthly": "Mensuel",
    "leaveType.other": "Autre",
  },
};

export function getStoredLocale(): Locale {
  try {
    const v = localStorage.getItem(LOCALE_KEY);
    if (v === "fr") return "fr";
  } catch {
    // Storage unavailable — fall through to default.
  }
  return "ar";
}

export function setStoredLocale(l: Locale): void {
  try {
    localStorage.setItem(LOCALE_KEY, l);
  } catch {
    // Storage unavailable (private mode, quota) — fail silently.
  }
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
  return currentLocale === "fr" ? dfnsFr : arDzLocale;
}
