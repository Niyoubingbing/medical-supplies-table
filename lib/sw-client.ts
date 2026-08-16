// Service Worker 更新控制器（客户端）
// 更新策略（用户确认式）：
//   1. 页面始终由缓存优先渲染，后台静默检查更新；
//   2. 新版本下载安装后进入 waiting（不自动激活）；
//   3. 用户确认（横幅「立即更新」或设置里的「确认更新」）后才 SKIP_WAITING；
//   4. 取消确认则继续完整运行旧版本（旧缓存不清理）；
//   5. 确认后 controllerchange 触发页面刷新，加载新版。

type Listener = (available: boolean) => void;

let registration: ServiceWorkerRegistration | null = null;
let available = false;
const listeners = new Set<Listener>();
let initPromise: Promise<void> | null = null;
let pollTimer: number | null = null;

function notify() {
  listeners.forEach((l) => l(available));
}

function refreshAvailability() {
  const next = Boolean(registration?.waiting);
  if (next !== available) {
    available = next;
    notify();
  }
}

async function setup() {
  if (typeof window === "undefined") return;
  if (process.env.NODE_ENV !== "production") return;
  if (!("serviceWorker" in navigator)) return;

  const reg = await navigator.serviceWorker.register("/sw.js");
  registration = reg;
  refreshAvailability();

  reg.addEventListener("updatefound", () => {
    const installing = reg.installing;
    if (!installing) return;
    installing.addEventListener("statechange", () => {
      // 新 SW 安装完成且已有旧 SW 在控 → 更新就绪，等待用户确认
      if (installing.state === "installed" && navigator.serviceWorker.controller) {
        refreshAvailability();
      }
    });
  });

  // 轮询兜底：waiting 赋值与 statechange 事件存在时序竞态，
  // 事件先触发时可能读不到 waiting，靠轮询保证更新就绪状态最终被检测到
  if (pollTimer === null) {
    pollTimer = window.setInterval(refreshAvailability, 2000);
  }
}

/** 幂等初始化（由 sw-register 组件挂载时调用） */
export function initSW(): void {
  if (!initPromise) {
    initPromise = setup().catch(() => {
      /* 注册失败不影响正常使用，仅失去离线能力 */
    });
  }
}

/** 订阅「更新就绪」状态变化，返回取消订阅函数 */
export function subscribeUpdateAvailability(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getUpdateAvailable(): boolean {
  return available;
}

/** 用户确认更新：激活等待中的新 SW（随后 controllerchange → 页面自动刷新） */
export function confirmUpdate(): void {
  registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
}

/** 手动检查更新；返回是否有新版本就绪 */
export async function checkForUpdates(): Promise<boolean> {
  try {
    await registration?.update();
  } catch {
    return available;
  }
  // 等待 updatefound → installed 完成（最多 6 秒）
  for (let i = 0; i < 30; i++) {
    if (available) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return available;
}
