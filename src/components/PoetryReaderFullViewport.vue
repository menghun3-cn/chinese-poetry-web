<template>
  <div class="reader-wrapper">
    <div class="reader-bg" />
    <div class="reader-container">
      <Transition name="poem-fade" mode="out-in">
        <div v-if="item" :key="item.id" ref="poemCardRef" class="reader-card">
          <div class="reader-header">
            <h2 class="reader-title">{{ item.title }}</h2>
            <p class="reader-meta">{{ item.dynasty }} ? {{ item.author }}</p>
          </div>
          <div ref="poemBodyRef" class="reader-body">
            <p v-for="(line, index) in item.paragraphs" :key="'l' + index" class="reader-line" :class="index === 0 ? 'reader-line-first' : ''">{{ line }}</p>
          </div>
          <div class="reader-tags">
            <span v-for="tag in item.tags" :key="tag" class="reader-tag reader-tag-default">{{ tag }}</span>
            <span v-if="item.rhythmic" class="reader-tag reader-tag-primary">{{ item.rhythmic }}</span>
          </div>
        </div>
      </Transition>
    </div>
    <Transition name="fade">
      <div v-if="loadingDetail" class="reader-loading">
        <svg class="reader-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
        ???...
      </div>
    </Transition>
    <div v-if="!item" class="reader-empty">
      <div class="reader-empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="size-12"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
      </div>
      <p class="reader-empty-text">????????????</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import { usePoetryStore } from "@/stores/poetry"

const store = usePoetryStore()
const loadingDetail = ref(false)
const poemCardRef = ref<HTMLElement | null>(null)
const poemBodyRef = ref<HTMLElement | null>(null)

const item = computed(() => store.selectedItem)

function fitPoemToContainer() {
  const card = poemCardRef.value
  const body = poemBodyRef.value
  if (!card || !body || !item.value?.paragraphs?.length) return

  const container = card.closest(".reader-container") as HTMLElement | null
  if (!container) return
  const availHeight = container.clientHeight - 48
  if (availHeight <= 80) return

  const headerEl = card.querySelector(".reader-header") as HTMLElement | null
  const tagsEl = card.querySelector(".reader-tags") as HTMLElement | null
  const headerH = headerEl?.offsetHeight ?? 0
  const tagsH = tagsEl?.offsetHeight ?? 0
  const numLines = item.value.paragraphs.length
  const fixedH = headerH + tagsH + 24 + numLines * 4
  const bodyAvail = availHeight - fixedH
  if (bodyAvail <= 40) return

  let lo = 12, hi = 24, best = 16
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2)
    body.style.fontSize = mid + "px"
    body.style.lineHeight = Math.round(mid * 1.8) + "px"
    void body.offsetHeight
    const h = body.scrollHeight
    if (h <= bodyAvail) { best = mid; lo = mid + 1 }
    else { hi = mid - 1 }
  }
  body.style.fontSize = best + "px"
  body.style.lineHeight = Math.round(best * 1.8) + "px"
}

let ro: ResizeObserver | null = null
onMounted(() => {
  const container = document.querySelector(".reader-container") as HTMLElement
  if (container && typeof ResizeObserver !== "undefined") {
    ro = new ResizeObserver(() => fitPoemToContainer())
    ro.observe(container)
  }
})
onUnmounted(() => { if (ro) { ro.disconnect(); ro = null } })

watch(() => item.value?.paragraphs, () => nextTick(() => fitPoemToContainer()), { deep: true })
watch(loadingDetail, (v) => { if (!v) nextTick(() => fitPoemToContainer()) })

watch(() => store.selectedId, async (newId) => {
  if (!newId) return
  loadingDetail.value = true
  await store.ensureDetail(newId)
  loadingDetail.value = false
}, { immediate: true })
</script>

<style scoped>
.reader-wrapper { position:relative; display:flex; flex:1; flex-direction:column; overflow:hidden; background:linear-gradient(135deg,#f8f6f0 0%,#f0ebe1 50%,#e8e0d0 100%); }
.reader-bg { position:absolute; inset:0; opacity:0.03; background-image:radial-gradient(circle at 10% 20%,rgba(139,90,43,0.3) 0%,transparent 50%),radial-gradient(circle at 90% 80%,rgba(139,90,43,0.2) 0%,transparent 50%),radial-gradient(circle at 50% 50%,rgba(139,90,43,0.05) 0%,transparent 70%); pointer-events:none; }
.reader-container { position:relative; display:flex; flex:1; flex-direction:column; align-items:center; justify-content:center; overflow:hidden; padding:1.5rem 1rem; min-height:0; }
@media (min-width:640px){ .reader-container{ padding:1.5rem 2rem; } }
.reader-card { position:relative; display:flex; width:100%; max-width:42rem; flex-direction:column; overflow:hidden; border-radius:1rem; border:1px solid rgba(255,255,255,0.6); background:rgba(255,255,255,0.7); padding:1.25rem 1.5rem; box-shadow:0 4px 24px rgba(0,0,0,0.05); backdrop-filter:blur(8px); max-height:100%; }
@media (min-width:640px){ .reader-card{ padding:1.5rem 2.5rem; } }
.reader-header { margin-bottom:0.75rem; flex-shrink:0; text-align:center; }
.reader-title { font-size:1rem; font-weight:600; line-height:1.3; color:var(--color-text); letter-spacing:0.05em; }
.reader-meta { margin-top:0.125rem; font-size:0.6875rem; color:var(--color-text-muted); }
.reader-body { display:flex; flex-direction:column; align-items:center; overflow:hidden; font-size:16px; line-height:1.8; min-height:0; }
.reader-line { text-align:center; color:var(--color-text); letter-spacing:0.08em; white-space:pre-wrap; word-break:break-all; }
.reader-line-first { font-weight:500; }
.reader-tags { margin-top:0.5rem; display:flex; flex-shrink:0; flex-wrap:wrap; justify-content:center; gap:0.375rem; }
.reader-tag { display:inline-flex; align-items:center; border-radius:9999px; padding:0.125rem 0.625rem; font-size:0.625rem; font-weight:500; }
.reader-tag-default { background:var(--color-accent-soft); color:var(--color-accent); }
.reader-tag-primary { background:var(--color-primary-soft); color:var(--color-primary-hover); }
.reader-loading { position:absolute; bottom:0.75rem; left:50%; z-index:10; transform:translateX(-50%); display:flex; align-items:center; gap:6px; border-radius:9999px; background:rgba(255,255,255,0.8); padding:0.25rem 0.75rem; font-size:0.6875rem; color:var(--color-text-muted); box-shadow:0 1px 4px rgba(0,0,0,0.08); backdrop-filter:blur(4px); }
.reader-spinner { width:0.875rem; height:0.875rem; animation:spin 1s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.reader-empty { display:flex; flex:1; flex-direction:column; align-items:center; justify-content:center; }
.reader-empty-icon { margin-bottom:0.75rem; color:var(--color-text-muted); opacity:0.4; }
.reader-empty-text { font-size:0.875rem; color:var(--color-text-muted); }
.poem-fade-enter-active,.poem-fade-leave-active { transition:opacity 0.25s ease, transform 0.25s ease; }
.poem-fade-enter-from { opacity:0; transform:translateY(8px); }
.poem-fade-leave-to { opacity:0; transform:translateY(-8px); }
.fade-enter-active,.fade-leave-active { transition:opacity 0.2s ease; }
.fade-enter-from,.fade-leave-to { opacity:0; }
</style>