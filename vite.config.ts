import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "public",
      filename: "sw.js",
      includeAssets: ["favicon.png", "icons/*.png"],
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
});
