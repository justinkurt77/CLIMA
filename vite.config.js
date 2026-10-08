import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: true },
      manifest: {
        name: "CLIMA - Climate Information Monitoring and Awareness",
        short_name: "CLIMA",
        description: "Climate Information Monitoring and Awareness",
        theme_color: "#f5f3f0",
        background_color: "#f5f3f0",
        display: "fullscreen",
        display_override: ["fullscreen", "standalone"],
        icons: [
          {
            src: "/vite.svg",
            sizes: "192x192 512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  esbuild: {
    pure: ["console.log", "console.info", "console.debug", "console.trace"],
    drop: ["debugger"],
  },
  build: {
    sourcemap: false,
    minify: "esbuild",
    cssMinify: true,
  },
  optimizeDeps: {
    // Pre-bundle mapbox-gl so Vite doesn't reprocess it on every cold start
    include: ["mapbox-gl"],
    exclude: ["react-map-gl"],
  },
});
