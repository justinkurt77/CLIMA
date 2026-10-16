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
        description: "Official disaster response platform of Palayan City Government, Nueva Ecija",
        theme_color: "#f5f3f0",
        background_color: "#f5f3f0",
        display: "fullscreen",
        display_override: ["fullscreen", "standalone"],
        icons: [
          {
            src: "/logo.webp",
            sizes: "192x192",
            type: "image/webp",
            purpose: "any maskable",
          },
          {
            src: "/logo.webp",
            sizes: "512x512",
            type: "image/webp",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      buffer: 'buffer',
      stream: 'stream-browserify',
    },
  },
  define: {
    'global': 'globalThis',
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    sourcemap: false,
    minify: "esbuild",
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-mapbox': ['mapbox-gl', '@mapbox/mapbox-gl-geocoder'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['framer-motion', 'lucide-react']
        }
      }
    }
  },
  optimizeDeps: {
    // Pre-bundle mapbox-gl so Vite doesn't reprocess it on every cold start
    include: ["mapbox-gl", "buffer"],
    exclude: ["react-map-gl"],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
    },
  },
});
