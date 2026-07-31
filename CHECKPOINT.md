# Permission App — Improvement State

## Completed
- **Type Safety**: `LeaveType` union type, removed casts, typed state
- **Dead Code**: Removed `_calendarYear` cache and `getCalendarYear()` in CalendarView
- **Lazy Loading**: `TabSkeleton` replaced with inline spinner in App.tsx
- **SVG Extraction**: Inline SVG moved to `EmptyStateIllustration.tsx`
- **CSS cleanup**: Removed unused `.bottom-sheet-backdrop`, `.bottom-sheet`, `@keyframes sheetUp`. Audit confirmed all `.history-type-*`, `.leave-type-*`, `.custom-holidays-*` rules are live. Discovered several missing CSS class definitions (`.report-type-data`, `.overlap-info`, `.install-banner-*`, `.custom-holidays-*` inner elements).
- **React performance**: Added `React.memo` to `MonthCell`, `DetailRow`, `GateIcon`, `EmptyStateIllustration`, `Skeleton`, `TabSkeleton`.
- **Error boundaries**: Wrapped `ToastContainer`, `Onboarding`, `UpdatePrompt` in `ErrorBoundary` in App.tsx.
- **Tests**: Added unit tests for `DatePicker` (15 tests), `EmptyStateIllustration` (5 tests), and `usePushSubscription` (7 tests). All 131 tests pass. TypeScript compiles cleanly.
- **A11y**: Added `aria-label` to `InstallBanner` close button and `CustomHolidays` remove button. Theme toggle, locale toggle, and notification bell already had labels.
- **Bundle size**: Audited all 20 files with Phosphor icon imports — every imported icon is used in JSX. No tree-shaking needed.
- **Missing CSS**: Replaced 40+ missing CSS class names with Tailwind utilities across 10 components. Added proper CSS for `.sheet-backdrop`, `.sheet-panel`, `.sheet-handle`, `.sheet-content` in BottomSheet. Updated tests for class name changes. All 131 tests pass, TypeScript compiles cleanly.
- **PushPermissionGate overlay**: Fixed `PushPermissionGate` rendering `{children}` unconditionally behind the full-screen overlay. Children now only render when the gate is resolved. All 131 tests pass.
- **DatePicker stale closure**: `handleKeyDown` now computes `targetYear`/`targetMonth` before the if/else block, using correct month for final `daysInMonth` clamp after month navigation.
- **Empty `<span />` in Results.tsx**: Removed semantically incorrect empty `<span />` from `no-overlaps` message. All 131 tests pass.
- **Dead code**: Removed unused `Skeleton.tsx` component file — no imports anywhere. All 131 tests pass.
- **A11y**: Added `role="img"` and `aria-label="Empty state illustration"` to `EmptyStateIllustration` SVG. All 132 tests pass.
- **DatePicker focusDay reset**: Changed `useEffect` dependency from `[open, viewMonth, viewYear, value]` to `[open]` so keyboard month navigation in `handleKeyDown` isn't undone. Added `setFocusDay(1)` to `prevMonth`/`nextMonth` buttons. All 132 tests pass, TypeScript compiles cleanly.
- **Bug fix**: `Calculator.tsx` now passes `finalLeaveType` (which correctly maps custom → `"other"`) to `Results` instead of the raw chip `leaveType` value. When a user selected "Custom" leave type, the badge showed the last chip type (e.g. "annual") instead of "other". All 132 tests pass, TypeScript compiles cleanly.
- **Performance**: Moved `tabVariants` definition outside `App.tsx` — no longer recreated on every render. All 132 tests pass, TypeScript compiles cleanly.
- **Bundle size**: Removed unused `results.comma` i18n keys from both locales (Arabic and French). All 132 tests pass, TypeScript compiles cleanly.
- **Lint warnings**: Removed unused `currentYear` function from `DatePicker.test.tsx`. Added suppression comment for intentional `useEffect` deps in `DatePicker.tsx`. All 132 tests pass, TypeScript compiles cleanly, oxlint passes with no warnings.
- **Swipe lock fix**: `App.tsx` now guards `onTouchEnd` too — a `lockedTouchRef` set in `guardedTouchStart` suppresses tab-swiping when the gesture began inside a `[data-swipe-lock]` element (BottomSheet, Onboarding). Previously horizontal drags inside those could switch tabs via stale swipe refs.
- **Live bell badge**: `main.tsx` now dispatches a `notification-received` window event after `addNotification`, so `NotificationBell` refreshes its badge immediately when a push arrives while the app is open.
- **SW font cache**: `activate` now preserves `FONT_CACHE_NAME` (it was being wiped on every activation because the cleanup only excluded `CACHE_NAME`).
- **Stale dashboard holidays**: `monthHolidays` in `DashboardTab` was a `useMemo` with `[]` deps while reading `getCustomHolidays()`; converted to a plain IIFE so it always reflects current localStorage.
- **Dead code**: Removed `src/lib/constants.ts` (unused `algerianMonths`/`getMonthName`), `clearPassedReminders` from `storage.ts`, and the unused `results.comma` i18n keys from both locales.
- **Annual balance removed (by design)**: The app has no consumed-allowance concept — leave types are fully user-configurable (rotational 45/15 schedules, 30/50-day regional entitlements are just numbers the user enters). Removed the entitlement card I had added to `DashboardTab`, plus the orphaned storage API (`getAnnualEntitlement`/`setAnnualEntitlement`/`getTotalDaysUsed`/`isAnnualLeaveType`/`ANNUAL_TYPES`/`ENTITLEMENT_KEY`) and their tests. Kept the single `entitlement.save` i18n key (still used by `CalculatorTab`'s confirm-return button). All tests pass.
- **Bidi date-range fix**: `NextLeaveCard`'s countdown meta line (both the active/upcoming/overdue card and the working-phase card in `CalculatorTab.tsx`) rendered dates scrambled across the arrow (e.g. `21 أوت4 → جويلية`) because Arabic month names (RTL) mixed with Latin digits across the neutral `→`. Added a `LeaveRange` component (LRI/PDI isolates `\u2066`…`\u2069` per date) so the two RTL runs can't merge. Also gave the working-phase meta row `dir="ltr"` and the same `whitespace-nowrap` label·date grouping as the active card.
- **Arabic date display**: `LeaveRange` isolates each part with RLI/PDI (`\u2067`…`\u2069`) and formats dates with `d MMM` (number-then-month logically), which the RTL isolate renders on screen as month-then-number (`جويلية 21 → أوت 4`). The return date's weekday (`EEEE`, locale-aware) renders as a smaller muted span after a `·`, rightmost on screen — so reading right-to-left you see day first, then number, then month (`الثلاثاء 4 أوت`), keeping the number in the center of the month and the day. Return date stays `font-bold text-base`. All 66 tests, typecheck, lint pass.
- **Deterministic date order**: bidi isolate direction proved unreliable for forcing month-then-number (`4 أوت` still rendered number-first regardless of LRI/RLI). `LeaveRange` now splits each date into separate isolated pieces — month (`MMM`), day number (`d`), and weekday (`EEEE`) — rendered in DOM order inside the `dir="ltr"` cards, so the screen order is guaranteed: `جويلية 21 → أوت 4 · الثلاثاء` (month, number, day). Reading right-to-left: day first, then number, then month. All 66 tests, typecheck, lint pass.
- **Dot removed**: dropped the `·` separator between the return number and weekday (kept a narrow space) — renders `جويلية 21 → أوت 4 الثلاثاء`. All 66 tests, typecheck, lint pass.
- **Locale-aware date order**: `LeaveRange` now branches on `locale.code`. Arabic (`ar-DZ`) renders month–number–weekday on screen (`أوت 4 الثلاثاء`, so RTL reading is day-first). French (`fr`) renders weekday–number–month (`mardi 4 août`, standard LTR order), and departure dates swap too (`21 جويلية` vs `21 juillet`). All 66 tests, typecheck, lint pass.
- **Help text alignment**: French `calc.duration.help` no longer claims holidays/weekends are excluded (Arabic never said that); `calc.date.help` now says "fêtes nationales et islamiques" instead of "religieuses et du Ramadan"; `calc.type.help` dropped the extra "(annuel, permission, ...)" list. Also fixed Arabic typo `حدداليوم` → `حدد اليوم`. All 66 tests, typecheck, lint pass.

## Pending


## Rules
- ONE task per iteration. Execute it fully. Verify. Update this file. Stop.
- After completing a task, move it from Pending to Completed above.
- If you discover new improvement opportunities during work, add them to the bottom of Pending.
- Never modify this structure. Only update Completed, Pending, and Current Iteration.
