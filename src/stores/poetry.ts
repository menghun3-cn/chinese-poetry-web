import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { PoetryCatalog, PoetryFilters, PoetryItem } from '@/types/poetry'
import { useTagsStore } from '@/stores/tags'

const defaultFilters: PoetryFilters = {
  keyword: '',
  collectionId: 'all',
  tags: [],
  author: '',
}

type FilterKey = keyof PoetryFilters

export const usePoetryStore = defineStore('poetry', () => {
  const catalog = ref<PoetryCatalog | null>(null)
  const selectedId = ref('')
  const filters = ref<PoetryFilters>({ ...defaultFilters })
  const loading = ref(false)
  const error = ref('')
  const favorites = ref<string[]>(readFavorites())

  const items = computed(() => catalog.value?.items ?? [])
  const collections = computed(() => catalog.value?.collections ?? [])

  const selectedItem = computed(() => {
    if (!items.value.length) return null
    return items.value.find((item) => item.id === selectedId.value) ?? items.value[0]
  })

  const filteredItems = computed(() => {
    return items.value.filter((item) => matchesPoetryFilters(item, filters.value))
  })

  // 全局热度（不受当前筛选影响）
  const topTags = computed(() => {
    const tagsStore = useTagsStore()
    const all = [...tagsStore.globalTagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 16)
      .map(([name, count]) => ({ name, count }))
    return all
  })

  const topAuthors = computed(() => {
    const counter = new Map<string, number>()
    for (const item of items.value) {
      if (item.author && item.author !== '佚名')
        counter.set(item.author, (counter.get(item.author) ?? 0) + 1)
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

  async function loadCatalog() {
    if (catalog.value || loading.value) return

    loading.value = true
    error.value = ''
    try {
      const response = await fetch('/poetry-data/catalog.json')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      catalog.value = (await response.json()) as PoetryCatalog
      selectedId.value = catalog.value.items[0]?.id ?? ''

      // 注入全局标签统计到 tags store
      const globalCounts = new Map<string, number>()
      for (const item of catalog.value.items) {
        if (item.tags) {
          for (const tag of item.tags) {
            globalCounts.set(tag, (globalCounts.get(tag) ?? 0) + 1)
          }
        }
      }
      const tagsStore = useTagsStore()
      tagsStore.setGlobalCounts(globalCounts)
    } catch {
      error.value = '诗词索引加载失败，请确认已执行 npm run build 或 npm run prebuild。'
    } finally {
      loading.value = false
    }
  }

  function selectItem(id: string) {
    selectedId.value = id
  }

  function updateFilters(patch: Partial<PoetryFilters>) {
    filters.value = { ...filters.value, ...patch }
    selectedId.value = filteredItems.value[0]?.id ?? selectedId.value
  }

  function resetFilters() {
    filters.value = { ...defaultFilters }
    selectedId.value = items.value[0]?.id ?? ''
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
    loading,
    selectedId,
    selectedItem,
    topAuthors,
    topTags,
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

function matchesPoetryFilters(
  item: PoetryItem,
  filters: PoetryFilters,
  ignoredKeys: FilterKey[] = [],
) {
  const ignored = new Set<FilterKey>(ignoredKeys)

  const matchesCollection =
    ignored.has('collectionId') ||
    filters.collectionId === 'all' ||
    item.collectionId === filters.collectionId

  // 多标签匹配：选中的标签中，只要作品包含任意一个即匹配
  const matchesTag =
    ignored.has('tags') ||
    !filters.tags.length ||
    filters.tags.some((tag) => item.tags.includes(tag))

  const matchesAuthor =
    ignored.has('author') ||
    !filters.author ||
    normalize(item.author).includes(normalize(filters.author))

  const haystack = normalize(
    [item.title, item.author, item.collection, item.rhythmic, item.excerpt, ...item.tags].join(' '),
  )
  const matchesKeyword =
    ignored.has('keyword') || !filters.keyword || haystack.includes(normalize(filters.keyword))

  return matchesCollection && matchesTag && matchesAuthor && matchesKeyword
}

function readFavorites() {
  if (typeof localStorage === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem('poetry:favorites') ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}
