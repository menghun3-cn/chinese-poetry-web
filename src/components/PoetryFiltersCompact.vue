<template>
<div class="filter-root">
  <!-- 主筛选栏 -->
  <div class="filter-bar">
    <div class="filter-search-wrap">
      <svg class="filter-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input :value="store.filters.keyword" type="text" class="filter-search-input" placeholder="搜索诗词标题、作者、内容" @input="onSearch" />
    </div>
    <select :value="store.filters.collectionId" class="filter-select" @change="store.updateFilters({ collectionId: ($event.target as HTMLSelectElement).value })">
      <option value="all">全部文集</option>
      <option v-for="col in store.collections" :key="col.id" :value="col.id">{{ col.name }} ({{ col.count.toLocaleString() }})</option>
    </select>
    <div class="filter-author-wrap">
      <svg class="filter-author-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <input :value="store.filters.author" type="text" class="filter-author-input" placeholder="作者" @input="store.updateFilters({ author: ($event.target as HTMLInputElement).value })" />
    </div>
    <button class="filter-tag-btn" :class="{ 'filter-tag-btn-active': store.filters.tags.length > 0 }" @click="showTagPanel = !showTagPanel" title="标签筛选">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3.5"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
      <span v-if="store.filters.tags.length" class="filter-badge">{{ store.filters.tags.length }}</span>
    </button>
    <button v-if="hasActiveFilters" class="filter-reset-btn" @click="store.resetFilters" title="重置筛选">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
    </button>
  </div>
  <!-- 常驻快捷栏：常读作者 + 热门标签 -->
  <div v-if="store.frequentAuthors.length || store.hotTags.length" class="quick-bar">
    <div v-if="store.frequentAuthors.length" class="quick-section">
      <span class="quick-section-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>常读作者</span>
      <div class="quick-chips">
        <button v-for="author in store.frequentAuthors" :key="author.name"
          class="quick-chip" :class="{ 'quick-chip-active': store.filters.author === author.name }"
          @click="toggleAuthor(author.name)"
          @mouseenter="hoverRemoveAuthor = author.name"
          @mouseleave="hoverRemoveAuthor = ''">
          <span class="quick-chip-text">{{ author.name }}</span>
          <span v-if="hoverRemoveAuthor === author.name" class="quick-chip-remove" @click.stop="store.removeFrequentAuthor(author.name)" title="移除">&times;</span>
          <span v-else class="quick-chip-count">{{ author.count }}</span>
        </button>
      </div>
    </div>
    <div v-if="store.hotTags.length" class="quick-section">
      <span class="quick-section-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>热门标签</span>
      <div class="quick-chips">
        <button v-for="tag in store.hotTags" :key="tag"
          class="quick-chip quick-chip-tag" :class="{ 'quick-chip-active': store.filters.tags.includes(tag) }"
          @click="toggleTag(tag)"
          @mouseenter="hoverRemoveTag = tag"
          @mouseleave="hoverRemoveTag = ''">
          <span class="quick-chip-text">{{ tag }}</span>
          <span v-if="hoverRemoveTag === tag" class="quick-chip-remove" @click.stop="store.removeHotTag(tag)" title="移除">&times;</span>
        </button>
      </div>
    </div>
  </div>
  <div v-if="!store.frequentAuthors.length && !store.hotTags.length" class="quick-bar quick-bar-empty">
    <span class="quick-empty-hint">阅读诗词后，常读作者和热门标签将自动出现在这里</span>
  </div>
  <Transition name="fade">
    <div v-if="showTagPanel" class="tag-panel-overlay" @click.self="showTagPanel = false">
      <div class="tag-panel-card">
        <div class="tag-panel-header"><span class="tag-panel-title">选择标签</span><button class="tag-panel-close" @click="showTagPanel = false">完成</button></div>
        <div class="tag-panel-tags">
          <button v-for="tag in store.topTagsList" :key="tag"
            class="tag-pill" :class="store.filters.tags.includes(tag) ? 'tag-pill-active' : 'tag-pill-default'"
            @click="toggleTag(tag)">{{ tag }}</button>
        </div>
      </div>
    </div>
  </Transition>
</div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePoetryStore } from '@/stores/poetry'
const store = usePoetryStore()
const showTagPanel = ref(false)
const hoverRemoveAuthor = ref('')
const hoverRemoveTag = ref('')
const hasActiveFilters = computed(() => {
  return store.filters.keyword !== '' || store.filters.author !== '' || store.filters.tags.length > 0 || store.filters.collectionId !== 'all'
})
function onSearch(e: Event) { store.updateFilters({ keyword: (e.target as HTMLInputElement).value }) }
function toggleAuthor(name: string) { store.updateFilters({ author: store.filters.author === name ? '' : name }) }
function toggleTag(tag: string) {
  const next = store.filters.tags.includes(tag)
    ? store.filters.tags.filter(t => t !== tag)
    : [...store.filters.tags, tag]
  store.updateFilters({ tags: next })
}
</script>

<style scoped>
.filter-root { border-bottom:1px solid var(--color-border); background:var(--color-surface); }
.filter-bar { display:flex; align-items:center; gap:0.25rem; padding:0.375rem 0.75rem; flex-wrap:wrap; }
.filter-search-wrap { position:relative; flex:1; min-width:10rem; }
.filter-search-icon { position:absolute; left:0.5rem; top:50%; transform:translateY(-50%); width:0.875rem; height:0.875rem; color:var(--color-text-muted); pointer-events:none; }
.filter-search-input { width:100%; padding:0.375rem 0.5rem 0.375rem 1.75rem; font-size:0.75rem; border-radius:0.5rem; border:1px solid var(--color-border); background:var(--color-page); color:var(--color-text); outline:none; }
.filter-search-input:focus { border-color:var(--color-accent); }
.filter-select { padding:0.375rem 0.5rem; font-size:0.75rem; border-radius:0.5rem; border:1px solid var(--color-border); background:var(--color-page); color:var(--color-text); outline:none; cursor:pointer; max-width:10rem; }
.filter-author-wrap { position:relative; }
.filter-author-icon { position:absolute; left:0.5rem; top:50%; transform:translateY(-50%); width:0.875rem; height:0.875rem; color:var(--color-text-muted); pointer-events:none; }
.filter-author-input { width:6rem; padding:0.375rem 0.5rem 0.375rem 1.75rem; font-size:0.75rem; border-radius:0.5rem; border:1px solid var(--color-border); background:var(--color-page); color:var(--color-text); outline:none; }
.filter-tag-btn, .filter-reset-btn { display:flex; align-items:center; justify-content:center; width:1.75rem; height:1.75rem; border-radius:0.5rem; color:var(--color-text-muted); transition:all 0.15s ease; border:1px solid transparent; background:transparent; cursor:pointer; }
.filter-tag-btn:hover, .filter-reset-btn:hover { background:var(--color-surface-muted); color:var(--color-text); }
.filter-tag-btn-active { color:var(--color-primary); border-color:var(--color-primary); }
.filter-badge { margin-left:0.125rem; font-size:0.625rem; font-weight:700; color:var(--color-primary); }
.quick-bar { border-top:1px solid var(--color-border); padding:0.25rem 0.75rem 0.375rem; display:flex; flex-direction:column; gap:0.25rem; }
.quick-bar-empty { padding:0.375rem 0.75rem; }
.quick-empty-hint { font-size:0.6875rem; color:var(--color-text-muted); text-align:center; display:block; }
.quick-section { display:flex; align-items:flex-start; gap:0.375rem; }
.quick-section-label { display:flex; align-items:center; gap:0.25rem; font-size:0.625rem; font-weight:500; color:var(--color-text-muted); white-space:nowrap; padding-top:0.1875rem; min-width:4.5rem; }
.quick-chips { display:flex; flex-wrap:wrap; gap:0.25rem; flex:1; }
.quick-chip { display:inline-flex; align-items:center; gap:0.25rem; padding:0.125rem 0.5rem; font-size:0.6875rem; font-weight:500; border-radius:9999px; border:1px solid var(--color-border); background:var(--color-surface); color:var(--color-text-secondary); transition:all 0.15s ease; cursor:pointer; white-space:nowrap; position:relative; }
.quick-chip:hover { border-color:var(--color-accent); color:var(--color-accent); }
.quick-chip-active { border-color:var(--color-accent); background:var(--color-accent-soft); color:var(--color-accent); font-weight:600; }
.quick-chip-tag:hover { border-color:var(--color-primary); color:var(--color-primary-hover); }
.quick-chip-tag.quick-chip-active { border-color:var(--color-primary); background:var(--color-primary-soft); color:var(--color-primary-hover); }
.quick-chip-text { line-height:1.4; }
.quick-chip-remove { display:inline-flex; align-items:center; justify-content:center; width:1rem; height:1rem; border-radius:50%; font-size:0.75rem; font-weight:700; color:#ef4444; background:var(--color-surface-muted); transition:all 0.1s ease; line-height:1; cursor:pointer; }
.quick-chip-remove:hover { background:#ef4444; color:white; }
.quick-chip-count { font-size:0.625rem; color:var(--color-text-muted); background:var(--color-border); padding:0 0.25rem; border-radius:9999px; }
.tag-panel-overlay { position:fixed; inset:0; z-index:50; display:flex; align-items:flex-start; justify-content:center; padding-top:4rem; background:rgba(0,0,0,0.15); }
.tag-panel-card { width:100%; max-width:28rem; border-radius:0.75rem; border:1px solid var(--color-border); background:var(--color-surface); padding:1rem; box-shadow:0 20px 60px rgba(0,0,0,0.15); }
.tag-panel-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem; }
.tag-panel-title { font-size:0.8125rem; font-weight:600; color:var(--color-text-secondary); }
.tag-panel-close { font-size:0.75rem; color:var(--color-primary-hover); background:none; border:none; cursor:pointer; }
.tag-panel-close:hover { text-decoration:underline; }
.tag-panel-tags { display:flex; flex-wrap:wrap; gap:0.375rem; max-height:16rem; overflow-y:auto; }
.tag-pill { display:inline-flex; align-items:center; gap:0.25rem; padding:0.25rem 0.625rem; font-size:0.6875rem; border-radius:0.375rem; border:1px solid var(--color-border); cursor:pointer; transition:all 0.15s ease; }
.tag-pill-default { color:var(--color-text-secondary); background:transparent; }
.tag-pill-default:hover { background:var(--color-surface-muted); }
.tag-pill-active { border-color:var(--color-primary); background:var(--color-primary-soft); color:var(--color-primary-hover); font-weight:600; }
.fade-enter-active, .fade-leave-active { transition:opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity:0; }
</style>