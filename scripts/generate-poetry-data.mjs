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
const detailsDir = join(outputDir, 'details')
mkdirSync(detailsDir, { recursive: true })
let detailChunks = 0
for (const collection of collections) {
  const items = collectionItems.get(collection.id) ?? []
  if (items.length === 0) continue
  for (let i = 0; i < items.length; i += DETAILS_CHUNK_SIZE) {
    const chunk = items.slice(i, i + DETAILS_CHUNK_SIZE)
    const chunkIdx = Math.floor(i / DETAILS_CHUNK_SIZE)
    writeFileSync(
      join(detailsDir, collection.id + '-' + chunkIdx + '.json'),
      JSON.stringify(chunk.map(item => ({ id: item.id, paragraphs: item.paragraphs }))) + '\n',
      'utf8'
    )
    detailChunks++
  }
}
console.log('已生成 details/：' + detailChunks + ' 个分片文件')
console.log('\\n✅ 生成完成')

// ── 辅助函数 ──
function toIndexEntry(item) {
  return {
    id: item.id,
    t: item.title,
    a: item.author,
    d: item.dynasty,
    c: item.collectionId,
    tg: item.tags,
    r: item.rhythmic,
    e: item.excerpt,
    l: item.length,
    sp: item.sourcePath,
  }
}

function collectJsonFiles(dir) {
  const result = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === '.github' || entry.name === 'images') continue
      result.push(...collectJsonFiles(p))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.json')) {
      result.push(p)
    }
  }
  return result
}

function normalize(p) {
  return relative(sourceRoot, p).split(sep).join('/')
}

function comparePoetryFile(a, b) {
  const aName = basename(a)
  const bName = basename(b)
  const aNum = Number(aName.match(/\.(\d+)\.json$/)?.[1] ?? -1)
  const bNum = Number(bName.match(/\.(\d+)\.json$/)?.[1] ?? -1)
  if (aNum !== bNum) return aNum - bNum
  return aName.localeCompare(bName, 'zh-Hans-CN')
}

function readJsonArray(file) {
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf8'))
    if (Array.isArray(parsed)) return parsed
    if (Array.isArray(parsed?.content)) return parsed.content
    if (Array.isArray(parsed?.chapters)) return parsed.chapters
    if (Array.isArray(parsed?.strains)) return parsed.strains
  } catch (error) {
    console.warn('跳过无法解析的 JSON：' + relative(root, file) + '，' + error.message)
  }
  return []
}

function normalizeItem(rawItem, collection, file, index) {
  if (!rawItem || typeof rawItem !== 'object') return null
  const paragraphs = getParagraphs(rawItem)
  const title = getTitle(rawItem, collection, index)
  if (!title || paragraphs.length === 0) return null
  const author = pickString(rawItem.author, rawItem.poet, rawItem.name, rawItem.chapter) || '佚名'
  const tags = Array.isArray(rawItem.tags)
    ? rawItem.tags.filter((tag) => typeof tag === 'string' && tag).slice(0, 6)
    : []
  const rhythmic = pickString(rawItem.rhythmic, rawItem.chapter, rawItem.section)
  const sourcePath = relative(sourceRoot, file).split(sep).join('/')
  return {
    id: pickString(rawItem.id) || collection.id + '-' + basename(file, '.json').replaceAll('.', '-') + '-' + index.toString(36),
    title,
    author,
    dynasty: collection.dynasty,
    collection: collection.name,
    collectionId: collection.id,
    rhythmic,
    tags,
    paragraphs,
    excerpt: paragraphs.slice(0, 2).join(''),
    length: paragraphs.join('').length,
    sourcePath,
  }
}

function getTitle(rawItem, collection, index) {
  return pickString(rawItem.title, rawItem.rhythmic, rawItem.chapter && rawItem.section ? rawItem.chapter + ' \· ' + rawItem.section : undefined) || collection.name + '选篇 ' + (index + 1)
}

function getParagraphs(rawItem) {
  const candidates = [rawItem.paragraphs, rawItem.content, rawItem.paragraph, rawItem.text]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.map((line) => (typeof line === 'string' ? line.trim() : '')).filter(Boolean).slice(0, 24)
    }
    if (typeof candidate === 'string') {
      return candidate.split(/\\r?\\n|\。/).map((line) => line.trim()).filter(Boolean)
        .map((line) => (line.endsWith('\。') || line.endsWith('\！') || line.endsWith('\？') ? line : line + '\。'))
        .slice(0, 24)
    }
  }
  return []
}

function pickString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
}
