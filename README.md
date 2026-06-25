# 诗屿：中文诗词阅读网站

依赖 [`menghun3-cn/chinese-poetry`](https://github.com/menghun3-cn/chinese-poetry.git) 数据仓库构建的静态诗词阅读网站。

## 技术栈

- Vue 3.5、TypeScript、Vite 7
- Tailwind CSS 4、shadcn-vue 风格组件
- Pinia 2.3、Vue Router 4
- ECharts、lucide-vue-next
- Vitest、@vue/test-utils、ESLint 9、Prettier、vue-tsc

## 初始化

```bash
git submodule update --init --recursive
npm install
npm run dev
```

## 构建

```bash
npm run build
```

构建前会自动执行 `scripts/generate-poetry-data.mjs`，从 `data/chinese-poetry` 生成 `public/poetry-data/catalog.json`。

## 部署

推送到 `main` 后，`.github/workflows/deploy-cloudflare.yml` 会构建并发布到 Cloudflare Pages。

需要配置仓库 Secrets：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

更多说明见 `docs/`。
