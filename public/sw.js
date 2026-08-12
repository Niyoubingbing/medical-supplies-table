// 医用耗材录入表 — 离线 Service Worker
// 缓存策略：
//   - 安装时预缓存应用外壳（HTML / 图标 / manifest）
//   - 页面导航（HTML）：网络优先，失败回退到缓存外壳 → 断网也能打开
//   - 静态资源（/_next/static、/icons 等）：缓存优先，命中即返回，未命中再走网络并写入缓存
//   - 跨域资源（Google Fonts）交由浏览器正常处理，离线时自动回退系统衬线字体

const CACHE = "medical-pwa-v1";

const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // 仅处理同源请求；跨域（字体）交给浏览器
  if (url.origin !== self.location.origin) return;

  // 页面导航：网络优先，失败回退缓存外壳
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/")))
    );
    return;
  }

  // 静态资源：缓存优先
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
