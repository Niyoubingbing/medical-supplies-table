"use client";

import { useEffect, useState } from "react";
import Sheet from "@/components/Sheet";
import { APP_VERSION } from "@/lib/version";
import {
  getUpdateAvailable,
  subscribeUpdateAvailability,
  confirmUpdate,
  checkForUpdates,
} from "@/lib/sw-client";

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenPresets: () => void;
}

/** 设置：版本与更新（确认更新入口）、预设管理、数据说明。 */
export default function SettingsSheet({ open, onClose, onOpenPresets }: Props) {
  const [available, setAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAvailable(getUpdateAvailable());
    const unsub = subscribeUpdateAvailability(setAvailable);
    return unsub;
  }, [open]);

  const doCheck = async () => {
    setChecking(true);
    const ok = await checkForUpdates();
    setAvailable(ok);
    setCheckedAt(
      new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
    );
    setChecking(false);
  };

  return (
    <Sheet open={open} onClose={onClose} title="设置">
      {/* 版本与更新 */}
      <section>
        <h3 className="text-sm font-medium text-ink-800 mb-2">版本与更新</h3>
        <div className="rounded-xl border border-line bg-paper-50 divide-y divide-line/60">
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-sm text-ink-600">当前版本</span>
            <span className="text-sm text-ink-900 tabular-nums font-medium">
              v{APP_VERSION}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-sm text-ink-600">更新状态</span>
            <span
              className={
                "text-sm font-medium " +
                (available ? "text-accent" : "text-ink-400")
              }
            >
              {available ? "新版本已就绪" : "已是最新"}
            </span>
          </div>
        </div>

        {available ? (
          <button
            onClick={() => confirmUpdate()}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-paper-50 bg-accent hover:bg-accent-hover transition-colors"
          >
            确认更新
          </button>
        ) : (
          <button
            onClick={doCheck}
            disabled={checking}
            className="mt-3 w-full inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-ink-700 border border-line bg-paper-50 hover:bg-paper-200 transition-colors disabled:opacity-60"
          >
            {checking ? "检查中…" : "检查更新"}
          </button>
        )}
        {checkedAt && !available && (
          <p className="text-[11px] text-ink-400 mt-2 text-center">
            最近检查 {checkedAt}，已是最新
          </p>
        )}
        <p className="text-[11px] text-ink-400 mt-2 leading-relaxed">
          应用为缓存优先：打开时加载本地内容，后台静默检查更新；有新版本时提示，确认后才更新，取消则继续使用旧版。
        </p>
      </section>

      <div className="border-t border-line/60 my-4" />

      {/* 偏好 */}
      <section>
        <h3 className="text-sm font-medium text-ink-800 mb-2">偏好</h3>
        <button
          onClick={onOpenPresets}
          className="w-full flex items-center justify-between rounded-xl border border-line bg-paper-50 px-3 py-2.5 text-left hover:bg-paper-100 transition-colors"
        >
          <span className="text-sm text-ink-700">预设管理</span>
          <span className="flex items-center gap-1 text-[11px] text-ink-400">
            科室 / 主治医生 / SPD 快捷项
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </button>
      </section>

      <div className="border-t border-line/60 my-4" />

      {/* 关于 */}
      <section>
        <h3 className="text-sm font-medium text-ink-800 mb-2">关于</h3>
        <p className="text-[11px] text-ink-400 leading-relaxed">
          数据仅存储于本机浏览器，不上传服务器；应用支持离线使用（首次联网打开后生效）。
        </p>
      </section>
    </Sheet>
  );
}
