<template>
  <section
    class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]"
  >
    <div class="mb-3 flex items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold">文集规模</h2>
        <p class="mt-1 text-sm text-[var(--color-text-muted)]">展示本次构建索引中各文集采样数量。</p>
      </div>
      <BarChart3 class="size-5 text-[var(--color-text-muted)]" aria-hidden="true" />
    </div>
    <div ref="chartRef" class="h-[320px] w-full" role="img" aria-label="各文集作品数量柱状图"></div>
  </section>
</template>

<script setup lang="ts">
import { BarChart3 } from 'lucide-vue-next'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart, type BarSeriesOption } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  type GridComponentOption,
  type TooltipComponentOption,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ComposeOption, EChartsType } from 'echarts/core'

import { usePoetryStore } from '@/stores/poetry'

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

type ChartOption = ComposeOption<GridComponentOption | TooltipComponentOption | BarSeriesOption>

const store = usePoetryStore()
const chartRef = ref<HTMLElement | null>(null)
let chart: EChartsType | null = null

onMounted(() => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
  renderChart()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})

watch(
  () => store.collections.map((item) => item.count).join(','),
  () => renderChart(),
)

function renderChart() {
  if (!chart) return
  const option: ChartOption = {
    color: ['#2f6f5e'],
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 18, top: 24, bottom: 48 },
    xAxis: {
      type: 'category',
      data: store.collections.map((item) => item.name),
      axisLabel: { interval: 0, rotate: 28 },
    },
    yAxis: { type: 'value', name: '作品数' },
    series: [
      {
        type: 'bar',
        data: store.collections.map((item) => item.count),
        barMaxWidth: 42,
      },
    ],
  }
  chart.setOption(option)
}

function handleResize() {
  chart?.resize()
}
</script>
