"use client";

import { useEffect, useRef, useState } from "react";
import {
  initSW,
  subscribeUpdateAvailability,
  getUpdateAvailable,
  confirmUpdate,
} from "@/lib/sw-client";

// 仅在生产环境注册 Service Worker。
// 更新流程（用户确认式）：
//   缓存优先渲染 + 后台静默检查 → 新版本就绪时弹横幅（立即更新 / 稍后）
//   → 确认才激活新版并自动刷新；取消则旧版完整运行（可在「设置」里确认更新）。
export default function ServiceWorkerRegister() {
  const [available, setAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const dismissedRef = useRef(dismissed);
  dismissedRef.current = dismissed;

  useEffect(() => {
    initSW();
    setAvailable(getUpdateAvailable());
    const unsub = subscribeUpdateAvailability((v) => {
      setAvailable(v);
      if (v) setDismissed(false); // 新一轮更新就绪时重新提示
    });

    // 确认更新后：新 SW 接管 → 自动刷新应用新版
    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange);

    return () => {
      unsub();
      navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!available || dismissed) return null;

  return (
    <div className="fixed top-[92px] inset-x-0 z-[70] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2.5 rounded-xl bg-ink-800/95 text-paper-50 shadow-card px-3.5 py-2.5 text-[13px] max-w-full">
        <span className="inline-flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          新版本已就绪
        </span>
        <span className="flex items-center gap-1.5">
          <button
            onClick={() => confirmUpdate()}
            className="rounded-full bg-accent text-paper-50 px-3 py-1 text-xs font-medium hover:bg-accent-hover transition-colors"
          >
            立即更新
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-full bg-paper-50/10 px-3 py-1 text-xs text-paper-50/90 hover:bg-paper-50/20 transition-colors"
          >
            稍后
          </button>
        </span>
      </div>
    </div>
  );
}
