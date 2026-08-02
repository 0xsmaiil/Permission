# Permission

An Algerian leave calculator built as a mobile-first Progressive Web App. Calculate annual leave entitlements with automatic handling of Algerian public holidays, and get reminders via push notifications.

## Features

- **Leave calculator** — computes annual leave based on hire date and work schedule, accounting for Algerian public holidays.
- **Dashboard** — overview of remaining leave, history, and upcoming entitlements.
- **Notifications** — opt-in push reminders (web push + Supabase), with an in-app permission gate and notification bell.
- **Bilingual UI** — supports Arabic and French with right-to-left layout.
- **Theme support** — light/dark mode.
- **Installable PWA** — full-screen install landing page for Android and iOS, offline support via service worker.

## Tech Stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [Vite](https://vite.dev) with `vite-plugin-pwa`
- [Tailwind CSS v4](https://tailwindcss.com)
- [Supabase](https://supabase.com) (backend) + [web-push](https://github.com/web-push-libs/web-push) (notifications)
- Telegram bot (admin)
- [Vitest](https://vitest.dev) for tests, [oxlint](https://oxc.rs/docs/guide/usage/linter/rules) for linting
- Deployed on [Vercel](https://vercel.com)

## Getting Started

Requirements: Node.js >= 20.19.

```bash
npm install
npm run dev
```

## Available Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the Vite dev server            |
| `npm run build`     | Lint, typecheck, and production build |
| `npm run preview`   | Preview the production build         |
| `npm run test`      | Run the test suite (Vitest)          |
| `npm run lint`      | Lint with oxlint                     |
| `npm run typecheck` | Type-check with `tsc -b`             |

## Project Structure

```
src/
  components/   UI components (tabs, install page, push gate, ...)
  hooks/        React hooks (PWA install, push subscription, swipe, ...)
  lib/          Utilities (dates, holidays, storage, i18n, notifications, ...)
  App.tsx       Root component: routes between install landing and the main app
```

## Configuration

Environment variables are loaded from `.env` / `.env.local`:

- Supabase credentials used by `src/lib/supabaseClient.ts`
- Web push VAPID keys for the notification service

See `.env.example` (if present) for the expected variables.

## Testing

The test suite covers holiday calculations, date utilities, local storage, and push subscription behavior:

```bash
npm run test
```

## License

Private project.
