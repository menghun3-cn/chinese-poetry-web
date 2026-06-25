import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, sep } from 'node:path'

const root = process.cwd()
const sourceRoot = join(root, 'data', 'chinese-poetry')
const outputDir = join(root, 'public', 'poetry-data')
const outputFile = join(outputDir, 'catalog.json')

const collections = [
  {
    id: 'tang',
    name: '唐诗',
    dynasty: '唐',
    description: '全唐诗与唐诗三百首中的代表作品，适合按作者、题名和名句检索。',
    patterns: [/全唐诗[\\/]poet\.tang\.\d+\.json$/, /全唐诗[\\/]唐诗三百首\.json$/],
    limit: 1400,
  },
  {
    id: 'song-ci',
    name: '宋词',
    dynasty: '宋',
    description: '按词牌、作者和正文组织的宋词作品。',
    patterns: [/宋词[\\/]ci\.song\.\d+\.json$/],
    limit: 1200,
  },
  {
    id: 'song-poetry',
    name: '宋诗',
    dynasty: '宋',
    description: '全唐诗目录中收录的宋诗分卷，保留原仓库命名并单独归类。',
    patterns: [/全唐诗[\\/]poet\.song\.\d+\.json$/],
    limit: 900,
  },
  {
    id: 'shijing',
    name: '诗经',
    dynasty: '先秦',
    description: '风、雅、颂结构下的《诗经》篇章。',
    patterns: [/诗经[\\/]shijing\.json$/],
    limit: 400,
  },
  {
    id: 'chuci',
    name: '楚辞',
    dynasty: '战国',
    description: '楚辞篇目，适合长篇吟诵式阅读。',
    patterns: [/楚辞[\\/]chuci\.json$/],
    limit: 250,
  },
  {
    id: 'yuanqu',
    name: '元曲',
    dynasty: '元',
    description: '元曲作品，按曲牌和作者检索。',
    patterns: [/元曲[\\/].*\.json$/],
    limit: 500,
  },
  {
    id: 'classics',
    name: '经典蒙学',
    dynasty: '历代',
    description: '蒙学、论语等经典文本，用于补充传统文化阅读场景。',
    patterns: [/蒙学[\\/].*\.json$/, /论语[\\/]lunyu\.json$/],
    limit: 500,
  },
  {
    id: 'featured',
    name: '别集精选',
    dynasty: '历代',
    description: '曹操、纳兰性德、五代诗词等小型别集。',
    patterns: [/曹操诗集[\\/].*\.json$/, /纳兰性德[\\/].*\.json$/, /五代诗词[\\/].*\.json$/],
    limit: 500,
  },
]

if (!existsSync(sourceRoot)) {
  throw new Error(`未找到诗词子模块：${sourceRoot}。请先运行 git submodule update --init --recursive。`)
}

const jsonFiles = collectJsonFiles(sourceRoot)
const items = []
const collectionStats = new Map(collections.map((item) => [item.id, 0]))
const usedSources = new Map(collections.map((item) => [item.id, new Set()]))

for (const collection of collections) {
  const files = jsonFiles
    .filter((file) => collection.patterns.some((pattern) => pattern.test(normalize(file))))
    .sort(comparePoetryFile)

  for (const file of files) {
    if ((collectionStats.get(collection.id) ?? 0) >= collection.limit) break

    const rawItems = readJsonArray(file)
    usedSources.get(collection.id)?.add(relative(sourceRoot, file))

    for (const rawItem of rawItems) {
      if ((collectionStats.get(collection.id) ?? 0) >= collection.limit) break
      const normalizedItem = normalizeItem(rawItem, collection, file, items.length)
      if (!normalizedItem) continue

      items.push(normalizedItem)
      collectionStats.set(collection.id, (collectionStats.get(collection.id) ?? 0) + 1)
    }
  }
}

const collectionsPayload = collections.map((collection) => ({
  id: collection.id,
  name: collection.name,
  dynasty: collection.dynasty,
  description: collection.description,
  count: collectionStats.get(collection.id) ?? 0,
  sources: [...(usedSources.get(collection.id) ?? [])].slice(0, 8),
}))

const payload = {
  generatedAt: new Date().toISOString(),
  sourceRepository: 'https://github.com/menghun3-cn/chinese-poetry.git',
  total: items.length,
  collections: collectionsPayload,
  items,
}

mkdirSync(outputDir, { recursive: true })
writeFileSync(outputFile, `${JSON.stringify(payload)}\n`, 'utf8')

console.log(`已生成诗词索引：${relative(root, outputFile)}，共 ${items.length} 条。`)

function collectJsonFiles(dir) {
  const result = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === '.github' || entry.name === 'images') continue
      result.push(...collectJsonFiles(path))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.json')) {
      result.push(path)
    }
  }
  return result
}

function normalize(path) {
  return relative(sourceRoot, path).split(sep).join('/')
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
  } catch (error) {
    console.warn(`跳过无法解析的 JSON：${relative(root, file)}，${error.message}`)
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
    ? rawItem.tags.filter((tag) => typeof tag === 'string').slice(0, 6)
    : []
  const rhythmic = pickString(rawItem.rhythmic, rawItem.chapter, rawItem.section)
  const sourcePath = relative(sourceRoot, file).split(sep).join('/')

  return {
    id:
      pickString(rawItem.id) ||
      `${collection.id}-${basename(file, '.json').replaceAll('.', '-')}-${index.toString(36)}`,
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
  return (
    pickString(
      rawItem.title,
      rawItem.rhythmic,
      rawItem.chapter && rawItem.section ? `${rawItem.chapter} · ${rawItem.section}` : undefined,
    ) || `${collection.name}选篇 ${index + 1}`
  )
}

function getParagraphs(rawItem) {
  const candidates = [rawItem.paragraphs, rawItem.content, rawItem.paragraph, rawItem.text]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((line) => (typeof line === 'string' ? line.trim() : ''))
        .filter(Boolean)
        .slice(0, 24)
    }
    if (typeof candidate === 'string') {
      return candidate
        .split(/\r?\n|。/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => (line.endsWith('。') || line.endsWith('！') || line.endsWith('？') ? line : `${line}。`))
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
