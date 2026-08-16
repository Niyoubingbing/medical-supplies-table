"use client";

import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** 桌面端对话框宽度类 */
  width?: string;
  hideHeader?: boolean;
}

/**
 * 统一弹层容器：
 * - 手机端：底部抽屉（rounded-t-2xl，上滑动画，安全区留白）
 * - 桌面端（sm:）：居中对话框
 * 自带 Esc 关闭、遮罩点击关闭、背景滚动锁定。
 */
export default function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  width = "sm:w-[min(560px,92vw)]",
  hideHeader = false,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`sheet-panel relative w-full ${width} bg-paper-50 border border-line/60 flex flex-col rounded-t-2xl sm:rounded-2xl max-h-[92dvh] sm:max-h-[85vh] shadow-card`}
        role="dialog"
        aria-modal="true"
      >
        {!hideHeader && (
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line/60 shrink-0">
            <h2 className="text-base font-semibold text-ink-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-ink-500 hover:text-ink-900 text-2xl leading-none px-2 -mr-1"
              aria-label="关闭"
            >
              ×
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-line/60 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
