# Improvement Pass

Improve this Permission PWA. Execute steps in order, verify each.

## 1. Type Safety
In `src/lib/storage.ts`, change `LeaveType` from `string` to a proper union:
`"annual" | "sick" | "monthly" | "unpaid" | "maternity" | "other"`
Remove all `as LeaveType` casts across the codebase.

## 2. Remove Dead Code
Delete `CalendarView.tsx` module-level `_calendarYear` cache variable and `getCalendarYear()` function. Replace usage with `new Date().getFullYear()` inline.

## 3. Lazy Route Components
Move `TabSkeleton` from `App.tsx` into each tab's lazy chunk so the outer `Suspense` fallback is a minimal inline spinner instead of importing the whole skeleton component eagerly.

## 4. Extract Inline SVGs
Move the hardcoded SVG in `HistoryTab.tsx` empty-state into a separate `EmptyStateIllustration` component file.

## 5. Verify
Run `npx tsc --noEmit` and `npx vitest run`. Fix any failures.

## 6. Report
Write results to `CHECKPOINT.md`. Stop. Do NOT loop.
