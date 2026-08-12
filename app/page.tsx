"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import TableEditor from "@/components/TableEditor";
import AddItemModal from "@/components/AddItemModal";
import ScreenshotModal from "@/components/ScreenshotModal";
import type { Item } from "@/types/item";
import { FIXED_QTY, FIXED_UNIT } from "@/types/item";
import { loadItems, saveItems, nextNo, loadDraft, saveDraft, clearDraft, hasDraft } from "@/lib/storage";

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [shotOpen, setShotOpen] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Hydrate from localStorage on mount; 主数据为空时自动恢复暂存草稿
  useEffect(() => {
    const items = loadItems();
    let init = items;
    if (init.length === 0 && hasDraft()) {
      const d = loadDraft();
      if (d.length) init = d;
    }
    setItems(init);
    setDraftAvailable(hasDraft());
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
      clearDraft();
      setDraftAvailable(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2000);
  };

  // 暂存：把当前条目（允许缺失/不完整）存为草稿快照
  const handleStash = () => {
    saveDraft(items);
    setDraftAvailable(true);
    showToast(`已暂存 ${items.length} 条草稿`);
  };

  // 载入暂存：恢复到上次暂存的快照
  const handleLoadDraft = () => {
    const d = loadDraft();
    if (!d.length) {
      showToast("没有可载入的暂存");
      return;
    }
    if (
      items.length > 0 &&
      !confirm(`载入暂存会覆盖当前 ${items.length} 条记录，确定继续？`)
    ) {
      return;
    }
    setItems(d);
    showToast(`已载入 ${d.length} 条暂存`);
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
          <button
            onClick={handleStash}
            className="rounded-lg px-4 py-3 text-sm text-ink-700 border border-line hover:bg-paper-200 transition-colors w-full sm:w-auto"
          >
            暂存
          </button>
          {draftAvailable && (
            <button
              onClick={handleLoadDraft}
              className="rounded-lg px-4 py-3 text-sm text-accent border border-accent/40 hover:bg-accent-soft/30 transition-colors w-full sm:w-auto"
            >
              载入暂存
            </button>
          )}
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
      />

      <ScreenshotModal
        open={shotOpen}
        items={items}
        onClose={() => setShotOpen(false)}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-ink-800 text-paper-50 text-sm px-4 py-2 rounded-lg shadow-card">
          {toast}
        </div>
      )}
    </main>
  );
}
