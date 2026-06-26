import { readFileSync } from "node:fs"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import type { Plugin } from "vite"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export function inlinePoetryMeta(): Plugin {
  return {
    name: "inline-poetry-meta",
    enforce: "pre",
    transformIndexHtml: {
      order: "pre",
      handler(html: string) {
        // 内联 meta.json
        const metaPath = resolve(__dirname, "../public/poetry-data/meta.json")
        let metaJson = "{}"
        try { metaJson = readFileSync(metaPath, "utf-8").trim() }
        catch { /* dev fallback */ }

        // 内联 overview 前 2000 条
        const overviewPath = resolve(__dirname, "../public/poetry-data/inline-overview.json")
        let overviewJson = "[]"
        try { overviewJson = readFileSync(overviewPath, "utf-8").trim() }
        catch { /* dev fallback */ }

        const metaScript = '<script id="poetry-meta-data" type="application/json">' + metaJson + '</script>'
        const overviewScript = '<script id="poetry-overview-data" type="application/json">' + overviewJson + '</script>'
        html = html.replace("</head>", metaScript + "\n" + overviewScript + "\n</head>")
        return html
      },
    },
  }
}
