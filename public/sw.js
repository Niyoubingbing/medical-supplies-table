// 医用耗材录入表 — 离线 Service Worker
// 缓存策略：
//   - 安装时预缓存应用外壳（HTML / 图标 / manifest）
//   - 页面导航（HTML）：缓存优先（本地高优先级），断网即时可用；
//     命中缓存的同时后台静默更新，联网后自动刷新到最新版本
//   - 静态资源（/_next/static、/icons 等）：缓存优先，命中即返回，未命中再走网络并写入缓存
//   - 跨域字体（Google Fonts 中国镜像）缓存优先，首次联网加载后离线也能用衬线字体
// 更新机制（用户确认式）：
//   新版本下载安装后进入 waiting（install 里不调用 skipWaiting，旧版继续完整控制、旧缓存不清理）；
//   用户确认更新后，页面发送 SKIP_WAITING 消息 → 新 SW 激活 → activate 清理旧缓存并 claim → 页面自动刷新加载新版。

const CACHE = "medical-pwa-v5";

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
  // 预缓存应用外壳；不自动 skipWaiting——等待用户确认后才激活新版
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
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

function cacheFirst(req) {
  return caches.match(req).then((cached) => {
    if (cached) return cached;
    return fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => cached);
  });
}

// 导航请求：本地缓存高优先级（断网即时可用），同时后台更新缓存
function navigateStaleWhileRevalidate(req) {
  return caches.match(req).then((cached) => {
    const network = fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => cached); // 彻底断网时回退到已缓存外壳
    // 优先返回本地缓存，保证离线零延迟打开
    return cached || network;
  });
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 跨域字体（Google Fonts 中国镜像，响应带 ACAO:* 可正常缓存）：
  // CSS 与字体文件均缓存优先 → 首次联网加载后，断网也能用衬线字体
  if (
    url.origin === "https://fonts.googleapis.cn" ||
    url.origin === "https://fonts.gstatic.cn"
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // 仅处理同源请求
  if (url.origin !== self.location.origin) return;

  // 页面导航：本地缓存优先（离线可用），后台静默更新
  if (req.mode === "navigate") {
    event.respondWith(navigateStaleWhileRevalidate(req));
    return;
  }

  // 同源静态资源：缓存优先
  event.respondWith(cacheFirst(req));
});
