# Permission — Algerian Leave Calculator

## Tech Stack
- React 19, TypeScript, Tailwind CSS v4
- Vite, Vitest, oxlint
- Supabase (backend), Telegram bot (admin)
- Vercel (deployment)

## PWA Install Landing Page
The app shows a full-screen install page when accessed via browser (not standalone).
Two buttons: Android (triggers beforeinstallprompt) and iPhone (shows iOS install guide).
`beforeinstallprompt` is captured at **module level** in `src/hooks/usePWAInstall.ts` (runs before React mounts — the event fires too early for useEffect).

## Push Permission Gate
`src/components/PushPermissionGate.tsx` shows a full-screen notification opt-in prompt.
Dismiss state is persisted in localStorage (`permission-push-gate-dismissed`).
Once the user subscribes, the dismiss flag is cleared.
Has a "Skip" button for users who don't want notifications.

## Current Logfare Model Status (as of July 2026)
6 of 10 models working:
- `deepseek-v4-pro` — primary model (best coder available)
- `deepseek-v4-flash` — fast alternative
- `kimi-k2.6` — solid general purpose
- `minimax-m3` — decent all-rounder
- `kiro-auto` — working
- `qwen-3.6-35b-a3b` — small/fast model

Still down: kimi-k2.7-code, kimi-k3, qwen-3.8-max, glm-5.2

## Project Config
- `model`: logfare/deepseek-v4-pro
- `small_model`: logfare/qwen-3.6-35b-a3b
- `code-reviewer`: logfare/deepseek-v4-pro
- `designer`: logfare/deepseek-v4-pro
- `build`: logfare/deepseek-v4-pro

## Recent Changes
- Added PWA install landing page with Android/iOS buttons
- Removed EntitlementBar (solde annuel) from HomeTab
- Removed old InstallBanner and useInstallPrompt hook
- Replaced text logo with image in header
- Added persistent push gate dismissal via localStorage
- EntitlementBar and InstallBanner files can be deleted safely

## Current Session (Jul 28 2026)
**Task:** Fix Android PWA splash screen — the icon has a white box on dark background.

**Done so far:**
- Created `public/pwa-192x192.png` and `public/pwa-512x512.png` from `logo-512.png` with transparent backgrounds (cropped to logo bounding box 938×733, resized with 8% padding)
- Updated `vite.config.ts` — `theme_color` → `#09090b`, added `purpose: 'any maskable'` to 512×512 icon, icon paths updated to `pwa-*` files
- Updated `index.html` — `theme-color` → `#09090b`, `favicon` and `apple-touch-icon` → `pwa-192x192.png`
- Deleted old icon files (`logo.png`, `logo-192.png`, `logo-512.png`, `PermissionLogo.png`)
- Verified: `tsc --noEmit` passes, no lint errors

**Still pending:**
1. Deploy to Vercel, uninstall & reinstall on Android to test the splash screen

## Key Files
- `src/hooks/usePWAInstall.ts` — standalone detection + deferred prompt capture
- `src/components/InstallLandingPage.tsx` — full-screen install page
- `src/components/PushPermissionGate.tsx` — notification opt-in gate
- `src/App.tsx` — routes between install landing and main app based on isStandalone
- `vite.config.ts` — PWA manifest config (icons, colors)
- `public/pwa-192x192.png` — updated icon (192×192, transparent bg)
- `public/pwa-512x512.png` — updated icon (512×512, transparent bg)
