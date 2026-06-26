<template>
  <div class="filter-root">
    <!-- ???? -->
    <div class="filter-bar">
      <!-- ??? -->
      <div class="filter-search-wrap">
        <svg class="filter-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input :value="store.filters.keyword" type="text" class="filter-search-input" placeholder="?????????????" @input="onSearch" />
      </div>

      <!-- ???? -->
      <select :value="store.filters.collectionId" class="filter-select" @change="store.updateFilters({ collectionId: ($event.target as HTMLSelectElement).value })">
        <option value="all">????</option>
        <option v-for="col in store.collections" :key="col.id" :value="col.id">{{ col.name }} ({{ col.count.toLocaleString() }})</option>
      </select>

      <!-- ???? -->
      <div class="filter-author-wrap">
        <svg class="filter-author-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <input :value="store.filters.author" type="text" class="filter-author-input" placeholder="??" @input="store.updateFilters({ author: ($event.target as HTMLInputElement).value })" />
      </div>

      <!-- ???? -->
      <button class="filter-tag-btn" :class="{ 'filter-tag-btn-active': store.filters.tags.length > 0 }" @click="showTagPanel = !showTagPanel" title="????">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3.5"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
        <span v-if="store.filters.tags.length" class="filter-badge">{{ store.filters.tags.length }}</span>
      </button>

      <!-- ?????? -->
      <button class="filter-history-toggle" :class="{ 'filter-history-toggle-active': showHistory }" @click="showHistory = !showHistory" title="???? / ????">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </button>

      <!-- ?? -->
      <button v-if="hasActiveFilters" class="filter-reset-btn" @click="store.resetFilters" title="????">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
      </button>
    </div>

    <!-- ???? & ???? ??????? -->
    <Transition name="history-slide">
      <div v-if="showHistory && hasReadingHistory" class="history-panel">
        <!-- Tab ?? -->
        <div class="history-tabs">
          <button v-if="store.frequentAuthors.length" class="history-tab" :class="{ 'history-tab-active': activeTab === 'authors' }" @click="activeTab = 'authors'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            ????
            <span class="history-count">{{ store.frequentAuthors.length }}</span>
          </button>
          <button v-if="store.hotTags.length" class="history-tab" :class="{ 'history-tab-active': activeTab === 'tags' }" @click="activeTab = 'tags'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
            ????
            <span class="history-count">{{ store.hotTags.length }}</span>
          </button>
          <button class="history-tab history-tab-clear" @click="clearHistory" title="??????">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>

        <!-- ??? -->
        <div class="history-content">
          <Transition name="fade" mode="out-in">
            <!-- ???? -->
            <div v-if="activeTab === 'authors'" key="authors" class="history-tag-list">
              <button v-for="author in store.frequentAuthors" :key="author.name"
                class="history-chip" :class="{ 'history-chip-active': store.filters.author === author.name }"
                @click="toggleAuthor(author.name)">
                {{ author.name }}
                <span class="history-chip-count">{{ author.count }}</span>
              </button>
              <span v-if="!store.frequentAuthors.length" class="history-empty">??????</span>
            </div>

            <!-- ???? -->
            <div v-else key="tags" class="history-tag-list">
              <button v-for="tag in store.hotTags" :key="tag"
                class="history-chip history-chip-tag" :class="{ 'history-chip-active': store.filters.tags.includes(tag) }"
                @click="toggleTag(tag)">
                {{ tag }}
              </button>
              <span v-if="!store.hotTags.length" class="history-empty">??????</span>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>

    <!-- ?????????? -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showTagPanel" class="tag-panel-overlay" @click.self="showTagPanel = false">
          <div class="tag-panel-card">
            <div class="tag-panel-header">
              <span class="tag-panel-title">????</span>
              <button class="tag-panel-close" @click="showTagPanel = false">??</button>
            </div>
            <div class="tag-panel-tags">
              <button v-for="tag in store.topTagsList" :key="tag"
                class="tag-pill"
                :class="store.filters.tags.includes(tag) ? 'tag-pill-active' : 'tag-pill-default'"
                :aria-pressed="store.filters.tags.includes(tag)"
                @click="toggleTag(tag)">
                {{ tag }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { usePoetryStore } from "@/stores/poetry"

const store = usePoetryStore()
const showTagPanel = ref(false)
const showHistory = ref(false)
const activeTab = ref<"authors" | "tags">("authors")

const hasActiveFilters = computed(() => Boolean(store.filters.keyword) || Boolean(store.filters.author) || store.filters.tags.length > 0 || store.filters.collectionId !== "all")
const hasReadingHistory = computed(() => store.frequentAuthors.length > 0 || store.hotTags.length > 0)

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearch(e: Event) {
  const val = (e.target as HTMLInputElement).value
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => store.updateFilters({ keyword: val }), 200)
}

function toggleTag(tag: string) {
  const current = store.filters.tags
  store.updateFilters({ tags: current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag] })
}

function toggleAuthor(name: string) {
  store.updateFilters({ author: store.filters.author === name ? "" : name })
}

function clearHistory() {
  if (typeof localStorage === "undefined") return
  localStorage.removeItem("poetry:authorFreq")
  localStorage.removeItem("poetry:hotTags")
  window.location.reload()
}
</script>

<style scoped>
.filter-root { flex-shrink:0; }

/* ???? */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-page);
  padding: 0.5rem 0.75rem;
}

.filter-search-wrap { position:relative; min-width:0; flex:1; max-width:20rem; }
.filter-search-icon { position:absolute; left:0.625rem; top:50%; transform:translateY(-50%); width:0.875rem; height:0.875rem; color:var(--color-text-muted); }
.filter-search-input {
  width:100%; border-radius:0.5rem; border:1px solid var(--color-border); background:var(--color-surface);
  padding:0.375rem 0.75rem 0.375rem 2rem; font-size:0.75rem; color:var(--color-text);
  placeholder-color:var(--color-text-muted);
}
.filter-search-input:focus { border-color:var(--color-primary); outline:none; }

.filter-select {
  border-radius:0.5rem; border:1px solid var(--color-border); background:var(--color-surface);
  padding:0.375rem 0.625rem; font-size:0.75rem; color:var(--color-text);
}
.filter-select:focus { border-color:var(--color-primary); outline:none; }

.filter-author-wrap { position:relative; width:7rem; }
.filter-author-icon { position:absolute; left:0.5rem; top:50%; transform:translateY(-50%); width:0.75rem; height:0.75rem; color:var(--color-text-muted); }
.filter-author-input {
  width:100%; border-radius:0.5rem; border:1px solid var(--color-border); background:var(--color-surface);
  padding:0.375rem 0.5rem 0.375rem 1.75rem; font-size:0.75rem; color:var(--color-text);
}
.filter-author-input:focus { border-color:var(--color-primary); outline:none; }

.filter-tag-btn, .filter-history-toggle, .filter-reset-btn {
  display:flex; align-items:center; justify-content:center;
  width:1.75rem; height:1.75rem; border-radius:0.5rem;
  color:var(--color-text-muted); transition:all 0.15s ease;
  border:1px solid transparent; background:transparent;
}
.filter-tag-btn:hover, .filter-history-toggle:hover, .filter-reset-btn:hover { background:var(--color-surface-muted); color:var(--color-text); }
.filter-tag-btn-active { color:var(--color-primary); border-color:var(--color-primary); }
.filter-history-toggle-active { color:var(--color-accent); border-color:var(--color-accent); }
.filter-badge { margin-left:0.125rem; font-size:0.625rem; font-weight:700; color:var(--color-primary); }

/* ???? */
.history-panel {
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface-muted);
  overflow: hidden;
}

.history-tabs {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem 0;
  border-bottom: 1px solid var(--color-border);
}

.history-tab {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--color-text-muted);
  border-radius: 0.375rem 0.375rem 0 0;
  border: 1px solid transparent;
  border-bottom: none;
  transition: all 0.15s ease;
  cursor: pointer;
  background: transparent;
}
.history-tab:hover { color: var(--color-text); background: var(--color-surface); }
.history-tab-active { color: var(--color-text); background: var(--color-page); border-color: var(--color-border); }
.history-tab-clear { margin-left:auto; color:var(--color-text-muted); border-color:transparent; }
.history-tab-clear:hover { color:var(--color-danger, #e53e3e); }
.history-count { margin-left:0.25rem; font-size:0.625rem; color:var(--color-text-muted); background:var(--color-border); padding:0 0.375rem; border-radius:9999px; }

.history-content { padding: 0.5rem 0.75rem; }

.history-tag-list { display: flex; flex-wrap: wrap; gap: 0.375rem; max-height:8rem; overflow-y:auto; }

.history-chip {
  display: inline-flex; align-items: center; gap:0.25rem;
  padding: 0.1875rem 0.5rem; font-size: 0.6875rem; font-weight: 500;
  border-radius: 9999px; border: 1px solid var(--color-border);
  background: var(--color-surface); color: var(--color-text-secondary);
  transition: all 0.15s ease; cursor: pointer;
}
.history-chip:hover { border-color: var(--color-accent); color: var(--color-accent); }
.history-chip-active { border-color: var(--color-accent); background: var(--color-accent-soft); color: var(--color-accent); font-weight:600; }
.history-chip-tag:hover { border-color: var(--color-primary); color: var(--color-primary-hover); }
.history-chip-tag.history-chip-active { border-color: var(--color-primary); background: var(--color-primary-soft); color: var(--color-primary-hover); }
.history-chip-count { font-size:0.625rem; color:var(--color-text-muted); background:var(--color-border); padding:0 0.25rem; border-radius:9999px; }
.history-empty { font-size:0.75rem; color:var(--color-text-muted); padding:0.5rem 0; }

/* ???????? */
.tag-panel-overlay { position:fixed; inset:0; z-index:50; display:flex; align-items:flex-start; justify-content:center; padding-top:4rem; background:rgba(0,0,0,0.15); }
.tag-panel-card { width:100%; max-width:28rem; border-radius:0.75rem; border:1px solid var(--color-border); background:var(--color-surface); padding:1rem; box-shadow:0 20px 60px rgba(0,0,0,0.15); }
.tag-panel-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem; }
.tag-panel-title { font-size:0.8125rem; font-weight:600; color:var(--color-text-secondary); }
.tag-panel-close { font-size:0.75rem; color:var(--color-primary-hover); background:none; border:none; cursor:pointer; }
.tag-panel-close:hover { text-decoration:underline; }
.tag-panel-tags { display:flex; flex-wrap:wrap; gap:0.375rem; max-height:16rem; overflow-y:auto; }
.tag-pill {
  display:inline-flex; align-items:center; gap:0.25rem; padding:0.25rem 0.625rem; font-size:0.6875rem;
  border-radius:0.375rem; border:1px solid var(--color-border); cursor:pointer; transition:all 0.15s ease;
}
.tag-pill-default { color:var(--color-text-secondary); background:transparent; }
.tag-pill-default:hover { background:var(--color-surface-muted); }
.tag-pill-active { border-color:var(--color-primary); background:var(--color-primary-soft); color:var(--color-primary-hover); font-weight:600; }

/* ?? */
.history-slide-enter-active, .history-slide-leave-active { transition: all 0.25s ease; }
.history-slide-enter-from, .history-slide-leave-to { max-height:0; opacity:0; padding-top:0; padding-bottom:0; }
.history-slide-enter-to, .history-slide-leave-from { max-height:20rem; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
