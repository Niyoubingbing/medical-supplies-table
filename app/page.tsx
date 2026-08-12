"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import TableEditor from "@/components/TableEditor";
import AddItemModal from "@/components/AddItemModal";
import SupplierReference from "@/components/SupplierReference";
import ScreenshotModal from "@/components/ScreenshotModal";
import type { Item } from "@/types/item";
import { FIXED_QTY, FIXED_UNIT } from "@/types/item";
import { loadItems, saveItems, nextNo } from "@/lib/storage";

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [shotOpen, setShotOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);

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

  const bigBtn =
    "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-base font-medium transition-colors shadow-soft w-full sm:w-auto";

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
          数据保存在本机浏览器，刷新不丢失。点击表格单元格即可就地编辑，或点每行的「编辑」
          按钮修改；点「导出截图」可预览并保存为高清 PNG 图片。
        </p>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className={bigBtn + " text-paper-50 bg-accent hover:bg-accent-hover"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            添加条目
          </button>
          <button
            onClick={() => setShotOpen(true)}
            className={bigBtn + " text-paper-50 bg-ink-800 hover:bg-ink-700"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            导出截图
          </button>
          {items.length > 0 && (
            <button
              onClick={handleClear}
              className="rounded-lg px-4 py-3 text-sm text-ink-600 hover:text-accent hover:bg-paper-200 transition-colors w-full sm:w-auto"
            >
              清空全部
            </button>
          )}
        </div>
      </div>

      {/* Table region (edit view) */}
      <div className="bg-paper-100 p-2 sm:p-3 rounded-2xl">
        <TableEditor
          items={items}
          onChange={handleChange}
          onRemove={handleRemove}
          onEdit={(it) => {
            setEditing(it);
            setModalOpen(true);
          }}
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
        onOpenSupplier={() => setRefOpen(true)}
      />

      <ScreenshotModal
        open={shotOpen}
        items={items}
        onClose={() => setShotOpen(false)}
      />

      <SupplierReference open={refOpen} onOpenChange={setRefOpen} />
    </main>
  );
}
