"use client";

import { useEffect } from "react";

// 仅在生产环境注册 Service Worker，避免本地开发被离线缓存干扰。
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* 注册失败不影响正常使用，仅失去离线能力 */
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
    }
  }, []);

  return null;
}
