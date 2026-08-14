"use client";

import { useEffect, useRef, useState } from "react";
import type { Item } from "@/types/item";

interface Props {
  open: boolean;
  items: Item[];
  onClose: () => void;
  onReorder: (items: Item[]) => void;
}

function move<T>(arr: T[], from: number, to: number): T[] {
  const next = arr.slice();
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}

export default function ReorderModal({ open, items, onClose, onReorder }: Props) {
  const [order, setOrder] = useState<Item[]>(items);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setOrder(items);
      setDragIdx(null);
      setOverIdx(null);
    }
  }, [open, items]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleDrop = (to: number) => {
    const from = dragRef.current;
    dragRef.current = null;
    setDragIdx(null);
    setOverIdx(null);
    if (from === null || from === to) return;
    setOrder((prev) => move(prev, from, to));
  };

  const handleSave = () => {
    onReorder(order);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-[min(520px,92vw)] max-h-[90vh] flex flex-col rounded-2xl bg-paper-50 shadow-card border border-line/60">
        <div className="flex items-center justify-between px-5 py-3 border-b border-line/60">
          <div>
            <h2 className="text-base font-semibold text-ink-900">调整条目顺序</h2>
            <p className="text-[11px] text-ink-400 mt-0.5">
              拖拽卡片可调整顺序，或点 ▲▼ 微调；仅显示备注栏
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-500 hover:text-ink-900 text-2xl leading-none px-2"
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {order.length === 0 ? (
            <p className="text-center text-ink-400 text-sm py-8">尚无条目</p>
          ) : (
            <ul className="space-y-2">
              {order.map((it, idx) => {
                const isDragging = dragIdx === idx;
                const isOver = overIdx === idx && dragIdx !== idx;
                return (
                  <li
                    key={it.id}
                    draggable
                    onDragStart={(e) => {
                      dragRef.current = idx;
                      setDragIdx(idx);
                      e.dataTransfer.effectAllowed = "move";
                      try {
                        e.dataTransfer.setData("text/plain", String(idx));
                      } catch {
                        /* ignore */
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      if (overIdx !== idx) setOverIdx(idx);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(idx);
                    }}
                    onDragEnd={() => {
                      dragRef.current = null;
                      setDragIdx(null);
                      setOverIdx(null);
                    }}
                    className={
                      "flex items-center gap-3 rounded-xl border bg-paper-50 px-3 py-2.5 transition-colors cursor-grab active:cursor-grabbing select-none " +
                      (isDragging
                        ? "opacity-40 border-accent/50 "
                        : isOver
                        ? "border-accent bg-accent-soft/40 "
                        : "border-line hover:bg-paper-200/60 ")
                    }
                  >
                    {/* 序号 badge */}
                    <span className="shrink-0 inline-flex items-center justify-center min-w-[1.6rem] h-6 px-2 rounded-full bg-accent text-paper-50 text-[13px] font-semibold tabular-nums">
                      {idx + 1}
                    </span>
                    {/* 拖拽手柄 */}
                    <span className="shrink-0 text-ink-300 leading-none text-lg" aria-hidden>
                      ⠿
                    </span>
                    {/* 备注 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] tracking-wide text-ink-400 mb-0.5">
                        备注
                      </div>
                      <div className="text-[14px] text-ink-900 truncate">
                        {it.remark?.trim() ? it.remark : <span className="text-ink-400 italic">—</span>}
                      </div>
                    </div>
                    {/* 上 / 下 */}
                    <div className="shrink-0 flex flex-col gap-1">
                      <button
                        onClick={() => idx > 0 && setOrder((p) => move(p, idx, idx - 1))}
                        disabled={idx === 0}
                        className="w-7 h-7 grid place-items-center rounded-md border border-line bg-paper-50 text-ink-600 hover:bg-paper-200 disabled:opacity-30 transition-colors"
                        aria-label="上移"
                        title="上移"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() =>
                          idx < order.length - 1 &&
                          setOrder((p) => move(p, idx, idx + 1))
                        }
                        disabled={idx === order.length - 1}
                        className="w-7 h-7 grid place-items-center rounded-md border border-line bg-paper-50 text-ink-600 hover:bg-paper-200 disabled:opacity-30 transition-colors"
                        aria-label="下移"
                        title="下移"
                      >
                        ▼
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line/60">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-ink-700 hover:bg-paper-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={order.length === 0}
            className="rounded-md px-4 py-2 text-sm font-medium text-paper-50 bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors shadow-soft"
          >
            保存顺序
          </button>
        </div>
      </div>
    </div>
  );
}
