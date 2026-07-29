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
      throw new Error(`Missing required env var: ${key}. Check your .env file.`);
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
          theme_color: "#eab308",
          background_color: "#eab308",
          lang: "ar",
          dir: "rtl",
          icons: [
            { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          ],
        },
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
