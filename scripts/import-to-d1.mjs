import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, join, relative, sep } from 'node:path'

const root = process.cwd()
const sourceRoot = join(root, 'data', 'chinese-poetry')
const outputDir = join(root, 'public', 'poetry-data')

// ── 文集定义 ─────────────────────────────────────
// 注意：yuding（御定全唐诗）作为独立文集加入
const collections = [
  {
    id: 'tang',
    name: '唐诗',
    dynasty: '唐',
    description: '全唐诗与唐诗三百首。清康熙年间编修的《全唐诗》900卷，共2200余位诗人。',
    patterns: [/全唐诗[\/\\\\]poet\.tang\.\d+\.json$/, /全唐诗[\/\\\\]唐诗三百首\.json$/],
    overviewWeight: 6,
  },
  {
    id: 'song-ci',
    name: '宋词',
    dynasty: '宋',
    description: '按词牌、作者和正文组织的宋词作品，约21,000余首。',
    patterns: [/宋词[\/\\\\]ci\.song\.\d+\.json$/, /宋词[\/\\\\]ci\.song\..+\.json$/],
    overviewWeight: 3,
  },
  {
    id: 'song-poetry',
    name: '宋诗',
    dynasty: '宋',
    description: '《全宋诗》收录的宋代诗歌，规模最大的子集，约254,000余首。',
    patterns: [/全唐诗[\/\\\\]poet\.song\.\d+\.json$/],
    overviewWeight: 8,
  },
  {
    id: 'shijing',
    name: '诗经',
    dynasty: '先秦',
    description: '风、雅、颂结构下的《诗经》篇章，305篇。',
    patterns: [/诗经[\/\\\\]shijing\.json$/],
    overviewWeight: 1,
  },
  {
    id: 'chuci',
    name: '楚辞',
    dynasty: '战国',
    description: '楚辞篇目，适合长篇吟诵式阅读。',
    patterns: [/楚辞[\/\\\\]chuci\.json$/],
    overviewWeight: 1,
  },
  {
    id: 'yuanqu',
    name: '元曲',
    dynasty: '元',
    description: '元曲作品，按曲牌和作者检索，约11,000余首。',
    patterns: [/元曲[\/\\\\].*\.json$/],
    overviewWeight: 2,
  },
  {
    id: 'classics',
    name: '经典蒙学',
    dynasty: '历代',
    description: '蒙学、论语等经典文本。',
    patterns: [/蒙学[\/\\\\].*\.json$/, /论语[\/\\\\]lunyu\.json$/],
    overviewWeight: 1,
  },
  {
    id: 'featured',
    name: '别集精选',
    dynasty: '历代',
    description: '曹操、纳兰性德、五代诗词等小型别集。',
    patterns: [/曹操诗集[\/\\\\].*\.json$/, /纳兰性德[\/\\\\].*\.json$/, /五代诗词[\/\\\\].*\.[jt]son$/],
    overviewWeight: 1,
  },
  {
    id: 'yuding',
    name: '御定全唐诗',
    dynasty: '唐',
    description: '清康熙御定《全唐诗》900卷详本，含作者小传与注释，约43,000余首。',
    patterns: [/御定全唐詩[\/\\\\]json[\/\\\\]\d+\.json$/],
    overviewWeight: 4,
  },
]

// 先剔除一些不再需要的后缀文集（但保持兼容）
const EXCLUDED_PATTERNS = [/四书五经/, /幽梦影/, /水墨唐诗/, /loader/, /rank/, /strains/, /images/]

// ── 主流程 ─────────────────────────────────────
if (!existsSync(sourceRoot)) {
  throw new Error('未找到诗词子模块：' + sourceRoot + '。请先运行 git submodule update --init --recursive。')
}

console.log('正在收集 JSON 文件...')
const jsonFiles = collectJsonFiles(sourceRoot)
  .filter(f => !EXCLUDED_PATTERNS.some(p => p.test(normalize(f))))
console.log('共发现 ' + jsonFiles.length + ' 个 JSON 文件')

const allItems = []
const collectionItems = new Map(collections.map(c => [c.id, []]))

for (const collection of collections) {
  const files = jsonFiles
    .filter((file) => collection.patterns.some((pattern) => pattern.test(normalize(file))))
    .sort(comparePoetryFile)

  const colItems = []
  for (const file of files) {
    const rawItems = readJsonArray(file)
    for (const rawItem of rawItems) {
      const normalizedItem = normalizeItem(rawItem, collection, file, colItems.length)
      if (!normalizedItem) continue
      colItems.push(normalizedItem)
    }
  }
  collectionItems.set(collection.id, colItems)
  for (const ci of colItems) allItems.push(ci)
  console.log('  ' + collection.name + ': ' + colItems.length + ' 条')
}

console.log('\\n总计: ' + allItems.length + ' 条')

// ── 构建 collections 元数据 ─────────────────────
const collectionsPayload = collections.map((collection) => ({
  id: collection.id,
  name: collection.name,
  dynasty: collection.dynasty,
  description: collection.description,
  count: collectionItems.get(collection.id)?.length ?? 0,
}))

// ── 输出 1: meta.json ──────────────────────────
mkdirSync(outputDir, { recursive: true })
writeFileSync(join(outputDir, 'meta.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  sourceRepository: 'https://github.com/menghun3-cn/chinese-poetry.git',
  total: allItems.length,
  collections: collectionsPayload,
}) + '\n', 'utf8')
console.log('已生成 meta.json')

// ── 输出 2: index.overview.json（20K 概览采样） ──
const OVERVIEW_TARGET = 20000
const overviewItems = []
for (const collection of collections) {
  const items = collectionItems.get(collection.id) ?? []
  if (items.length === 0) continue
  // 每个文集至少 500 条，最多按比例分配
  const weight = collection.overviewWeight
  const rawQuota = Math.floor(OVERVIEW_TARGET * weight / collections.reduce((s, c) => s + c.overviewWeight, 0))
  const quota = Math.max(500, Math.min(rawQuota, items.length))
  // 均匀采样
  const step = Math.max(1, Math.floor(items.length / quota))
  const sampled = []
  for (let i = 0; i < items.length && sampled.length < quota; i += step) {
    sampled.push(items[i])
  }
  overviewItems.push(...sampled)
}
// 混排打散
shuffleArray(overviewItems)
writeFileSync(join(outputDir, 'index.overview.json'), JSON.stringify(overviewItems.map(toIndexEntry)) + '\n', 'utf8')
console.log('已生成 index.overview.json: ' + overviewItems.length + ' 条概览')

// 输出内联概览文件（前 2000 条，用于构建时注入 index.html）
var inlineOverviewItems = overviewItems.map(toIndexEntry).slice(0, 2000)
writeFileSync(
  join(outputDir, 'inline-overview.json'),
  JSON.stringify(inlineOverviewItems) + '\n',
  'utf8'
)
console.log('已生成 inline-overview.json: ' + inlineOverviewItems.length + ' 条（内联概览）')

// ── 输出 3: index.{collectionId}.json（文集全量索引） ──
// 大文集（song-poetry, tang, yuding, song-ci）按 20000 条分片
const INDEX_CHUNK_SIZE = 20000
let totalIndexChunks = 0
for (const collection of collections) {
  const items = collectionItems.get(collection.id) ?? []
  if (items.length === 0) continue

  if (items.length <= INDEX_CHUNK_SIZE) {
    // 小文集：单文件
    writeFileSync(join(outputDir, 'index.' + collection.id + '.json'), JSON.stringify(items.map(toIndexEntry)) + '\n', 'utf8')
    totalIndexChunks++
  } else {
    // 大文集：分片
    for (let i = 0; i < items.length; i += INDEX_CHUNK_SIZE) {
      const chunk = items.slice(i, i + INDEX_CHUNK_SIZE)
      const chunkIdx = Math.floor(i / INDEX_CHUNK_SIZE)
      writeFileSync(join(outputDir, 'index.' + collection.id + '.' + chunkIdx + '.json'), JSON.stringify(chunk.map(toIndexEntry)) + '\n', 'utf8')
      totalIndexChunks++
    }
    // 写入分片元数据文件
    const totalChunks = Math.ceil(items.length / INDEX_CHUNK_SIZE)
    writeFileSync(join(outputDir, 'index.' + collection.id + '.meta.json'), JSON.stringify({ chunks: totalChunks, total: items.length, chunkSize: INDEX_CHUNK_SIZE }) + '\n', 'utf8')
  }
}
console.log('文集索引分片数: ' + totalIndexChunks)

// ── 输出 4: details/ 分片（含完整 paragraphs） ──
const DETAILS_CHUNK_SIZE = 2000
