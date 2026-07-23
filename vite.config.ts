import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const REQUIRED_ENV_VARS = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_VAPID_PUBLIC_KEY"];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  for (const key of REQUIRED_ENV_VARS) {
    if (!env[key]) {
      throw new Error(`Missing required env var: ${key}. Check your .env file.`);
    }
  }

  return {
    plugins: [
      react(),
      VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "public",
      filename: "sw.js",
      includeAssets: ["favicon.png", "icons/*.png", "offline.html"],
      manifest: {
        name: "حاسبة العطل - Permission",
        short_name: "Permission",
        description: "حساب تاريخ العودة والاستئناف مع مراعاة الأعياد الرسمية",
        theme_color: "#eab308",
        background_color: "#f8f9fc",
        display: "standalone",
        orientation: "portrait",
        lang: "ar",
        dir: "rtl",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  };
});
