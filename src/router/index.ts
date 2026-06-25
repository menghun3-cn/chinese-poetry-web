import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import InsightsView from '@/views/InsightsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: '诗词阅读' },
    },
    {
      path: '/insights',
      name: 'insights',
      component: InsightsView,
      meta: { title: '数据概览' },
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

router.afterEach((to) => {
  document.title = `${to.meta.title ?? '诗词阅读'} | 诗屿`
})

export default router
