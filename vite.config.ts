import tailwindcss from "@tailwindcss/vite"
import { inlinePoetryMeta } from "./vite-plugins/inline-meta"
import vue from "@vitejs/plugin-vue"
import { VitePWA } from "vite-plugin-pwa"
import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    inlinePoetryMeta(),
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,json,svg,ico,png,woff2}"],
        // 索引分片文件最大约5.7MB，提升限制以允许预缓存
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
        // 诗词数据：网络优先，缓存后备
        runtimeCaching: [
          {
            urlPattern: /\/poetry-data\/.*\.json$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "poetry-data",
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
              },
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
