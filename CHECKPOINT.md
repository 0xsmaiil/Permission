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

## Pending


## Rules
- ONE task per iteration. Execute it fully. Verify. Update this file. Stop.
- After completing a task, move it from Pending to Completed above.
- If you discover new improvement opportunities during work, add them to the bottom of Pending.
- Never modify this structure. Only update Completed, Pending, and Current Iteration.
