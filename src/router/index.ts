import { createRouter, createWebHistory } from 'vue-router'

const HomeView = () => import('@/views/HomeView.vue')
const InsightsView = () => import('@/views/InsightsView.vue')

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
  const title = (to.meta.title as string | undefined) || '诗词阅读'
  document.title = title + ' | 诗屿'
})

export default router
