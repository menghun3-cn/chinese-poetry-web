import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { PoetryCatalog, PoetryFilters, PoetryItem } from '@/types/poetry'
import { useTagsStore } from '@/stores/tags'

export interface IndexEntry {
  id: string
  t: string
  a: string
  d: string
  c: string
  tg: string[]
  r: string
  e: string
  l: number
  sp: string
}

interface DetailEntry {
  id: string
  paragraphs: string[]
}

interface IndexMeta {
  chunks: number
  total: number
  chunkSize: number
}

const defaultFilters: PoetryFilters = {
  keyword: '',
  collectionId: 'all',
  tags: [],
  author: '',
}

const DB_NAME = 'poetry-cache'
const DB_VERSION = 3

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('index')) db.createObjectStore('index')
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getCached(key: string): Promise<IndexEntry[] | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('index', 'readonly')
      const req = tx.objectStore('index').get(key)
      req.onsuccess = () => { resolve(req.result ?? null) }
      req.onerror = () => { resolve(null) }
      tx.oncomplete = () => db.close()
    })
  } catch {
    return null
  }
}

async function setCache(key: string, data: IndexEntry[]): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('index', 'readwrite')
      tx.objectStore('index').put(data, key)
      tx.oncomplete = () => { db.close(); resolve() }
    })
  } catch { /* silent */ }
}

const detailCache = new Map<string, string[]>()
const DETAIL_CACHE_MAX = 50

function cacheDetail(id: string, paragraphs: string[]) {
  if (detailCache.size >= DETAIL_CACHE_MAX) {
    const key = detailCache.keys().next().value
    if (key) detailCache.delete(key)
  }
  detailCache.set(id, paragraphs)
}

function extractAuthors(entries: IndexEntry[]) {
  const counter = new Map<string, number>()
  for (const e of entries) {
    if (e.a && e.a !== '佚名') counter.set(e.a, (counter.get(e.a) || 0) + 1)
  }
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .map(([name, count]) => ({ name, count }))
}


/** 常读作者：localStorage 持久化的用户阅读历史 */
const LS_AUTHOR_FREQ = 'poetry:authorFreq'
const MAX_AUTHORS = 10

function readAuthorFreq(): Record<string, number> {
  if (typeof localStorage === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(LS_AUTHOR_FREQ) ?? '{}')
  } catch { return {} }
}

function saveAuthorFreq(freq: Record<string, number>) {
  localStorage.setItem(LS_AUTHOR_FREQ, JSON.stringify(freq))
}

/** 热门标签：localStorage 持久化的用户常用标签 */
const LS_HOT_TAGS = 'poetry:hotTags'

function readHotTags(): string[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const t = JSON.parse(localStorage.getItem(LS_HOT_TAGS) ?? '[]')
    return Array.isArray(t) ? t : []
  } catch { return [] }
}

function saveHotTags(tags: string[]) {
  localStorage.setItem(LS_HOT_TAGS, JSON.stringify(tags))
}

async function loadShardedIndex(collectionId: string): Promise<IndexEntry[]> {
  // 优先尝试 meta.json（判断是否分片），避免下载大型单文件
  const metaResp = await fetch('/poetry-data/index.' + collectionId + '.meta.json')
  if (metaResp.ok) {
    const meta: IndexMeta = await metaResp.json()
    const allEntries: IndexEntry[] = new Array(meta.total)
    const promises: Promise<void>[] = []
    for (let i = 0; i < meta.chunks; i++) {
      const idx = i
      promises.push(
        (async () => {
          const resp = await fetch('/poetry-data/index.' + collectionId + '.' + idx + '.json')
          if (!resp.ok) throw new Error('Chunk load failed: ' + collectionId + '.' + idx)
          const chunk: IndexEntry[] = await resp.json()
          const offset = idx * meta.chunkSize
          for (let j = 0; j < chunk.length; j++) {
            allEntries[offset + j] = chunk[j]
          }
        })()
      )
    }
    await Promise.all(promises)
    return allEntries.filter(Boolean)
  }
  // 无分片的小型文集，直接加载单文件
  const singleResp = await fetch('/poetry-data/index.' + collectionId + '.json')
  if (singleResp.ok) return await singleResp.json()
  throw new Error('Cannot load index: ' + collectionId)
}

export const usePoetryStore = defineStore('poetry', () => {
  const catalog = ref<PoetryCatalog | null>(null)
  const indexEntries = ref<IndexEntry[]>([])
  const isOverviewMode = ref(true)
  const currentCollectionId = ref('all')
  const selectedId = ref('')
  const filters = ref<PoetryFilters>({ ...defaultFilters })
  const loading = ref(true)
  const loadingProgress = ref(0)
  const loadingMessage = ref('正在加载')
  const error = ref('')
  const fullIndexCache = ref<Map<string, IndexEntry[]>>(new Map())
  const favorites = ref<string[]>(readFavorites())
  const topAuthorsList = ref<{ name: string; count: number }[]>([])
  const topTagsList = ref<string[]>([])
  const hasFullCollectionLoaded = ref(false)

  /** 常读作者：基于用户点击历史的作者频次（持久化） */
  const frequentAuthors = ref<{ name: string; count: number }[]>(
    (() => {
      const freq = readAuthorFreq()
      return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_AUTHORS)
        .map(([name, count]) => ({ name, count }))
    })()
  )

  /** 热门标签：用户高频使用的标签（持久化） */
  const hotTags = ref<string[]>(readHotTags())

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
  const isUsingOverview = computed(() => isOverviewMode.value)
  const totalCount = computed(() => catalog.value?.total ?? 0)

  const favoriteItems = computed<PoetryItem[]>(() =>
    items.value.filter((item) => favorites.value.includes(item.id))
  )

  const selectedItem = computed<PoetryItem | null>(() => {
    if (!items.value.length) return null
    return items.value.find((item) => item.id === selectedId.value) ?? items.value[0]
  })

  const filteredItems = computed(() => {
    const f = filters.value
    const all = items.value
    if (!f.keyword && !f.author && !f.tags.length && (f.collectionId === 'all' || f.collectionId === currentCollectionId.value)) return all
    const kw = f.keyword ? normalize(f.keyword) : ''
    const authorQ = f.author ? normalize(f.author) : ''
    const tags = f.tags
    return all.filter((item) => {
      if (kw && !normalize(item.title).includes(kw) && !normalize(item.author).includes(kw) && !normalize(item.excerpt).includes(kw)) return false
      if (tags.length && !tags.some((tag) => item.tags.includes(tag))) return false
      if (authorQ && !normalize(item.author).includes(authorQ)) return false
      return true
    })
  })

  async function loadCatalog() {
    loading.value = true
    loadingMessage.value = '正在加载诗词索引'
    loadingProgress.value = 10
    error.value = ''
    try {
      const inlineEl = document.getElementById('poetry-meta-data')
      if (inlineEl) {
        try {
          const meta: PoetryCatalog = JSON.parse(inlineEl.textContent || '{}')
          if (meta.collections?.length) catalog.value = meta
        } catch { /* fallback to network */ }
      }
      if (!catalog.value) {
        loadingProgress.value = 20
        const r = await fetch('/poetry-data/meta.json')
        if (!r.ok) throw new Error('HTTP ' + r.status)
        catalog.value = await r.json() as PoetryCatalog
      }
      loadingProgress.value = 40
      const cached = await getCached('overview-v3')
      if (cached?.length) {
        indexEntries.value = cached
        injectStats(cached)
        if (!selectedId.value) selectedId.value = cached[0]?.id ?? ''
        await ensureDetail(selectedId.value)
        loading.value = false
        return
      }
      loadingProgress.value = 50
      loadingMessage.value = '正在加载诗词概览'
      const r2 = await fetch('/poetry-data/index.overview.json')
      if (!r2.ok) throw new Error('HTTP ' + r2.status)
      loadingProgress.value = 70
      const overview: IndexEntry[] = await r2.json()
      indexEntries.value = overview
      injectStats(overview)
      setCache('overview-v3', overview).catch(() => {})
      loadingProgress.value = 90
      if (!selectedId.value) selectedId.value = overview[0]?.id ?? ''
      await ensureDetail(selectedId.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      console.error('loadCatalog failed:', err)
    } finally {
      loading.value = false
      loadingProgress.value = 100
    }
  }

  async function loadCollectionFullIndex(collectionId: string) {
    if (collectionId === 'all' || collectionId === currentCollectionId.value) return
    loading.value = true
    loadingProgress.value = 0
    loadingMessage.value = '正在加载文集数据'
    const cached = fullIndexCache.value.get(collectionId)
    if (cached) {
      indexEntries.value = cached
      isOverviewMode.value = false
      currentCollectionId.value = collectionId
      hasFullCollectionLoaded.value = true
      selectedId.value = cached[0]?.id ?? ''
      injectStats(cached)
      loading.value = false
      return
    }
    try {
      loadingProgress.value = 20
      loadingMessage.value = '正在加载完整索引'
      const fullIndex = await loadShardedIndex(collectionId)
      loadingProgress.value = 80
      fullIndexCache.value.set(collectionId, fullIndex)
      indexEntries.value = fullIndex
      isOverviewMode.value = false
      currentCollectionId.value = collectionId
      hasFullCollectionLoaded.value = true
      selectedId.value = fullIndex[0]?.id ?? ''
      injectStats(fullIndex)
    } catch (err) {
      console.error('loadCollectionFullIndex failed:', err)
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
      loadingProgress.value = 100
    }
  }

  async function switchToOverview() {
    const cached = await getCached('overview-v3')
    if (cached && catalog.value) {
      indexEntries.value = cached
      isOverviewMode.value = true
      currentCollectionId.value = 'all'
      hasFullCollectionLoaded.value = false
      selectedId.value = cached[0]?.id ?? ''
      injectStats(cached)
    } else {
      await loadCatalog()
    }
  }

  function injectStats(entries: IndexEntry[]) {
    const counts = new Map<string, number>()
    for (const e of entries) {
      if (e.tg) for (const tag of e.tg) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
    const tagsStore = useTagsStore()
    tagsStore.setGlobalCounts(counts)
    topAuthorsList.value = extractAuthors(entries)
    topTagsList.value = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 50).map(([k]) => k)
  }

  async function ensureDetail(itemId: string): Promise<string[]> {
    const cached = detailCache.get(itemId)
    if (cached) {
      detailCache.delete(itemId)
      detailCache.set(itemId, cached)
      return cached
    }
    try {
      const colId = indexEntries.value.find((e) => e.id === itemId)?.c
      if (!colId) return []
      const colItems = indexEntries.value.filter((e) => e.c === colId)
      const idx = colItems.findIndex((e) => e.id === itemId)
      if (idx === -1) return []
      const chunkIdx = Math.floor(idx / 2000)
      const r = await fetch('/poetry-data/details/' + colId + '-' + chunkIdx + '.json')
      if (!r.ok) return []
      const chunk: DetailEntry[] = await r.json()
      const found = chunk.find((d) => d.id === itemId)
      if (found) { cacheDetail(itemId, found.paragraphs); return found.paragraphs }
    } catch { /* silent */ }
    return []
  }

  function selectItem(id: string) {
    const entry = indexEntries.value.find((e) => e.id === id)
    selectedId.value = id
    ensureDetail(id)
    if (!entry) return
    // 记录常读作者
    if (entry.a && entry.a !== '佚名') {
      const freq = readAuthorFreq()
      freq[entry.a] = (freq[entry.a] || 0) + 1
      saveAuthorFreq(freq)
      frequentAuthors.value = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_AUTHORS)
        .map(([name, count]) => ({ name, count }))
    }
    // 记录热门标签
    if (entry.tg && entry.tg.length > 0) {
      const tags = readHotTags()
      const tagSet = new Set(tags)
      for (const t of entry.tg) { tagSet.add(t) }
      const updated = [...tagSet].slice(0, 20)
      saveHotTags(updated)
      hotTags.value = updated
    }
  }

  function updateFilters(patch: Partial<PoetryFilters>) {
    const prevCol = filters.value.collectionId
    filters.value = { ...filters.value, ...patch }
    if (patch.collectionId && patch.collectionId !== prevCol && patch.collectionId !== 'all') {
      loadCollectionFullIndex(patch.collectionId)
    } else if (patch.collectionId === 'all' && !isOverviewMode.value) {
      switchToOverview()
    }
    selectedId.value = filteredItems.value[0]?.id ?? selectedId.value
    if (selectedId.value) ensureDetail(selectedId.value)
  }

  function resetFilters() {
    filters.value = { ...defaultFilters }
    selectedId.value = items.value[0]?.id ?? ''
    if (selectedId.value) ensureDetail(selectedId.value)
    if (!isOverviewMode.value) switchToOverview()
  }

  function toggleFavorite(id: string) {
    const next = favorites.value.includes(id)
      ? favorites.value.filter((f) => f !== id)
      : [id, ...favorites.value].slice(0, 80)
    favorites.value = next
    localStorage.setItem('poetry:favorites', JSON.stringify(next))
  }

  return {
    catalog, collections, currentCollectionId, error, favorites, favoriteItems,
    filteredItems, filters, fullIndexCache, hasFullCollectionLoaded, indexEntries,
    isOverviewMode, isUsingOverview, items, loading, loadingMessage, loadingProgress,
    selectedId, selectedItem, topAuthorsList, topTagsList, totalCount,
    frequentAuthors, hotTags,
    ensureDetail, loadCatalog, loadCollectionFullIndex, resetFilters, selectItem,
    switchToOverview, toggleFavorite, updateFilters,
  }
})

function normalize(value: string | undefined) {
  return (value ?? '').trim().toLocaleLowerCase('zh-CN')
}

function readFavorites() {
  if (typeof localStorage === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem('poetry:favorites') ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((i) => typeof i === 'string') : []
  } catch { return [] }
}
