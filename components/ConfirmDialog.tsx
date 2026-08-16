"use client";

import { useEffect } from "react";

interface Props {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 统一确认对话框（替代原生 confirm()，风格与整体一致）。 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "确认",
  cancelLabel = "取消",
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="alertdialog"
      aria-modal="true"
    >
      <div className="sheet-pop relative w-[min(420px,90vw)] rounded-2xl bg-paper-50 shadow-card border border-line/60 p-6">
        <h3 className="text-base font-semibold text-ink-900">{title}</h3>
        <div className="text-sm text-ink-600 mt-2 leading-relaxed">{message}</div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm text-ink-700 border border-line bg-paper-50 hover:bg-paper-200 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={
              "rounded-md px-4 py-2 text-sm font-medium text-paper-50 transition-colors " +
              (danger
                ? "bg-danger hover:bg-danger-hover"
                : "bg-accent hover:bg-accent-hover")
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
