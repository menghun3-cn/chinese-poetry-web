import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount("#app")

// Service Worker
if ('serviceWorker' in navigator) {
  // Register SW
  window.addEventListener('load', async () => {
    try {
      const m = await import('virtual:pwa-register')
      m.registerSW({
        onNeedRefresh() { m.registerSW() },
        onOfflineReady() { console.log('[SW] offline ready') },
      })
    } catch { /* not available */ }
  })
}
