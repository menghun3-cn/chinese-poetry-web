import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { usePoetryStore } from '@/stores/poetry'
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

  it('按当前作者筛选同步热门标签计数', () => {
    const store = usePoetryStore()
    store.catalog = createCatalog([
      createItem({ id: 'song-1', author: '张先', tags: ['宋词三百首'] }),
      createItem({ id: 'song-2', author: '张先', tags: ['宋词三百首', '西湖'] }),
      createItem({ id: 'tang-1', author: '李白', dynasty: '唐', tags: ['隋・唐・五代'] }),
    ])

    store.updateFilters({ author: '张先' })

    expect(store.filteredItems).toHaveLength(2)
    expect(store.topTags).toEqual([
      { name: '宋词三百首', count: 2 },
      { name: '西湖', count: 1 },
    ])
  })

  it('已选标签与当前作者不兼容时保留标签并显示 0', () => {
    const store = usePoetryStore()
    store.catalog = createCatalog([
      createItem({ id: 'song-1', author: '张先', tags: ['宋词三百首'] }),
      createItem({ id: 'tang-1', author: '李白', dynasty: '唐', tags: ['隋・唐・五代'] }),
    ])

    store.updateFilters({ tag: '隋・唐・五代' })
    store.updateFilters({ author: '张先' })

    expect(store.filteredItems).toHaveLength(0)
    expect(store.topTags[0]).toEqual({ name: '隋・唐・五代', count: 0 })
  })
})
