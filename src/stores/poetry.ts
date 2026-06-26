import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { PoetryCatalog, PoetryFilters, PoetryItem } from '@/types/poetry'
import { useTagsStore } from '@/stores/tags'

/** 轻量索引条目（服务端返回的压缩格式） */
interface IndexEntry {
  id: string
  t: string   // title
  a: string   // author
  d: string   // dynasty
  c: string   // collectionId
  tg: string[] // tags
  r: string   // rhythmic
  e: string   // excerpt
  l: number   // length
  sp: string  // sourcePath
}

/** 详情条目（来自 details/ 分片） */
interface DetailEntry {
  id: string
  paragraphs: string[]
}

const defaultFilters: PoetryFilters = {
  keyword: '',
  collectionId: 'all',
  tags: [],
  author: '',
}
type FilterKey = keyof PoetryFilters

// ---------- IndexedDB 缓存层 ----------
const DB_NAME = 'poetry-cache'
const DB_VERSION = 1
const STORE_INDEX = 'index'
const STORE_META = 'meta'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_INDEX)) db.createObjectStore(STORE_INDEX)
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getCached(key: string): Promise<IndexEntry[] | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_INDEX, 'readonly')
      const req = tx.objectStore(STORE_INDEX).get(key)
      req.onsuccess = () => {
        const data = req.result as IndexEntry[] | undefined
        resolve(data ?? null)
      }
      req.onerror = () => resolve(null)
      tx.oncomplete = () => db.close()
    })
  } catch { return null }
}

async function setCache(key: string, data: IndexEntry[]): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_INDEX, 'readwrite')
      tx.objectStore(STORE_INDEX).put(data, key)
      tx.oncomplete = () => { db.close(); resolve() }
    })
  } catch { /* 静默失败，不影响主流程 */ }
}

async function getMetaCache(key: string): Promise<PoetryCatalog | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_META, 'readonly')
      const req = tx.objectStore(STORE_META).get(key)
      req.onsuccess = () => resolve(req.result as PoetryCatalog ?? null)
      req.onerror = () => resolve(null)
      tx.oncomplete = () => db.close()
    })
  } catch { return null }
}

async function setMetaCache(key: string, data: PoetryCatalog): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_META, 'readwrite')
      tx.objectStore(STORE_META).put(data, key)
      tx.oncomplete = () => { db.close(); resolve() }
    })
  } catch { /* 静默 */ }
}

// ---------- 详情缓存（内存 Map + LRU） ----------
const detailCache = new Map<string, string[]>()
const DETAIL_CACHE_MAX = 50

function cacheDetail(id: string, paragraphs: string[]) {
  if (detailCache.size >= DETAIL_CACHE_MAX) {
    const firstKey = detailCache.keys().next().value
    if (firstKey) detailCache.delete(firstKey)
  }
  detailCache.set(id, paragraphs)
}

// ---------- Store ----------
export const usePoetryStore = defineStore('poetry', () => {
  // 状态
  const catalog = ref<PoetryCatalog | null>(null)
  const indexEntries = ref<IndexEntry[]>([])
  const selectedId = ref('')
  const filters = ref<PoetryFilters>({ ...defaultFilters })
  const loading = ref(true)       // 初始就是 true，无需额外 loading 状态
  const loadingProgress = ref(0)  // 0-100
  const error = ref('')
  const favorites = ref<string[]>(readFavorites())

  // 计算属性：将 index entries 映射为轻量 PoetryItem
  const items = computed<PoetryItem[]>(() =>
    indexEntries.value.map((e) => ({
      id: e.id,
      title: e.t,
      author: e.a,
      dynasty: e.d,
      collection: catalog.value?.collections.find((c) => c.id === e.c)?.name ?? '',
      collectionId: e.c,
      rhythmic: e.r,
      tags: e.tg,
      paragraphs: detailCache.get(e.id) ?? [],
      excerpt: e.e,
      length: e.l,
      sourcePath: e.sp,
    })),
  )

  const collections = computed(() => catalog.value?.collections ?? [])

  // selectedItem 优先直接用详情缓存
  const selectedItem = computed<PoetryItem | null>(() => {
    if (!items.value.length) return null
    const found = items.value.find((item) => item.id === selectedId.value)
    return found ?? items.value[0]
  })

  const filteredItems = computed(() =>
    items.value.filter((item) => matchesPoetryFilters(item, filters.value)),
  )

  const topTags = computed(() => {
    const tagsStore = useTagsStore()
    return Object.entries(tagsStore.globalTagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16)
      .map(([name, count]) => ({ name, count }))
  })

  const topAuthors = computed(() => {
    const counter = new Map<string, number>()
    for (const entry of indexEntries.value) {
      if (entry.a && entry.a !== '佚名')
        counter.set(entry.a, (counter.get(entry.a) ?? 0) + 1)
    }
    return [...counter.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, count]) => ({ name, count }))
  })

  const favoriteItems = computed(() =>
    favorites.value
      .map((id) => items.value.find((item) => item.id === id))
      .filter((item): item is PoetryItem => Boolean(item)),
  )

  // 获取段落全文（支持懒加载）
  async function ensureDetail(itemId: string): Promise<string[]> {
    // 已有缓存
    const cached = detailCache.get(itemId)
    if (cached) return cached

    // 从 index 中找到 sourcePath
    const entry = indexEntries.value.find((e) => e.id === itemId)
    if (!entry) return []

    // 从 details/ 分片加载
    try {
      // 需要知道这个 entry 在哪个分片
      const colId = entry.c
      // 遍历所有分片文件找到这个 id（缓存到内存后只做一次）
      // 先猜分片序号：按 collectionId 分组，每个分片 2000 条
      const colIndex = indexEntries.value.filter((e) => e.c === colId)
      const idx = colIndex.findIndex((e) => e.id === itemId)
      if (idx === -1) return []
      const chunk = Math.floor(idx / 2000)
      const resp = await fetch(`/poetry-data/details/${colId}-${chunk}.json`)
      if (!resp.ok) return []
      const details: DetailEntry[] = await resp.json()
      const found = details.find((d) => d.id === itemId)
      if (found) {
        cacheDetail(itemId, found.paragraphs)
        return found.paragraphs
      }
    } catch { /* 静默 */ }
    return []
  }

  // ---------- 加载流程 ----------
  async function loadCatalog() {
    if (catalog.value) return

    loading.value = true
    loadingProgress.value = 0
    error.value = ''

    try {
      // 第一步：尝试从 IndexedDB 读取缓存的索引（秒开）
      const cachedIndex = await getCached('v1')
      const cachedMeta = await getMetaCache('v1')
      if (cachedIndex && cachedMeta) {
        indexEntries.value = cachedIndex
        catalog.value = cachedMeta
        selectedId.value = cachedIndex[0]?.id ?? ''
        loadingProgress.value = 60
        // 注入标签统计
        injectTagCounts(cachedIndex)
      }

      // 第二步：并行获取 meta + index（网络）
      const [metaResp, indexResp] = await Promise.all([
        fetch('/poetry-data/meta.json'),
        fetch('/poetry-data/index.json'),
      ])

      if (!metaResp.ok || !indexResp.ok) throw new Error(`HTTP ${metaResp.status}`)

      loadingProgress.value = 40

      // 流式解析 index.json（大文件用流减少主线程阻塞）
      const freshMeta: PoetryCatalog = await metaResp.json()
      const freshIndex: IndexEntry[] = await indexResp.json()

      loadingProgress.value = 80

      // 更新状态
      catalog.value = freshMeta
      indexEntries.value = freshIndex
      selectedId.value = freshIndex[0]?.id ?? ''

      // 注入标签统计
      injectTagCounts(freshIndex)

      // 写入 IndexedDB 缓存（后台）
      Promise.all([setCache('v1', freshIndex), setMetaCache('v1', freshMeta)]).catch(() => {})

      loadingProgress.value = 100
    } catch (err) {
      // 如果有缓存数据，即使网络失败也能用
      if (!catalog.value) {
        error.value = '诗词索引加载失败，请检查网络后刷新重试。'
      }
    } finally {
      loading.value = false
    }
  }

  function injectTagCounts(entries: IndexEntry[]) {
    const counts = new Map<string, number>()
    for (const entry of entries) {
      if (entry.tg) {
        for (const tag of entry.tg) {
          counts.set(tag, (counts.get(tag) ?? 0) + 1)
        }
      }
    }
    const tagsStore = useTagsStore()
    tagsStore.setGlobalCounts(counts)
  }

  function selectItem(id: string) {
    selectedId.value = id
    // 预加载详情
    ensureDetail(id)
  }

  function updateFilters(patch: Partial<PoetryFilters>) {
    filters.value = { ...filters.value, ...patch }
    selectedId.value = filteredItems.value[0]?.id ?? selectedId.value
    // 预加载第一篇的详情
    if (selectedId.value) ensureDetail(selectedId.value)
  }

  function resetFilters() {
    filters.value = { ...defaultFilters }
    selectedId.value = items.value[0]?.id ?? ''
    if (selectedId.value) ensureDetail(selectedId.value)
  }

  function toggleFavorite(id: string) {
    const next = favorites.value.includes(id)
      ? favorites.value.filter((favoriteId) => favoriteId !== id)
      : [id, ...favorites.value].slice(0, 80)
    favorites.value = next
    localStorage.setItem('poetry:favorites', JSON.stringify(next))
  }

  return {
    catalog,
    collections,
    error,
    favoriteItems,
    favorites,
    filteredItems,
    filters,
    items,
    indexEntries,
    loading,
    loadingProgress,
    selectedId,
    selectedItem,
    topAuthors,
    topTags,
    ensureDetail,
    loadCatalog,
    resetFilters,
    selectItem,
    toggleFavorite,
    updateFilters,
  }
})

function normalize(value: string | undefined) {
  return (value ?? '').trim().toLocaleLowerCase('zh-CN')
}

function matchesPoetryFilters(item: PoetryItem, filters: PoetryFilters, ignoredKeys: FilterKey[] = []) {
  const ignored = new Set<FilterKey>(ignoredKeys)

  const matchesCollection = ignored.has('collectionId') || filters.collectionId === 'all' || item.collectionId === filters.collectionId
  const matchesTag = ignored.has('tags') || !filters.tags.length || filters.tags.some((tag) => item.tags.includes(tag))
  const matchesAuthor = ignored.has('author') || !filters.author || normalize(item.author).includes(normalize(filters.author))

  const haystack = normalize(
    [item.title, item.author, item.collection, item.rhythmic, item.excerpt, ...item.tags].join(' '),
  )
  const matchesKeyword = ignored.has('keyword') || !filters.keyword || haystack.includes(normalize(filters.keyword))

  return matchesCollection && matchesTag && matchesAuthor && matchesKeyword
}

function readFavorites() {
  if (typeof localStorage === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem('poetry:favorites') ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch { return [] }
}
