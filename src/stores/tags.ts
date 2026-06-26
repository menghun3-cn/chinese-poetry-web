import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { CategorizedTag, TagCategory, TagCategoryMeta } from '@/types/tags'
import { TAG_CATEGORIES } from '@/types/tags'

/* ──────────── 标签 → 分类 硬编码映射 ──────────── */
const TAG_TO_CATEGORY: Record<string, TagCategory> = {
  // 题材
  山水: 'subject',
  边塞: 'subject',
  咏物: 'subject',
  怀古: 'subject',
  咏史: 'subject',
  咏史怀古: 'subject',
  田园: 'subject',
  宫怨: 'subject',
  闺怨: 'subject',
  戍边: 'subject',
  游仙: 'subject',
  游侠: 'subject',
  游历: 'subject',
  纪游: 'subject',
  宫廷: 'subject',
  宴饮: 'subject',
  宴会: 'subject',
  狩猎: 'subject',
  早朝: 'subject',
  凭吊古迹: 'subject',
  吊古伤今: 'subject',
  民歌: 'subject',
  寓言: 'subject',
  神话: 'subject',
  传说: 'subject',
  题咏: 'subject',
  题画: 'subject',
  即景抒情: 'subject',
  触景感怀: 'subject',
  访友: 'subject',
  待客: 'subject',
  邀请: 'subject',
  寻访: 'subject',
  登楼: 'subject',
  登高: 'subject',
  渡江: 'subject',
  踏青: 'subject',
  隐逸: 'subject',
  羁旅: 'subject',
  旅途: 'subject',
  拟古: 'subject',
  古体: 'subject',
  组诗: 'subject',
  和诗: 'subject',
  唱和: 'subject',
  酬和: 'subject',
  酬答: 'subject',
  酬赠: 'subject',
  赠别: 'subject',
  送别: 'subject',
  惜别: 'subject',
  离别: 'subject',
  悼亡: 'subject',
  新婚: 'subject',
  应制: 'subject',

  // 情感
  抒情: 'emotion',
  抒怀: 'emotion',
  抒志: 'emotion',
  怀人: 'emotion',
  思念: 'emotion',
  思乡: 'emotion',
  思亲: 'emotion',
  思归: 'emotion',
  爱情: 'emotion',
  友情: 'emotion',
  母爱: 'emotion',
  爱国: 'emotion',
  忧国忧民: 'emotion',
  伤怀: 'emotion',
  感伤: 'emotion',
  感叹: 'emotion',
  感慨: 'emotion',
  感时: 'emotion',
  怅惘: 'emotion',
  愁思: 'emotion',
  苦闷: 'emotion',
  失意: 'emotion',
  悲愤: 'emotion',
  哀怨: 'emotion',
  怨情: 'emotion',
  厌恶: 'emotion',
  孤独: 'emotion',
  忧思: 'emotion',
  喜悦: 'emotion',
  愉悦: 'emotion',
  热爱: 'emotion',
  向往: 'emotion',
  依恋: 'emotion',
  坚贞: 'emotion',
  励志: 'emotion',
  抱负: 'emotion',
  慰勉: 'emotion',
  规劝: 'emotion',
  赞美: 'emotion',
  赞颂: 'emotion',
  赞扬: 'emotion',
  敬爱: 'emotion',
  同情: 'emotion',
  讽刺: 'emotion',
  讽喻: 'emotion',
  托古讽今: 'emotion',
  豪迈: 'emotion',
  豪放: 'emotion',
  豪侠: 'emotion',
  闲适: 'emotion',
  叹息: 'emotion',
  伤老: 'emotion',
  岁月: 'emotion',
  惜时: 'emotion',
  惜春: 'emotion',
  哲理: 'emotion',
  启示: 'emotion',
  人生: 'emotion',
  人格: 'emotion',
  态度: 'emotion',
  年老: 'emotion',

  // 季节
  春: 'season',
  春天: 'season',
  夏天: 'season',
  秋: 'season',
  秋天: 'season',
  冬: 'season',
  冬天: 'season',
  中秋: 'season',
  清明: 'season',
  寒食节: 'season',
  端午节: 'season',
  重阳节: 'season',
  春节: 'season',

  // 景物 / 地点
  写景: 'scene',
  写山: 'scene',
  写水: 'scene',
  写花: 'scene',
  写草: 'scene',
  写雨: 'scene',
  写雪: 'scene',
  写风: 'scene',
  写马: 'scene',
  写鸟: 'scene',
  写塔: 'scene',
  山: 'scene',
  水: 'scene',
  月亮: 'scene',
  月夜: 'scene',
  雨: 'scene',
  雪: 'scene',
  风: 'scene',
  风雨: 'scene',
  花: 'scene',
  柳树: 'scene',
  梅花: 'scene',
  植物: 'scene',
  地名: 'scene',
  带有地名: 'scene',
  景点: 'scene',
  泰山: 'scene',
  华山: 'scene',
  衡山: 'scene',
  黄山: 'scene',
  庐山: 'scene',
  九华山: 'scene',
  峨眉山: 'scene',
  终南山: 'scene',
  长江: 'scene',
  黄河: 'scene',
  太湖: 'scene',
  洞庭湖: 'scene',
  西湖: 'scene',
  钱塘江: 'scene',
  岳阳楼: 'scene',
  黄鹤楼: 'scene',
  寺庙: 'scene',
  描写山: 'scene',
  描写水: 'scene',

  // 人物 / 角色
  写人: 'people',
  写人诗: 'people',
  女子: 'people',
  妇女: 'people',
  将士: 'people',
  将军: 'people',
  友人: 'people',
  知己: 'people',
  隐士: 'people',
  少年: 'people',

  // 技法 / 风格
  叙事: 'technique',
  议论: 'technique',
  寓人: 'technique',
  托物寄情: 'technique',
  景中情: 'technique',
  记梦: 'technique',
  援引: 'technique',
  典故: 'technique',

  // 格律 / 体裁
  五言古诗: 'form',
  五言律诗: 'form',
  五言绝句: 'form',
  七言古诗: 'form',
  七言律诗: 'form',
  七言绝句: 'form',
  乐府: 'form',
  长诗: 'form',
  鼓吹曲辞: 'form',
  横吹曲辞: 'form',
  相和歌辞: 'form',
  清商曲辞: 'form',
  新乐府辞: 'form',
  近代曲辞: 'form',
  杂曲歌辞: 'form',
  婉约: 'form',
  婉约词: 'form',

  // 教材
  初中古诗: 'textbook',
  高中古诗: 'textbook',
  小学古诗: 'textbook',
  一年级上册: 'textbook',
  一年级下册: 'textbook',
  二年级上册: 'textbook',
  二年级下册: 'textbook',
  三年级上册: 'textbook',
  三年级下册: 'textbook',
  六年级下册: 'textbook',
  '七年级上册(课内)': 'textbook',
  '七年级下册(课外)': 'textbook',
  '八年级上册(课内)': 'textbook',
  '八年级上册(课外)': 'textbook',
  '八年级下册(课内)': 'textbook',
  '八年级下册(课外)': 'textbook',
  '九年级上册(课外)': 'textbook',

  // 合集
  唐诗三百首: 'anthology',
  宋词三百首: 'anthology',
  先秦两汉诗: 'anthology',
  '隋・唐・五代': 'anthology',
  '卷一·唐五代词': 'anthology',
}

/* ──────────── 最近使用的 localStorage key ──────────── */
const LS_RECENT_KEY = 'poetry:recentTags'
const MAX_RECENT = 5

function readRecent(): string[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(LS_RECENT_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : []
  } catch {
    return []
  }
}

function saveRecent(tags: string[]) {
  localStorage.setItem(LS_RECENT_KEY, JSON.stringify(tags.slice(0, MAX_RECENT)))
}

/* ──────────── Store ──────────── */
export const useTagsStore = defineStore('tags', () => {
  // ── 状态 ──
  const recentTags = ref<string[]>(readRecent())
  // 用于搜索的缓存：所有 items 的标签频次统计（由 poetry store 在 loadCatalog 时触发填充）
  const globalTagCounts = ref<Map<string, number>>(new Map())

  // ── 计算属性 ──
  /** 所有标签按分类分组 */
  const tagsByCategory = computed(() => {
    const map = new Map<TagCategory, CategorizedTag[]>()
    for (const cat of TAG_CATEGORIES) map.set(cat.id, [])

    for (const [name, count] of globalTagCounts.value) {
      const category = TAG_TO_CATEGORY[name] ?? 'other'
      const list = map.get(category)
      if (list) {
        list.push({ name, count, category })
      } else {
        map.get('other')?.push({ name, count, category: 'other' })
      }
    }

    // 每个分类内按 count 降序
    for (const [, list] of map) {
      list.sort((a, b) => b.count - a.count)
    }
    return map
  })

  /** 所有分类中非空的列表 */
  const nonEmptyCategories = computed<TagCategoryMeta[]>(() =>
    TAG_CATEGORIES.filter((cat) => (tagsByCategory.value.get(cat.id)?.length ?? 0) > 0),
  )

  // ── 方法 ──
  function setGlobalCounts(counts: Map<string, number>) {
    globalTagCounts.value = counts
  }

  function pushRecent(tag: string) {
    const next = [tag, ...recentTags.value.filter((t) => t !== tag)].slice(0, MAX_RECENT)
    recentTags.value = next
    saveRecent(next)
  }

  function getCategory(tag: string): TagCategory {
    return TAG_TO_CATEGORY[tag] ?? 'other'
  }

  return {
    recentTags,
    globalTagCounts,
    tagsByCategory,
    nonEmptyCategories,
    setGlobalCounts,
    pushRecent,
    getCategory,
  }
})
