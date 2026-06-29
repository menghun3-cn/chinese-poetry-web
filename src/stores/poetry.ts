import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { PoetryCatalog, PoetryFilters, PoetryItem } from '@/types/poetry'

// ═══ API 基础路径 ═══════════════════════════════════════════
const API_BASE = '/api'
const DEFAULT_PAGE_SIZE = 20

interface SearchResult {
  items: PoetryItem[]
  total: number
  page: number
  pageSize: number
}

interface ApiCatalog {
  generatedAt: string
  sourceRepository: string
  total: number
  collections: { id: string; name: string; dynasty: string; description: string; count: number }[]
}

const defaultFilters: PoetryFilters = {
  keyword: '',
  collectionId: 'all',
  tags: [],
  author: '',
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

function readFavorites() {
  if (typeof localStorage === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem('poetry:favorites') ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((i) => typeof i === 'string') : []
  } catch { return [] }
}

// ═══ API 封装 ════════════════════════════════════════════════
async function fetchApi<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(API_BASE + path, location.origin)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value)
    }
  }
  const resp = await fetch(url.toString())
  if (!resp.ok) throw new Error('API Error: ' + resp.statusText)
  return resp.json()
}

// ═══ Store ════════════════════════════════════════════════════
export const usePoetryStore = defineStore('poetry', () => {
  const catalog = ref<PoetryCatalog | null>(null)
  const collections = computed(() => catalog.value?.collections ?? [])
  const totalCount = computed(() => catalog.value?.total ?? 0)
  const currentCollectionId = ref('all')
  const loading = ref(true)
  const loadingMessage = ref('正在加载诗词数据')
  const loadingProgress = ref(0)
  const error = ref<string | null>(null)

  // 当前搜索结果
  const items = ref<PoetryItem[]>([])
  const totalResults = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(DEFAULT_PAGE_SIZE)

  // 筛选状态
  const filters = ref<PoetryFilters>({ ...defaultFilters })
  const selectedId = ref('')
  const selectedItem = ref<PoetryItem | null>(null)

  // 收藏
  const favorites = ref<string[]>(readFavorites())

  // 常读作者和热门标签
  const frequentAuthors = ref<{ name: string; count: number }[]>(Object.entries(readAuthorFreq())
    .map(([name, count]) => ({ name, count }))
  )
  const hotTags = ref<string[]>(readHotTags())
  const topAuthorsList = ref<{ name: string; count: number }[]>([])
  const topTagsList = ref<string[]>([])

  // 计算属性
  const filteredItems = computed(() => items.value)
  const isOverviewMode = computed(() => true)
  const isUsingOverview = computed(() => true)
  const hasFullCollectionLoaded = computed(() => true)
  const indexEntries = computed(() => [] as any[])
  const favoriteItems = computed(() =>
    items.value.filter((item) => favorites.value.includes(item.id))
  )

  // 初始化
  async function loadCatalog() {
    loading.value = true
    loadingMessage.value = '正在加载诗词数据'
    loadingProgress.value = 10
    error.value = null

    try {
      const [catalogData, searchData] = await Promise.all([
        fetchApi<ApiCatalog>('/catalog'),
        fetchApi<SearchResult>('/search', { page: '1', page_size: String(DEFAULT_PAGE_SIZE) }),
      ])

      loadingProgress.value = 60

      catalog.value = {
        generatedAt: catalogData.generatedAt,
        sourceRepository: catalogData.sourceRepository,
        total: catalogData.total,
        collections: catalogData.collections.map(c => ({ ...c, sources: [] })),
        items: [],
      }

      items.value = searchData.items
      totalResults.value = searchData.total
      loadingProgress.value = 100
      loading.value = false

      // 默认选中第一首
      if (searchData.items.length > 0) {
        selectItem(searchData.items[0].id)
      }
    } catch (e: any) {
      error.value = e.message || '加载失败'
      loading.value = false
    }
  }

  // 搜索
  async function updateFilters(newFilters: Partial<PoetryFilters>) {
    filters.value = { ...filters.value, ...newFilters }
    loading.value = true
    loadingMessage.value = '正在搜索诗词'
    currentPage.value = 1

    try {
      const params: Record<string, string> = {
        page: '1',
        page_size: String(pageSize.value),
      }
      if (filters.value.keyword) params.keyword = filters.value.keyword
      if (filters.value.author) params.author = filters.value.author
      if (filters.value.collectionId && filters.value.collectionId !== 'all') {
        params.collection_id = filters.value.collectionId
      }

      const data = await fetchApi<SearchResult>('/search', params)
      items.value = data.items
      totalResults.value = data.total
      loading.value = false

      // 自动选择第一首
      if (data.items.length > 0 && !selectedItem.value) {
        selectItem(data.items[0].id)
      }
    } catch (e: any) {
      error.value = e.message || '搜索失败'
      loading.value = false
    }
  }

  async function loadMore() {
    if (currentPage.value * pageSize.value >= totalResults.value) return
    loading.value = true
    currentPage.value++
    try {
      const params: Record<string, string> = {
        page: String(currentPage.value),
        page_size: String(pageSize.value),
      }
      if (filters.value.keyword) params.keyword = filters.value.keyword
      if (filters.value.author) params.author = filters.value.author
      if (filters.value.collectionId && filters.value.collectionId !== 'all') {
        params.collection_id = filters.value.collectionId
      }
      const data = await fetchApi<SearchResult>('/search', params)
      items.value = [...items.value, ...data.items]
      loading.value = false
    } catch {
      currentPage.value--
      loading.value = false
    }
  }

  // 选择诗词
  async function selectItem(id: string) {
    selectedId.value = id
    const existing = items.value.find((i) => i.id === id)
    if (existing) selectedItem.value = existing
    const detail = await ensureDetail(id)
    if (detail) selectedItem.value = detail

    if (selectedItem.value?.author) {
      const authorName = selectedItem.value.author
      const freq = readAuthorFreq()
      freq[authorName] = (freq[authorName] || 0) + 1
      saveAuthorFreq(freq)
      frequentAuthors.value = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_AUTHORS)
        .map(([name, count]) => ({ name, count }))
    }

    if (selectedItem.value?.tags?.length) {
      const tags = readHotTags()
      for (const tag of selectedItem.value.tags) {
        if (!tags.includes(tag)) {
          tags.unshift(tag)
          if (tags.length > 20) tags.pop()
        }
      }
      saveHotTags(tags)
      hotTags.value = tags
    }
  }

  async function ensureDetail(id: string): Promise<PoetryItem | null> {
    if (selectedItem.value?.id === id && selectedItem.value.paragraphs.length > 0) {
      return selectedItem.value
    }
    try {
      const detail = await fetchApi<PoetryItem>('/detail', { id })
      if (detail) {
        const idx = items.value.findIndex((i) => i.id === id)
        if (idx >= 0) items.value[idx] = { ...items.value[idx], paragraphs: detail.paragraphs }
        selectedItem.value = detail
      }
      return detail
    } catch { return null }
  }

  function toggleFavorite(id: string) {
    const next = favorites.value.includes(id)
      ? favorites.value.filter((f) => f !== id)
      : [id, ...favorites.value].slice(0, 80)
    favorites.value = next
    localStorage.setItem('poetry:favorites', JSON.stringify(next))
  }

  function removeFrequentAuthor(name: string) {
    const freq = readAuthorFreq()
    delete freq[name]
    saveAuthorFreq(freq)
    frequentAuthors.value = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_AUTHORS)
      .map(([name, count]) => ({ name, count }))
  }

  function removeHotTag(tag: string) {
    const tags = readHotTags()
    hotTags.value = tags.filter(t => t !== tag)
    saveHotTags(hotTags.value)
  }

  function resetFilters() {
    filters.value = { ...defaultFilters }
    updateFilters({})
  }

  async function loadCollectionFullIndex(collectionId: string) {
    currentCollectionId.value = collectionId
    await updateFilters({ collectionId })
  }

  function switchToOverview() { /* no-op */ }

  return {
    catalog, collections, currentCollectionId, error, favorites, favoriteItems,
    filteredItems, filters, hasFullCollectionLoaded, indexEntries,
    isOverviewMode, isUsingOverview, items, loading, loadingMessage, loadingProgress,
    selectedId, selectedItem, topAuthorsList, topTagsList, totalCount,
    frequentAuthors, hotTags, removeFrequentAuthor, removeHotTag,
    ensureDetail, loadCatalog, loadCollectionFullIndex, loadMore,
    resetFilters, selectItem, switchToOverview, toggleFavorite, updateFilters,
  }
})
