"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Item } from "@/types/item";
import { FIXED_QTY, FIXED_UNIT } from "@/types/item";
import { v4 as uuidv4 } from "uuid";

interface Props {
  open: boolean;
  items: Item[];
  onClose: () => void;
  onImport: (items: Item[]) => void;
}

// 仅导出可编辑字段；请购数 / 单位固定为「1 套」，导入时强制回填
function toExport(items: Item[]): string {
  const data = items.map((it) => ({
    spd: it.spd,
    name: it.name,
    spec: it.spec,
    remark: it.remark,
  }));
  return JSON.stringify(data, null, 2);
}

export default function DataTransfer({ open, items, onClose, onImport }: Props) {
  const exportText = useMemo(() => toExport(items), [items]);
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const importRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setCopied(false);
      setImportText("");
      setError(null);
      setConfirmOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const copyExport = async () => {
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(exportText);
        ok = true;
      } else {
        throw new Error("clipboard-unavailable");
      }
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = exportText;
        ta.style.position = "fixed";
        ta.style.top = "-9999px";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } else {
      alert("复制失败，请手动选择文本复制。");
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setImportText(text);
      setError(null);
    } catch {
      alert("无法读取剪贴板，请手动粘贴。");
    }
  };

  const tryParse = (): Item[] | null => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(importText);
    } catch {
      setError("文本不是合法的 JSON，请确认已复制完整的导出内容。");
      return null;
    }
    if (!Array.isArray(parsed)) {
      setError("数据应为条目数组（[...]）。");
      return null;
    }
    const out: Item[] = parsed.map((x, i) => {
      const o = (x ?? {}) as Record<string, unknown>;
      return {
        id: uuidv4(),
        spd: typeof o.spd === "string" ? o.spd : String(o.spd ?? ""),
        no: i + 1,
        name: typeof o.name === "string" ? o.name : String(o.name ?? ""),
        spec: typeof o.spec === "string" ? o.spec : String(o.spec ?? ""),
        qty: FIXED_QTY,
        unit: FIXED_UNIT,
        remark: typeof o.remark === "string" ? o.remark : String(o.remark ?? ""),
      };
    });
    setError(null);
    return out;
  };

  const handleImportClick = () => {
    const parsed = tryParse();
    if (!parsed) return;
    if (items.length > 0) {
      setConfirmOpen(true);
    } else {
      onImport(parsed);
      onClose();
    }
  };

  const doImport = () => {
    const parsed = tryParse();
    if (!parsed) return;
    onImport(parsed);
    setConfirmOpen(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-[min(560px,92vw)] max-h-[90vh] flex flex-col rounded-2xl bg-paper-50 shadow-card border border-line/60">
        <div className="flex items-center justify-between px-5 py-3 border-b border-line/60">
          <h2 className="text-base font-semibold text-ink-900">数据导入 / 导出</h2>
          <button
            onClick={onClose}
            className="text-ink-500 hover:text-ink-900 text-2xl leading-none px-2"
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* 导出 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-ink-800">导出（复制全部数据）</h3>
              <button
                onClick={copyExport}
                className={
                  "rounded-md px-3 py-1.5 text-xs font-medium border transition-colors " +
                  (copied
                    ? "text-accent border-accent/50 bg-accent-soft/40"
                    : "text-ink-700 border-line bg-paper-50 hover:bg-paper-200")
                }
              >
                {copied ? "已复制" : "复制到剪贴板"}
              </button>
            </div>
            <textarea
              readOnly
              value={exportText}
              className="cell-input w-full rounded-md border border-line bg-paper-100 px-3 py-2 text-[12.5px] text-ink-700 resize-y"
              rows={Math.min(10, Math.max(3, items.length))}
            />
            <p className="text-[11px] text-ink-400 mt-1">
              格式为 JSON，含 SPD / 品名 / 规格 / 备注。可粘贴到其它设备导入。
            </p>
          </section>

          <div className="border-t border-line/60" />

          {/* 导入 */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-ink-800">导入（粘贴数据）</h3>
              <button
                onClick={pasteFromClipboard}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-700 border border-line bg-paper-50 hover:bg-paper-200 transition-colors"
              >
                从剪贴板粘贴
              </button>
            </div>
            <textarea
              ref={importRef}
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setError(null);
              }}
              placeholder='粘贴导出的 JSON，例如：[{"spd":"...","name":"...","spec":"...","remark":"..."}]'
              className="cell-input w-full rounded-md border border-line bg-paper-50 px-3 py-2 text-[12.5px] text-ink-800 resize-y"
              rows={Math.min(10, Math.max(3, items.length))}
            />
            {error && (
              <p className="text-[11px] text-accent mt-1">{error}</p>
            )}
            <button
              onClick={handleImportClick}
              disabled={!importText.trim()}
              className="mt-2 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-paper-50 bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              导入数据
            </button>
            <p className="text-[11px] text-ink-400 mt-1">
              导入将覆盖当前所有条目，请购数 / 单位固定为「1 套」，序号自动重排。
            </p>
          </section>
        </div>
      </div>

      {/* 导入确认 */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center modal-overlay">
          <div className="relative w-[min(420px,90vw)] rounded-2xl bg-paper-50 shadow-card border border-line/60 p-6">
            <h3 className="text-base font-semibold text-ink-900">覆盖现有数据？</h3>
            <p className="text-sm text-ink-600 mt-2">
              当前已有 {items.length} 条记录，导入将全部替换。此操作不可恢复。
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="rounded-md px-4 py-2 text-sm text-ink-700 hover:bg-paper-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={doImport}
                className="rounded-md px-4 py-2 text-sm font-medium text-paper-50 bg-accent hover:bg-accent-hover transition-colors"
              >
                确认覆盖导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
