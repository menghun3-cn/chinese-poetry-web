export interface PoetryItem {
  id: string
  title: string
  author: string
  dynasty: string
  collection: string
  collectionId: string
  rhythmic?: string
  tags: string[]
  paragraphs: string[]
  excerpt: string
  length: number
  sourcePath: string
}

export interface PoetryCollection {
  id: string
  name: string
  dynasty: string
  description: string
  count: number
  sources: string[]
}

export interface PoetryCatalog {
  generatedAt: string
  sourceRepository: string
  total: number
  collections: PoetryCollection[]
  items: PoetryItem[]
}

export interface PoetryFilters {
  keyword: string
  collectionId: string
  tag: string
  author: string
}
