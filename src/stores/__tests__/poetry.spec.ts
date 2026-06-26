import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { usePoetryStore } from '@/stores/poetry'
import { useTagsStore } from '@/stores/tags'
import type { PoetryCatalog, PoetryItem } from '@/types/poetry'

function createItem(patch: Partial<PoetryItem>): PoetryItem {
  return {
    id: patch.id ?? 'item-1',
    title: patch.title ?? '题名',
    author: patch.author ?? '佚名',
    dynasty: patch.dynasty ?? '宋',
    collection: patch.collection ?? '宋词',
    collectionId: patch.collectionId ?? 'song-ci',
    rhythmic: patch.rhythmic,
    tags: patch.tags ?? [],
    paragraphs: patch.paragraphs ?? ['测试句'],
    excerpt: patch.excerpt ?? '测试句',
    length: patch.length ?? 3,
    sourcePath: patch.sourcePath ?? 'mock.json',
  }
}

function createCatalog(items: PoetryItem[]): PoetryCatalog {
  return {
    generatedAt: '2026-06-26T00:00:00.000Z',
    sourceRepository: 'mock',
    total: items.length,
    collections: [],
    items,
  }
}

describe('poetry store filters', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('多标签筛选：任意匹配即命中', () => {
    const store = usePoetryStore()
    store.catalog = createCatalog([
      createItem({ id: 'song-1', author: '张先', tags: ['宋词三百首'] }),
      createItem({ id: 'song-2', author: '张先', tags: ['宋词三百首', '西湖'] }),
      createItem({ id: 'tang-1', author: '李白', dynasty: '唐', tags: ['隋・唐・五代'] }),
    ])

    store.updateFilters({ tags: ['宋词三百首'] })

    expect(store.filteredItems).toHaveLength(2)
  })

  it('多标签支持多个标签匹配', () => {
    const store = usePoetryStore()
    store.catalog = createCatalog([
      createItem({ id: 'song-1', author: '张先', tags: ['宋词三百首'] }),
      createItem({ id: 'song-2', author: '张先', tags: ['宋词三百首', '西湖'] }),
      createItem({ id: 'tang-1', author: '李白', dynasty: '唐', tags: ['隋・唐・五代'] }),
    ])

    store.updateFilters({ tags: ['宋词三百首', '隋・唐・五代'] })

    // 三个作品各匹配其中至少一个标签
    expect(store.filteredItems).toHaveLength(3)
  })

  it('无匹配时返回空', () => {
    const store = usePoetryStore()
    store.catalog = createCatalog([
      createItem({ id: 'song-1', author: '张先', tags: ['宋词三百首'] }),
    ])

    store.updateFilters({ tags: ['不存在的标签'] })

    expect(store.filteredItems).toHaveLength(0)
  })
})

describe('topTags 全局热度（不受筛选影响）', () => {
  it('topTags 基于全局数据而非当前筛选', () => {
    setActivePinia(createPinia())
    const store = usePoetryStore()
    const tagsStore = useTagsStore()

    const items = [
      createItem({ id: '1', author: '李白', tags: ['唐诗三百首', '乐府'] }),
      createItem({ id: '2', author: '李白', tags: ['唐诗三百首'] }),
      createItem({ id: '3', author: '杜甫', tags: ['唐诗三百首', '五言律诗'] }),
    ]
    store.catalog = createCatalog(items)

    // 手动模拟 loadCatalog 中的标签统计注入
    const counts = new Map<string, number>()
    for (const item of items) {
      for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
    tagsStore.setGlobalCounts(counts)

    // 加了作者筛选，但 topTags 应该还是全局
    store.updateFilters({ author: '杜甫' })
    expect(store.filteredItems).toHaveLength(1)

    const tags = store.topTags
    expect(tags.find((t) => t.name === '唐诗三百首')?.count).toBe(3)
    expect(tags.find((t) => t.name === '乐府')?.count).toBe(1)
    expect(tags.find((t) => t.name === '五言律诗')?.count).toBe(1)
  })
})
