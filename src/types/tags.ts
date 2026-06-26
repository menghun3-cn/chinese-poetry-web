/** 标签分类：题材、情感、季节、景物、人物、技法、格律、教材、合集 */
export type TagCategory =
  | 'subject'
  | 'emotion'
  | 'season'
  | 'scene'
  | 'people'
  | 'technique'
  | 'form'
  | 'textbook'
  | 'anthology'
  | 'other'

/** 标签分类的显示元数据 */
export interface TagCategoryMeta {
  id: TagCategory
  label: string
  order: number
}

/** 带有分类信息的标签 */
export interface CategorizedTag {
  name: string
  count: number
  category: TagCategory
}

/** 所有分类的元数据，按 order 排序 */
export const TAG_CATEGORIES: TagCategoryMeta[] = [
  { id: 'subject',    label: '题材',   order: 1 },
  { id: 'emotion',    label: '情感',   order: 2 },
  { id: 'season',     label: '季节',   order: 3 },
  { id: 'scene',      label: '景物',   order: 4 },
  { id: 'people',     label: '人物',   order: 5 },
  { id: 'technique',  label: '技法',   order: 6 },
  { id: 'form',       label: '格律体裁', order: 7 },
  { id: 'textbook',   label: '教材',   order: 8 },
  { id: 'anthology',  label: '合集',   order: 9 },
  { id: 'other',      label: '其他',   order: 10 },
]
