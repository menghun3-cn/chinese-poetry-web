# 功能文档

## 项目目标

基于 Git 子模块 `data/chinese-poetry` 中的 `menghun3-cn/chinese-poetry` 数据，构建一个可部署到 Cloudflare Pages 的中文诗词阅读网站。

## 核心功能

- 诗词检索：支持按题名、作者、正文片段、标签搜索。
- 文集筛选：支持唐诗、宋词、宋诗、诗经、楚辞、元曲、经典蒙学、别集精选。
- 阅读详情：展示标题、朝代、作者、词牌或章节、正文、标签、原始来源路径。
- 本地收藏：收藏记录保存在当前浏览器 `localStorage`，不依赖后端。
- 数据概览：展示索引总量、文集数量、收藏数量、文集规模图表和热门作者。
- 数据生成：构建前执行 `scripts/generate-poetry-data.mjs`，从子模块生成 `public/poetry-data/catalog.json`。
- 静态部署：GitHub Action 检出子模块、安装依赖、构建并发布到 Cloudflare Pages。

## 数据策略

原始诗词仓库体积较大，不直接把全量 JSON 打包进前端入口。当前采用“构建时归一化 + 运行时静态 JSON 拉取”的方案：

1. 保留原始仓库为 Git submodule，保证来源可追溯。
2. 构建脚本按文集读取 JSON，统一字段为 `PoetryItem`。
3. 为每类文集设置采样上限，控制 Cloudflare 静态资源体积。
4. 前端通过 `/poetry-data/catalog.json` 加载索引。

## 主要数据结构

```ts
interface PoetryItem {
  id: string
  title: string
  author: string
  dynasty: string
  collection: string
  collectionId: string
  rhythmic?: string
  tags: string[]
  paragraphs: string[]
  excerpt: string
  length: number
  sourcePath: string
}
```

## 运行命令

```bash
npm install
npm run dev
npm run build
npm run test
npm run lint
```

## 后续扩展

- 将索引拆分为 `collections/*.json`，按文集懒加载全量数据。
- 增加详情路由 `/poems/:id`，支持外链分享。
- 增加繁简转换、诵读模式、阅读进度和随机推荐。
- 使用 Cloudflare Functions 或 D1 承载用户收藏同步。
