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

function getCacheKey(collectionId: string, chunkIdx?: number): string {
  return chunkIdx !== undefined ? '' + collectionId + '-chunk-' + chunkIdx : '' + collectionId + '-full'
}

async function getCachedIndex(collectionId: string): Promise<IndexEntry[] | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('index', 'readonly')
      const req = tx.objectStore('index').get(getCacheKey(collectionId, -1))
      req.onsuccess = () => { resolve(req.result ?? null) }
      req.onerror = () => { resolve(null) }
      tx.oncomplete = () => db.close()
    })
  } catch {
    return null
  }
}

async function setCachedIndex(collectionId: string, data: IndexEntry[]): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('index', 'readwrite')
      tx.objectStore('index').put(data, getCacheKey(collectionId, -1))
      tx.oncomplete = () => { db.close(); resolve() }
    })
  } catch { /* silent */ }
}

async function getCachedChunk(collectionId: string, chunkIdx: number): Promise<IndexEntry[] | null> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('index', 'readonly')
      const req = tx.objectStore('index').get(getCacheKey(collectionId, chunkIdx))
      req.onsuccess = () => { resolve(req.result ?? null) }
      req.onerror = () => { resolve(null) }
      tx.oncomplete = () => db.close()
    })
  } catch {
    return null
  }
}

async function setCachedChunk(collectionId: string, chunkIdx: number, data: IndexEntry[]): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('index', 'readwrite')
      tx.objectStore('index').put(data, getCacheKey(collectionId, chunkIdx))
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
    if (e.a && e.a !== '\u6c5a\u540d') counter.set(e.a, (counter.get(e.a) || 0) + 1)
  }
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .map(([name, count]) => ({ name, count }))
}

/** 甯歌浣滆€咃細localStorage 鎸佷箙鍖栫殑鐢ㄦ埛闃呰鍘嗗彶 */
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

/** 鐑棬鏍囩锛歭ocalStorage 鎸佷箙鍖栫殑鐢ㄦ埛甯哥敤鏍囩 */
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

/**
 * 娓愯繘寮忓垎鐗囧姞杞界储寮曪細
 * 1. 鍏堝姞杞?meta.json 鑾峰彇鍒嗙墖淇℃伅
 * 2. 鍔犺浇棣栦釜鍒嗙墖鍚庣珛鍗宠繑鍥烇紙瀹屾垚锛夛紝鐢ㄦ埛鑳界珛鍗崇湅鍒板垪琛?
 * 3. 鍚庡彴閫愪釜鍔犺浇鍓╀綑鍒嗙墖骞惰拷鍔犲埌 indexEntries
 * 4. 缂撳瓨鍦?IndexedDB 涓紙姣忎釜鍒嗙墖鐙珛缂撳瓨锛?
 */
async function loadShardedIndexProgressive(
  collectionId: string,
  indexEntries: { value: IndexEntry[] },
  loadingMessage: { value: string },
  loadingProgress: { value: number }
): Promise<void> {
  const metaResp = await fetch('/poetry-data/index.' + collectionId + '.meta.json')
  if (!metaResp.ok) {
    // 鏃犲垎鐗囩殑灏忓瀷鏂囬泦锛岀洿鎺ュ姞杞藉崟鏂囦欢
    const singleResp = await fetch('/poetry-data/index.' + collectionId + '.json')
    if (!singleResp.ok) throw new Error('Cannot load index: ' + collectionId)
    const data: IndexEntry[] = await singleResp.json()
    indexEntries.value = data
    setCachedIndex(collectionId, data).catch(() => {})
    return
  }

  const meta: IndexMeta = await metaResp.json()

  if (meta.chunks <= 1) {
    // 鍗曚釜鍒嗙墖锛岀洿鎺ュ姞杞?
    const resp = await fetch('/poetry-data/index.' + collectionId + '.0.json')
    if (!resp.ok) throw new Error('Chunk load failed: ' + collectionId + '.0')
    const data: IndexEntry[] = await resp.json()
    indexEntries.value = data
    setCachedChunk(collectionId, 0, data).catch(() => {})
    return
  }

  // 澶氬垎鐗囷細娓愯繘寮忓姞杞?
  // 1) 鍏堝皾璇曠紦瀛?
  const fullCached = await getCachedIndex(collectionId)
  if (fullCached?.length === meta.total) {
    indexEntries.value = fullCached
    return
  }

  // 2) 閫愪釜灏濊瘯鐙珛鍒嗙墖缂撳瓨
  const cachedChunks: IndexEntry[][] = []
  let allCached = true
  for (let i = 0; i < meta.chunks; i++) {
    const cc = await getCachedChunk(collectionId, i)
    if (cc) cachedChunks[i] = cc
    else allCached = false
  }
  if (allCached) {
    const merged: IndexEntry[] = []
    for (const cc of cachedChunks) merged.push(...cc)
    indexEntries.value = merged
    setCachedIndex(collectionId, merged).catch(() => {})
    return
  }

  // 3) 鍏堟妸宸叉湁缂撳瓨鐨勫垎鐗囧悎骞舵樉绀?
  if (cachedChunks.some(Boolean)) {
    const partial: IndexEntry[] = []
    for (const cc of cachedChunks) if (cc) partial.push(...cc)
    indexEntries.value = partial
  }

  // 4) 鍔犺浇棣栦釜鍒嗙墖锛堜紭鍏堝姞杞斤級
  const firstChunkIdx = cachedChunks.findIndex(c => !c)
  const startIdx = firstChunkIdx >= 0 ? firstChunkIdx : 0
  if (!cachedChunks[startIdx]) {
    loadingMessage.value = '' + collectionId + ' 索引加载中（' + (startIdx + 1) + '/' + meta.chunks + '）'
    const resp = await fetch('/poetry-data/index.' + collectionId + '.' + startIdx + '.json')
    if (resp.ok) {
      const chunk: IndexEntry[] = await resp.json()
      const current = [...indexEntries.value]
      const offset = startIdx * meta.chunkSize
      for (let j = 0; j < chunk.length; j++) {
        current[offset + j] = chunk[j]
      }
      indexEntries.value = current.filter(Boolean)
      setCachedChunk(collectionId, startIdx, chunk).catch(() => {})
    }
  }

  // 5) 鍚庡彴閫愪釜鍔犺浇鍓╀綑鍒嗙墖
  const remaining = []
  for (let i = 0; i < meta.chunks; i++) {
    if (!cachedChunks[i]) remaining.push(i)
  }
  for (const idx of remaining) {
    if (idx === startIdx) continue // 宸插姞杞?
    loadingMessage.value = '' + collectionId + ' 索引加载中（' + (idx + 1) + '/' + meta.chunks + '）'
    try {
      const resp = await fetch('/poetry-data/index.' + collectionId + '.' + idx + '.json')
      if (!resp.ok) continue
      const chunk: IndexEntry[] = await resp.json()
      const current = [...indexEntries.value]
      const offset = idx * meta.chunkSize
      for (let j = 0; j < chunk.length; j++) {
        current[offset + j] = chunk[j]
      }
      indexEntries.value = current.filter(Boolean)
      setCachedChunk(collectionId, idx, chunk).catch(() => {})
    } catch { /* skip failed chunk */ }
  }

  // 6) 缂撳瓨瀹屾暣绱㈠紩
  const full = indexEntries.value
  if (full.length === meta.total) {
    setCachedIndex(collectionId, full).catch(() => {})
  }
}

export const usePoetryStore = defineStore('poetry', () => {
  const catalog = ref<PoetryCatalog | null>(null)
  const indexEntries = ref<IndexEntry[]>([])
  const isOverviewMode = ref(true)
  const currentCollectionId = ref('all')
  const loading = ref(false)
  const loadingMessage = ref('\u6b63\u5728\u52a0\u8f7d')
  const loadingProgress = ref(0)
  const error = ref('')
  const selectedId = ref('')
  const topAuthorsList = ref<{ name: string; count: number }[]>([])
  const topTagsList = ref<string[]>([])
  const hasFullCollectionLoaded = ref(false)
  const frequentAuthors = ref<{ name: string; count: number }[]>(
  Object.entries(readAuthorFreq())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_AUTHORS)
    .map(([name, count]) => ({ name, count }))
)
  const hotTags = ref<string[]>(readHotTags())

  const filters = ref<PoetryFilters>({ ...defaultFilters })

  const favorites = ref<string[]>(readFavorites())

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
    items.value.filter((item) => favorites.value.includes(item.id)),
  )

  const selectedItem = computed<PoetryItem | null>(() => {
    return items.value.find((item) => item.id === selectedId.value) ?? null
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
    loadingMessage.value = '\u6b63\u5728\u52a0\u8f7d\u8bd7\u8bcd\u7d22\u5f15'
    loadingProgress.value = 10
    error.value = ''
    try {
      // 1) 鍏堝皾璇曞唴鑱?meta 鏁版嵁锛堟瀯寤烘椂娉ㄥ叆锛?
      const inlineMetaEl = document.getElementById('poetry-meta-data')
      if (inlineMetaEl) {
        try {
          const meta: PoetryCatalog = JSON.parse(inlineMetaEl.textContent || '{}')
          if (meta.collections?.length) catalog.value = meta
        } catch { /* fallback to network */ }
      }
      if (!catalog.value) {
        loadingProgress.value = 20
        const r = await fetch('/poetry-data/meta.json')
        if (!r.ok) throw new Error('HTTP ' + r.status)
        catalog.value = await r.json() as PoetryCatalog
      }

      loadingProgress.value = 30

      // 2) 鍏堝皾璇曞唴鑱旀瑙堟暟鎹€斺€旂寮€
      const inlineOverviewEl = document.getElementById('poetry-overview-data')
      if (inlineOverviewEl) {
        try {
          const inlineData: IndexEntry[] = JSON.parse(inlineOverviewEl.textContent || '[]')
          if (inlineData.length > 0) {
            indexEntries.value = inlineData
            injectStats(inlineData)
            if (!selectedId.value) selectedId.value = inlineData[0]?.id ?? ''
            await ensureDetail(selectedId.value)
            loading.value = false
            loadingProgress.value = 100
            // 鍚庡彴缁х画鍔犺浇瀹屾暣姒傝
            loadFullOverviewInBackground()
            return
          }
        } catch { /* fallback */ }
      }

      // 3) 灏濊瘯 IndexedDB 缂撳瓨鐨勬瑙?
      loadingProgress.value = 40
      loadingMessage.value = '\u6b63\u5728\u52a0\u8f7d\u8bd7\u8bcd\u6982\u89c8'
      const r2 = await fetch('/poetry-data/index.overview.json')
      if (!r2.ok) throw new Error('HTTP ' + r2.status)
      loadingProgress.value = 70
      const overview: IndexEntry[] = await r2.json()
      indexEntries.value = overview
      injectStats(overview)
      loadingProgress.value = 90
      if (!selectedId.value) selectedId.value = overview[0]?.id ?? ''
      await ensureDetail(selectedId.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
      loadingProgress.value = 100
    }
  }

  // 鍚庡彴鍔犺浇瀹屾暣姒傝锛堝唴鑱旀暟鎹粎 2000 鏉★紝鍚庡彴鍔犺浇瀹屾暣 18000+ 鏉★級
  let _bgLoaded = false
  async function loadFullOverviewInBackground() {
    if (_bgLoaded) return
    _bgLoaded = true
    try {
      const r = await fetch('/poetry-data/index.overview.json')
      if (!r.ok) return
      const full: IndexEntry[] = await r.json()
      if (full.length > indexEntries.value.length) {
        indexEntries.value = full
        injectStats(full)
        setCachedIndex('overview', full).catch(() => {})
      }
    } catch { /* silent */ }
  }

  async function loadCollectionFullIndex(collectionId: string) {
    if (!catalog.value) return
    loading.value = true
    loadingMessage.value = '\u6b63\u5728\u52a0\u8f7d\u6587\u96c6\u6570\u636e'
    loadingProgress.value = 10
    error.value = ''
    try {
      currentCollectionId.value = collectionId
      isOverviewMode.value = false
      hasFullCollectionLoaded.value = false

      // 娓愯繘寮忓垎鐗囧姞杞解€斺€斿厛鍔犺浇棣栦釜鍒嗙墖灏辨樉绀猴紝鍚庡彴缁х画鍔犺浇鍓╀綑
      await loadShardedIndexProgressive(collectionId, indexEntries, loadingMessage, loadingProgress)
      // 姝ゆ椂 indexEntries 宸叉湁鑷冲皯棣栦釜鍒嗙墖鏁版嵁锛堟垨鍏ㄩ噺宸茬紦瀛橈級
      hasFullCollectionLoaded.value = true

      // 鏇存柊缁熻锛堝熀浜庡凡鍔犺浇鐨勯儴鍒嗭級
      injectStats(indexEntries.value)

      if (!selectedId.value || !indexEntries.value.find(e => e.id === selectedId.value)) {
        selectedId.value = indexEntries.value[0]?.id ?? ''
      }
      await ensureDetail(selectedId.value)
    } catch (err) {
      console.error('loadCollectionFullIndex failed:', err)
      error.value = err instanceof Error ? err.message : String(err)
    } finally {
      loading.value = false
      loadingProgress.value = 100
    }
  }

  function switchToOverview() {
    // 鐩存帴浣跨敤鍐呰仈/缂撳瓨鐨勬瑙堟暟鎹?
    // 鐢ㄦ埛宸插湪 loadCatalog 涓姞杞戒簡 overview
    isOverviewMode.value = true
    currentCollectionId.value = 'all'
    hasFullCollectionLoaded.value = false
    // 閲嶆柊瑙﹀彂 loadCatalog锛堝鏋滀箣鍓嶅姞杞戒簡鏂囬泦绱㈠紩锛宱verview 鍙兘宸茶瑕嗙洊锛?
    // 鍥犱负鎴戜滑鍙紦瀛樹簡 overview 鍦?IndexedDB 涓紝娌℃湁鍦ㄥ唴瀛樹腑淇濈暀鍓湰
    loadCatalog()
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
    // 璁板綍甯歌浣滆€?
    if (entry.a && entry.a !== '\u6c5a\u540d') {
      const freq = readAuthorFreq()
      freq[entry.a] = (freq[entry.a] || 0) + 1
      saveAuthorFreq(freq)
      frequentAuthors.value = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_AUTHORS)
        .map(([name, count]) => ({ name, count }))
    }
    // 璁板綍鐑棬鏍囩
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
    filteredItems, filters, hasFullCollectionLoaded, indexEntries,
    isOverviewMode, isUsingOverview, items, loading, loadingMessage, loadingProgress,
    selectedId, selectedItem, topAuthorsList, topTagsList, totalCount,
    frequentAuthors, hotTags,
    ensureDetail, loadCatalog, loadCollectionFullIndex, resetFilters, selectItem,
    switchToOverview, toggleFavorite, updateFilters,
  }
})


function buildItems(entries: any[]): PoetryItem[] {
  return entries.map(function(e: any) {
    return {
      id: e.id,
      title: e.t || "无题",
      author: e.a || "佚名",
      dynasty: e.d || "",
      collection: "",
      collectionId: e.c || "",
      rhythmic: e.r || "",
      tags: e.tg || [],
      paragraphs: [],
      excerpt: e.e || "",
      length: e.l || 0,
      sourcePath: e.sp || "",
    }
  })
}

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

