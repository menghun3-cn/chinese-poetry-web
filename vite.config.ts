import tailwindcss from "@tailwindcss/vite"
import vue from "@vitejs/plugin-vue"
import { VitePWA } from "vite-plugin-pwa"
import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,json,svg,ico,png,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // API 请求：网络优先，缓存后备（利用 Cloudflare 端缓存）
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/,
            handler: "NetworkFirst",
            options: {
              cacheName: "poetry-api",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 2, // 2 小时
              },
              networkTimeoutSeconds: 5,
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      manifest: {
        name: "中华诗词典藏",
        short_name: "诗词典藏",
        description: "全唐诗、全宋诗、全宋词、元曲等中华诗词全集",
        theme_color: "#1e293b",
        background_color: "#0f172a",
        display: "standalone",
        icons: [
          { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["vue", "pinia", "vue-router"],
          icons: ["lucide-vue-next"],
        },
      },
    },
  },
})
