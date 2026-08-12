"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import TableEditor from "@/components/TableEditor";
import AddItemModal from "@/components/AddItemModal";
import ExportButton from "@/components/ExportButton";
import type { Item } from "@/types/item";
import { FIXED_QTY, FIXED_UNIT } from "@/types/item";
import { loadItems, saveItems, nextNo } from "@/lib/storage";

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const tableWrapRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setItems(loadItems());
    setHydrated(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (hydrated) saveItems(items);
  }, [items, hydrated]);

  const handleAdd = useCallback(
    (data: Omit<Item, "id" | "qty" | "unit">) => {
      setItems((prev) => [
        ...prev,
        {
          id: uuidv4(),
          spd: data.spd,
          no: data.no,
          name: data.name,
          spec: data.spec,
          qty: FIXED_QTY,
          unit: FIXED_UNIT,
          remark: data.remark,
        },
      ]);
    },
    []
  );

  const handleChange = useCallback((id: string, patch: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const handleRemove = useCallback((id: string) => {
    setItems((prev) => {
      const filtered = prev.filter((it) => it.id !== id);
      // Re-number sequentially to keep 序号 tidy
      return filtered.map((it, i) => ({ ...it, no: i + 1 }));
    });
  }, []);

  const handleClear = () => {
    if (items.length === 0) return;
    if (
      confirm(
        `确定清空全部 ${items.length} 条记录？此操作不可恢复（仅清除本地浏览器数据）。`
      )
    ) {
      setItems([]);
    }
  };

  const computedNextNo = useMemo(() => nextNo(items), [items]);

  return (
    <main className="relative min-h-screen px-4 sm:px-8 py-8 sm:py-12 max-w-[1280px] mx-auto">
      {/* Header */}
      <header className="mb-8">
        <p className="text-sm text-ink-500 tracking-widest uppercase mb-1">
          Medical Supplies · Local Editor
        </p>
        <h1
          className="text-[34px] sm:text-[40px] font-semibold text-ink-900 leading-tight"
          style={{ letterSpacing: "0.005em" }}
        >
          医用耗材录入表
        </h1>
        <p className="text-ink-600 mt-2 max-w-2xl">
          数据保存在本机浏览器，刷新不丢失。点击表格单元格即可就地编辑；
          点击「导出截图」可一键下载为 PNG 图片。
        </p>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="text-sm text-ink-600">
          <span className="text-ink-500">共 </span>
          <span className="font-semibold text-ink-900 tabular-nums">
            {items.length}
          </span>
          <span className="text-ink-500"> 条记录</span>
          {items.length > 0 && (
            <span className="text-ink-400 ml-3">
              （请购数固定 {FIXED_QTY} {FIXED_UNIT}/条）
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-paper-50 bg-accent hover:bg-accent-hover transition-colors shadow-soft"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            添加条目
          </button>
          <ExportButton targetRef={tableWrapRef} />
          {items.length > 0 && (
            <button
              onClick={handleClear}
              className="rounded-md px-3 py-2 text-sm text-ink-600 hover:text-accent hover:bg-paper-200 transition-colors"
            >
              清空全部
            </button>
          )}
        </div>
      </div>

      {/* Table region (the part to be captured) */}
      <div ref={tableWrapRef} className="bg-paper-100 p-2 sm:p-3 rounded-2xl">
        <TableEditor
          items={items}
          onChange={handleChange}
          onRemove={handleRemove}
        />
      </div>

      {/* Footer note */}
      <footer className="mt-10 pt-6 border-t border-line/60 text-sm text-ink-500 flex flex-wrap items-center justify-between gap-2">
        <p>
          序号自动递增，删除条目后会自动重新编号。SPD 编码可留空。
        </p>
        <p className="text-ink-400">
          数据仅存储于本机浏览器，不会上传服务器。
        </p>
      </footer>

      <AddItemModal
        open={modalOpen}
        initial={editing}
        nextNo={computedNextNo}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={(data) => {
          if (editing) {
            handleChange(editing.id, {
              spd: data.spd,
              name: data.name,
              spec: data.spec,
              remark: data.remark,
            });
          } else {
            handleAdd(data);
          }
          setEditing(null);
        }}
      />
    </main>
  );
}
