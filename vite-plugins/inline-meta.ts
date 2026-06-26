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
        const metaPath = resolve(__dirname, "../public/poetry-data/meta.json")
        let metaJson = "{}"
        try { metaJson = readFileSync(metaPath, "utf-8") }
        catch { /* dev fallback */ }

        const metaScript = '<script id="poetry-meta-data" type="application/json">' + metaJson + '</script>'
        html = html.replace("</head>", metaScript + "\n</head>")
        return html
      },
    },
  }
}
