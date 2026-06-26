// 诗词数据 Service Worker
// 预缓存关键字数据，实现秒开体验

const CACHE_NAME = "poetry-cache-v1"
const PRECACHE_URLS = [
  "/poetry-data/meta.json",
  "/poetry-data/optimized-index.json"
]

// 安装：预缓存关键数据
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      await cache.addAll(PRECACHE_URLS)
      console.log("[SW] 预缓存完成:", PRECACHE_URLS.length, "项")
      await self.skipWaiting()
    })()
  )
})

// 激活：清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
      console.log("[SW] 旧缓存已清理")
      await self.clients.claim()
    })()
  )
})

// 拦截 fetch 请求
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)
  const path = url.pathname

  // 仅处理 poetry-data 路径
  if (path.startsWith("/poetry-data/")) {
    event.respondWith(
      (async () => {
        // 尝试从缓存获取
        const cached = await caches.match(event.request)
        if (cached) return cached

        // 缓存未命中，从网络获取并缓存
        try {
          const response = await fetch(event.request)
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME)
            // 克隆响应，因为 body 只能消费一次
            cache.put(event.request, response.clone())
          }
          return response
        } catch (err) {
          // 离线或网络错误
          console.error("[SW] 网络请求失败:", path, err)
          return new Response("", { status: 503 })
        }
      })()
    )
    return
  }

  // 处理 /assets/* 的缓存
  if (path.startsWith("/assets/")) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(event.request)
        if (cached) return cached
        const response = await fetch(event.request)
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME)
          cache.put(event.request, response.clone())
        }
        return response
      })()
    )
    return
  }

  // SPA 路由：始终从网络获取
  event.respondWith(fetch(event.request))
})
