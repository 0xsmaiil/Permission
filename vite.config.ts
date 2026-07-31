import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

const REQUIRED_ENV_VARS = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  for (const key of REQUIRED_ENV_VARS) {
    if (!env[key]) {
      console.warn(`[vite] Missing env var: ${key}. Supabase features (push notifications) will be disabled; the app still works offline.`);
    }
  }

  return {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        strategies: "injectManifest",
        srcDir: "public",
        filename: "sw.js",
        manifestFilename: "manifest.json",
        manifest: {
          name: "Permission - حاسبة العطل",
          short_name: "Permission",
          description: "حساب تاريخ العودة والاستئناف مع مراعاة الأعياد الرسمية",
          start_url: "/",
          display: "standalone",
          orientation: "portrait",
          theme_color: "#ffffff",
          background_color: "#ffffff",
          lang: "ar",
          dir: "rtl",
          icons: [
            { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/pwa-maskable-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
            { src: "/pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        includeAssets: ["finallogo.png", "favicon-64x64.png", "apple-touch-icon.png"],
        devOptions: {
          enabled: true,
          navigateFallback: "index.html",
        },
      }),
    ],
    test: {
      // Node by default (fast); component tests opt into jsdom via
      // an `@vitest-environment jsdom` docblock.
      environment: "node",
      setupFiles: ["./src/test/setup.ts"],
      restoreMocks: true,
    },
  };
});
