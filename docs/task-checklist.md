# 任务清单

## 已完成

- [x] 将 `menghun3-cn/chinese-poetry` 添加为 Git submodule。
- [x] 建立 Vue 3.5、Vite 7、TypeScript、Pinia、Vue Router 工程骨架。
- [x] 接入 Tailwind CSS 4 与本地 shadcn-vue 风格组件。
- [x] 接入 Lucide 图标与 ECharts 图表。
- [x] 编写构建时诗词数据归一化脚本。
- [x] 实现诗词检索、筛选、阅读、复制、收藏。
- [x] 实现数据概览页。
- [x] 添加 Vitest + Vue Test Utils 最小组件测试。
- [x] 添加 GitHub Action，自动发布到 Cloudflare Pages。
- [x] 编写功能文档与访问设计文档。

## 待验证

- [ ] 在干净环境执行 `npm install`，生成锁文件后可切换为 `npm ci`。
- [ ] 执行 `npm run build` 验证类型检查与构建。
- [ ] 执行 `npm run test` 验证组件测试。
- [ ] 在 GitHub 仓库 Secrets 配置 Cloudflare 凭据。
- [ ] 首次推送 `main` 后确认 Cloudflare Pages 项目发布成功。

## 建议迭代

- [ ] 将文集数据拆分为多个静态 JSON，支持全量懒加载。
- [ ] 增加作品详情路由和分享链接。
- [ ] 增加随机推荐、诵读模式和繁简切换。
- [ ] 增加 Playwright 多视口视觉回归。
