import tailwindcss from "@tailwindcss/vite"
import { inlinePoetryMeta } from "./vite-plugins/inline-meta"
import vue from "@vitejs/plugin-vue"
import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [inlinePoetryMeta(), vue(), tailwindcss()],
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

