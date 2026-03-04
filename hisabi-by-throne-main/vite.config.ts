import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

import { VitePWA } from "vite-plugin-pwa";

// Build version — bump on every deploy to bust caches
const APP_VERSION = "2.0.0";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Critical: remove old caches from previous SW versions
        cleanupOutdatedCaches: true,
        // Allow new SW to take control immediately
        skipWaiting: true,
        clientsClaim: true,
        // Ensure navigations go to the network-first SPA shell
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api/, /\.[a-z]{2,4}$/i],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: "Ma7ali - محلي",
        short_name: "Ma7ali",
        description: "إدارة ذكية لتجارتك - تطبيق متكامل لإدارة المبيعات والمخزون والأرباح",
        start_url: "/",
        display: "standalone",
        background_color: "#0f1419",
        theme_color: "#1e3a5f",
        orientation: "portrait",
        lang: "ar",
        dir: "rtl",
        categories: ["business", "finance", "productivity"],
        icons: [
          { src: "/icons/icon-72x72.png",   sizes: "72x72",   type: "image/png" },
          { src: "/icons/icon-96x96.png",   sizes: "96x96",   type: "image/png" },
          { src: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
          { src: "/icons/icon-144x144.png", sizes: "144x144", type: "image/png" },
          { src: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
          { src: "/icons/icon-180x180.png", sizes: "180x180", type: "image/png" },
          { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/icons/icon-384x384.png", sizes: "384x384", type: "image/png" },
          { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // Pre-bundle recharts + d3 to resolve circular imports at dev time
    include: ["recharts", "recharts/lib/util/types"],
  },
  build: {
    // ES2020 = smaller output (no need to polyfill nullish coalescing etc.)
    // All modern Android WebViews (API 21+) fully support ES2020
    target: "es2020",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,       // strip all console.* in prod
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2,                // 2 compression passes → smaller output
        ecma: 2020,
      },
      format: { ecma: 2020, comments: false },
    },
    sourcemap: false,
    // Raise warning threshold — we split deliberately
    chunkSizeWarningLimit: 600,
    commonjsOptions: { transformMixedEsModules: true },
    rollupOptions: {
      output: {
        // Split vendor chunks by domain for optimal long-term caching.
        // recharts/d3 are intentionally left OUT of manualChunks
        // because they have circular deps that Rollup must resolve itself.
        manualChunks(id) {
          // Bundle React + everything that calls React.createContext together
          // to guarantee initialization order (avoids "createContext undefined")
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/') ||
            id.includes('node_modules/react-router') ||
            id.includes('node_modules/@remix-run/') ||
            id.includes('node_modules/i18next') ||
            id.includes('node_modules/react-i18next') ||
            id.includes('node_modules/@tanstack/')
          ) {
            return 'vendor-react';   // single chunk → guaranteed load order
          }
          // Radix UI + cmdk  (UI primitives — depend on vendor-react)
          if (id.includes('node_modules/@radix-ui/') ||
              id.includes('node_modules/cmdk/')) {
            return 'vendor-ui';
          }
          // Lucide icons  (pure SVG, no React dep at chunk level)
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
        },
      },
    },
  },
}));
