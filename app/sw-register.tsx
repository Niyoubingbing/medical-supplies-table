"use client";

import { useEffect, useState } from "react";

// 仅在生产环境注册 Service Worker，避免本地开发被离线缓存干扰。
// 同时监听新版本：新 SW 安装就绪后提示用户刷新，避免旧缓存长期停留。
export default function ServiceWorkerRegister() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // 已存在等待中的新版（页面打开期间发布了更新）
          if (reg.waiting) setWaiting(reg.waiting);

          reg.addEventListener("updatefound", () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.addEventListener("statechange", () => {
              // 新 SW 安装完成且已有旧 SW 在控，说明有更新可用
              if (installing.state === "installed" && navigator.serviceWorker.controller) {
                setWaiting(reg.waiting);
              }
            });
          });
        })
        .catch(() => {
          /* 注册失败不影响正常使用，仅失去离线能力 */
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
    }

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  if (!waiting) return null;

  const activate = () => {
    waiting.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-[70] flex justify-center px-4 pb-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink-800 text-paper-50 shadow-card px-4 py-2.5 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          有新版本可用
        </span>
        <button
          onClick={activate}
          className="rounded-full bg-accent text-paper-50 px-3 py-1 text-xs font-medium hover:bg-accent-hover transition-colors"
        >
          刷新应用
        </button>
      </div>
    </div>
  );
}
