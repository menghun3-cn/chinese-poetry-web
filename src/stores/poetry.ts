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

const defaultFilters: PoetryFilters = {
  keyword: "",
  collectionId: "all",
  tags: [],
  author: "",
}

type FilterKey = keyof PoetryFilters

const DB_NAME = "poetry-cache"
const DB_VERSION = 2

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains("index")) db.createObjectStore("index")
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta")
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getCached(key: string): Promise<IndexEntry[] | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction("index", "readonly")
      const req = tx.objectStore("index").get(key)
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
      const tx = db.transaction("index", "readwrite")
      tx.objectStore("index").put(data, key)
      tx.oncomplete = () => { db.close(); resolve() }
    })
  } catch {
    /* silent */
  }
}

async function getMetaCache(key: string): Promise<PoetryCatalog | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction("meta", "readonly")
      const req = tx.objectStore("meta").get(key)
      req.onsuccess = () => { resolve(req.result ?? null) }
      req.onerror = () => { resolve(null) }
      tx.oncomplete = () => db.close()
    })
  } catch {
    return null
  }
}

async function setMetaCache(key: string, data: PoetryCatalog): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction("meta", "readwrite")
      tx.objectStore("meta").put(data, key)
      tx.oncomplete = () => { db.close(); resolve() }
    })
  } catch {
    /* silent */
  }
}

const detailCache = new Map<string, string[]>()
const DETAIL_CACHE_MAX = 50

function cacheDetail(id: string, paragraphs: string[]) {
  if (detailCache.size >= DETAIL_CACHE_MAX) {
    const firstKey = detailCache.keys().next().value
    if (firstKey) detailCache.delete(firstKey)
  }
  detailCache.set(id, paragraphs)
}

function extractAuthors(entries: IndexEntry[]) {
  const counter = new Map<string, number>()
  for (const e of entries) {
    if (e.a && e.a !== "\u4f5a\u540d") counter.set(e.a, (counter.get(e.a) || 0) + 1)
  }
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .map(([name, count]) => ({ name, count }))
}

export const usePoetryStore = defineStore("poetry", () => {
  const catalog = ref<PoetryCatalog | null>(null)
  const indexEntries = ref<IndexEntry[]>([])
  const isOverviewMode = ref(true)
  const currentCollectionId = ref("all")
  const selectedId = ref("")
  const filters = ref<PoetryFilters>({ ...defaultFilters })
  const loading = ref(true)
  const loadingProgress = ref(0)
  const error = ref("")
  const favorites = ref<string[]>(readFavorites())
  const topAuthorsList = ref<{ name: string; count: number }[]>([])
  const topTagsList = ref<string[]>([])
  const hasFullCollectionLoaded = ref(false)

  const items = computed<PoetryItem[]>(() =>
    indexEntries.value.map((e) => ({
      id: e.id,
      title: e.t,
      author: e.a,
      dynasty: e.d,
      collection: catalog.value?.collections.find((c) => c.id === e.c)?.name ?? "",
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

  const selectedItem = computed<PoetryItem | null>(() => {
    if (!items.value.length) return null
    const found = items.value.find((item) => item.id === selectedId.value)
    return found ?? items.value[0]
  })

  const favoriteItems = computed<PoetryItem[]>(() =>
    items.value.filter((item) => favorites.value.includes(item.id))
  )

  const filteredItems = computed(() => {
    const f = filters.value
    const all = items.value
    if (!f.keyword && !f.author && !f.tags.length && (f.collectionId === "all" || f.collectionId === "")) return all
    return all.filter((item) => {
      if (f.collectionId !== "all" && item.collectionId !== f.collectionId) return false
      if (f.tags.length && !f.tags.some((tag) => item.tags.includes(tag))) return false
      if (f.author && !normalize(item.author).includes(normalize(f.author))) return false
      if (f.keyword) {
        const haystack = normalize([item.title, item.author, item.collection, item.rhythmic, item.excerpt, ...item.tags].join(" "))
        if (!haystack.includes(normalize(f.keyword))) return false
      }
      return true
    })
  })

  const isUsingOverview = computed(() => isOverviewMode.value)

  async function loadCatalog() {
    if (catalog.value) return
    loading.value = true
    loadingProgress.value = 0
    error.value = ""

    try {
      const [cachedIndex, cachedMeta] = await Promise.all([getCached("overview-v2"), getMetaCache("v1")])
      if (cachedIndex && cachedMeta) {
        indexEntries.value = cachedIndex
        catalog.value = cachedMeta
        selectedId.value = cachedIndex[0]?.id ?? ""
        loadingProgress.value = 50
        isOverviewMode.value = true
        injectStats(cachedIndex)
      }

      const [metaResp, ovResp] = await Promise.all([
        fetch("/poetry-data/meta.json"),
        fetch("/poetry-data/optimized-index.json"),
      ])
      if (!metaResp.ok) throw new Error(`HTTP ${metaResp.status}`)
      loadingProgress.value = 30

      const freshMeta: PoetryCatalog = await metaResp.json()
      const overviewIndex: IndexEntry[] = await ovResp.json()
      loadingProgress.value = 60

      catalog.value = freshMeta
      indexEntries.value = overviewIndex
      selectedId.value = overviewIndex[0]?.id ?? ""
      isOverviewMode.value = true
      injectStats(overviewIndex)

      Promise.all([setCache("overview-v2", overviewIndex), setMetaCache("v1", freshMeta)]).catch(() => {})
      loadingProgress.value = 100
    } catch (err) {
      if (!catalog.value) {
        error.value = "\u8bd7\u8bcd\u7d22\u5f15\u52a0\u8f7d\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u7f51\u7edc\u540e\u5237\u65b0\u91cd\u8bd5\u3002"
      }
    } finally {
      loading.value = false
    }
  }

  async function loadCollectionFullIndex(collectionId: string) {
    if (!catalog.value) return
    if (currentCollectionId.value === collectionId && hasFullCollectionLoaded.value) return
    if (collectionId === "all") {
      switchToOverview()
      return
    }

    loading.value = true
    loadingProgress.value = 10

    try {
      const cacheKey = `full-${collectionId}`
      const cached = await getCached(cacheKey)
      if (cached) {
        indexEntries.value = cached
        isOverviewMode.value = false
        currentCollectionId.value = collectionId
        hasFullCollectionLoaded.value = true
        selectedId.value = cached[0]?.id ?? ""
        injectStats(cached)
        loading.value = false
        loadingProgress.value = 100
        return
      }

      loadingProgress.value = 30
      const resp = await fetch(`/poetry-data/index.${collectionId}.json`)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      loadingProgress.value = 60

      const fullIndex: IndexEntry[] = await resp.json()
      indexEntries.value = fullIndex
      isOverviewMode.value = false
      currentCollectionId.value = collectionId
      hasFullCollectionLoaded.value = true
      selectedId.value = fullIndex[0]?.id ?? ""
      injectStats(fullIndex)

      setCache(cacheKey, fullIndex).catch(() => {})
      loadingProgress.value = 100
    } catch (err) {
      console.error(`\u52a0\u8f7d\u6587\u96c6 ${collectionId} \u7d22\u5f15\u5931\u8d25:`, err)
    } finally {
      loading.value = false
    }
  }

  async function switchToOverview() {
    const cached = await getCached("overview-v2")
    if (cached && catalog.value) {
      indexEntries.value = cached
      isOverviewMode.value = true
      currentCollectionId.value = "all"
      hasFullCollectionLoaded.value = false
      selectedId.value = cached[0]?.id ?? ""
      injectStats(cached)
    }
  }

  function injectStats(entries: IndexEntry[]) {
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

    topAuthorsList.value = extractAuthors(entries)
    topTagsList.value = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([name]) => name)
  }

  async function ensureDetail(itemId: string): Promise<string[]> {
    const cached = detailCache.get(itemId)
    if (cached) {
      detailCache.delete(itemId)
      detailCache.set(itemId, cached)
      return cached
    }

    try {
      const collectionId = indexEntries.value.find((e) => e.id === itemId)?.c
      if (!collectionId) return []
      const colItems = indexEntries.value.filter((e) => e.c === collectionId)
      const idxInCol = colItems.findIndex((e) => e.id === itemId)
      if (idxInCol === -1) return []
      const chunkIndex = Math.floor(idxInCol / 3000)

      const resp = await fetch(`/poetry-data/details/${collectionId}-${chunkIndex}.json`)
      if (!resp.ok) return []

      const chunk: DetailEntry[] = await resp.json()
      const found = chunk.find((d) => d.id === itemId)
      if (found) {
        cacheDetail(itemId, found.paragraphs)
        return found.paragraphs
      }
    } catch {
      /* silent */
    }
    return []
  }

  function selectItem(id: string) {
    selectedId.value = id
    ensureDetail(id)
  }

  function updateFilters(patch: Partial<PoetryFilters>) {
    const prevCollection = filters.value.collectionId
    filters.value = { ...filters.value, ...patch }

    if (patch.collectionId && patch.collectionId !== prevCollection) {
      loadCollectionFullIndex(patch.collectionId)
    }

    selectedId.value = filteredItems.value[0]?.id ?? selectedId.value
    if (selectedId.value) ensureDetail(selectedId.value)
  }

  function resetFilters() {
    filters.value = { ...defaultFilters }
    selectedId.value = items.value[0]?.id ?? ""
    if (selectedId.value) ensureDetail(selectedId.value)
    if (!isOverviewMode.value) switchToOverview()
  }

  function toggleFavorite(id: string) {
    const next = favorites.value.includes(id)
      ? favorites.value.filter((fid) => fid !== id)
      : [id, ...favorites.value].slice(0, 80)
    favorites.value = next
    localStorage.setItem("poetry:favorites", JSON.stringify(next))
  }

  return {
    catalog,
    collections,
    currentCollectionId,
    error,
    favorites,
    filteredItems,
    filters,
    favoriteItems,
    hasFullCollectionLoaded,
    indexEntries,
    isOverviewMode,
    isUsingOverview,
    items,
    loading,
    loadingProgress,
    selectedId,
    selectedItem,
    topAuthorsList,
    topTagsList,
    ensureDetail,
    loadCatalog,
    loadCollectionFullIndex,
    resetFilters,
    selectItem,
    switchToOverview,
    toggleFavorite,
    updateFilters,
  }
})

function normalize(value: string | undefined) {
  return (value ?? "").trim().toLocaleLowerCase("zh-CN")
}

function readFavorites() {
  if (typeof localStorage === "undefined") return []
  try {
    const parsed = JSON.parse(localStorage.getItem("poetry:favorites") ?? "[]")
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []
  } catch {
    return []
  }
}
