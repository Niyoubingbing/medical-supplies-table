"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import TableEditor from "@/components/TableEditor";
import AddItemModal from "@/components/AddItemModal";
import SupplierReference from "@/components/SupplierReference";
import ScreenshotModal from "@/components/ScreenshotModal";
import DataTransfer from "@/components/DataTransfer";
import ReorderModal from "@/components/ReorderModal";
import ListManager from "@/components/ListManager";
import Sheet from "@/components/Sheet";
import ConfirmDialog from "@/components/ConfirmDialog";
import Toast from "@/components/Toast";
import RemarkSheet from "@/components/RemarkSheet";
import PresetManager from "@/components/PresetManager";
import SettingsSheet from "@/components/SettingsSheet";
import type { Item, RemarkMeta } from "@/types/item";
import { FIXED_QTY, FIXED_UNIT, isEmptyMeta, joinRemark } from "@/types/item";
import type { AppState, SupplyList } from "@/types/list";
import { loadState, saveState, nextNo, createList, suggestedListName } from "@/lib/storage";
import { loadPresets, savePresets, DEFAULT_PRESETS } from "@/lib/presets";
import type { Presets } from "@/lib/presets";
import { APP_VERSION } from "@/lib/version";

export default function Page() {
  const [state, setState] = useState<AppState | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [shotOpen, setShotOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [dtOpen, setDtOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [listsOpen, setListsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [remarkItem, setRemarkItem] = useState<Item | null>(null);
  const [presetOpen, setPresetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [presets, setPresets] = useState<Presets>(DEFAULT_PRESETS);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  // Hydrate（含 v1 单清单数据自动迁移）
  useEffect(() => {
    setState(loadState());
    setPresets(loadPresets());
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  // 持久化；写入失败必须让用户知道（防止静默丢数据）
  useEffect(() => {
    if (!state) return;
    const ok = saveState(state);
    if (!ok) showToast("保存失败：存储空间不足，请立即「数据导入/导出」备份");
  }, [state, showToast]);

  const lists = state?.lists ?? [];
  const activeList: SupplyList | undefined =
    lists.find((l) => l.id === state?.activeListId) ?? lists[0];
  const items = activeList?.items ?? [];
  const computedNextNo = useMemo(() => nextNo(items), [items]);

  // ---------- 清单操作 ----------
  const switchList = useCallback((id: string) => {
    setState((s) => (s ? { ...s, activeListId: id } : s));
  }, []);

  const createListAction = useCallback(
    (name: string) => {
      if (!state) return;
      const trimmed = name.trim() || suggestedListName();
      const list = createList(trimmed);
      setState({
        ...state,
        lists: [...state.lists, list],
        activeListId: list.id,
      });
      showToast(`已创建「${list.name}」`);
    },
    [state, showToast]
  );

  const duplicateList = useCallback(
    (id: string) => {
      if (!state) return;
      const src = state.lists.find((l) => l.id === id);
      if (!src) return;
      const list = createList(`${src.name} 副本`, src.items.map((it) => ({ ...it })));
      setState({
        ...state,
        lists: [...state.lists, list],
        activeListId: list.id,
      });
      showToast(`已复制为「${list.name}」`);
    },
    [state, showToast]
  );

  const renameList = useCallback(
    (id: string, name: string) => {
      if (!state) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      setState({
        ...state,
        lists: state.lists.map((l) =>
          l.id === id ? { ...l, name: trimmed, updatedAt: Date.now() } : l
        ),
      });
    },
    [state]
  );

  const deleteList = useCallback(
    (id: string) => {
      if (!state) return;
      if (state.lists.length <= 1) {
        showToast("至少保留一个清单");
        return;
      }
      const lists = state.lists.filter((l) => l.id !== id);
      setState({
        ...state,
        lists,
        activeListId: state.activeListId === id ? lists[0].id : state.activeListId,
      });
      showToast("清单已删除");
    },
    [state, showToast]
  );

  // ---------- 条目操作（作用于当前清单） ----------
  const updateItems = useCallback(
    (updater: (items: Item[]) => Item[]) => {
      if (!state || !activeList) return;
      const nextItems = updater(activeList.items);
      setState({
        ...state,
        lists: state.lists.map((l) =>
          l.id === activeList.id
            ? { ...l, items: nextItems, updatedAt: Date.now() }
            : l
        ),
      });
    },
    [state, activeList]
  );

  const handleAdd = useCallback(
    (data: Omit<Item, "id" | "qty" | "unit">) => {
      updateItems((prev) => [
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
          meta: data.meta,
        },
      ]);
    },
    [updateItems]
  );

  const handleChange = useCallback(
    (id: string, patch: Partial<Item>) => {
      updateItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
      );
    },
    [updateItems]
  );

  const handleRemove = useCallback(
    (id: string) => {
      updateItems((prev) =>
        prev.filter((it) => it.id !== id).map((it, i) => ({ ...it, no: i + 1 }))
      );
    },
    [updateItems]
  );

  const handleReorder = useCallback(
    (next: Item[]) => {
      updateItems(() => next.map((it, i) => ({ ...it, no: i + 1 })));
    },
    [updateItems]
  );

  const handleImportItems = useCallback(
    (next: Item[]) => {
      updateItems(() => next);
      showToast(`已导入 ${next.length} 条到「${activeList?.name ?? "当前清单"}」`);
    },
    [updateItems, activeList, showToast]
  );

  const handleImportBackup = useCallback(
    (backup: AppState) => {
      setState(backup);
      showToast(`已恢复 ${backup.lists.length} 个清单`);
    },
    [showToast]
  );

  const handleClear = useCallback(() => {
    if (items.length === 0) return;
    setClearConfirm(true);
  }, [items.length]);

  // 备注抽屉保存：写结构化 meta + 序列化 remark 文本
  const handleSaveRemark = useCallback(
    (meta: RemarkMeta) => {
      if (!remarkItem) return;
      handleChange(remarkItem.id, {
        meta: isEmptyMeta(meta) ? undefined : meta,
        remark: joinRemark(meta),
      });
    },
    [remarkItem, handleChange]
  );

  const handleSavePresets = useCallback(
    (p: Presets) => {
      setPresets(p);
      const ok = savePresets(p);
      showToast(ok ? "预设已保存" : "预设保存失败：存储空间不足");
    },
    [showToast]
  );

  // 复制整列 SPD：格式为「SPD 器械申请」+ 逐行「序号 <SPD>」
  const copySpdColumn = useCallback(async () => {
    if (items.length === 0) return;
    const text = [
      "SPD 器械申请",
      ...items.map((it) => `${it.no} ${it.spd ?? ""}`),
    ].join("\n");

    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      } else {
        throw new Error("clipboard-unavailable");
      }
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
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

    if (ok) showToast(`已复制 ${items.length} 条 SPD`);
    else showToast("复制失败，请手动选择文本复制");
  }, [items, showToast]);

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const btnBase =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors";

  return (
    <main className="relative min-h-screen px-4 sm:px-8 pt-3 sm:pt-10 pb-32 sm:pb-14 max-w-[1280px] mx-auto">
      <Toast message={toast} />

      {/* Header：当前清单 + 计数（手机上吸顶） */}
      <header className="sticky top-0 z-30 -mx-4 sm:mx-0 px-4 sm:px-0 bg-paper/95 backdrop-blur-sm sm:backdrop-blur-none sm:static sm:bg-transparent border-b border-line/40 sm:border-0 pb-2.5 sm:pb-0">
        <p className="hidden sm:block text-sm text-ink-500 tracking-widest uppercase mb-1">
          Medical Supplies · Local Editor
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setListsOpen(true)}
            className="min-w-0 flex-1 flex items-center gap-2 text-left group"
            aria-label="切换清单"
          >
            <div className="min-w-0">
              <p className="text-[11px] text-ink-400 tracking-widest uppercase leading-tight">
                当前清单
              </p>
              <h1 className="truncate text-[22px] sm:text-[34px] font-semibold text-ink-900 leading-tight">
                {activeList?.name ?? "…"}
              </h1>
            </div>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-ink-400 group-hover:text-ink-700 transition-colors"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          <div className="shrink-0 text-right">
            <p className="text-[26px] sm:text-[30px] font-semibold text-ink-900 tabular-nums leading-none">
              {items.length}
            </p>
            <p className="text-[11px] text-ink-400 mt-0.5">条记录</p>
          </div>
        </div>
        <p className="hidden sm:block text-ink-600 mt-2 max-w-2xl text-sm">
          数据保存在本机浏览器，刷新不丢失。点击表格单元格即可就地编辑；点「导出截图」可预览并保存为高清 PNG。
          请购数固定 {FIXED_QTY} {FIXED_UNIT}/条。
        </p>
      </header>

      {/* Desktop toolbar */}
      <div className="hidden sm:flex flex-wrap items-center gap-2.5 mb-5 mt-2">
        <button
          onClick={openAdd}
          className={btnBase + " text-paper-50 bg-accent hover:bg-accent-hover"}
        >
          添加条目
        </button>
        <button
          onClick={() => setShotOpen(true)}
          className={btnBase + " text-paper-50 bg-ink-800 hover:bg-ink-700"}
        >
          导出截图
        </button>
        {items.length > 0 && (
          <>
            <button
              onClick={copySpdColumn}
              className={btnBase + " text-ink-700 border border-line bg-paper-50 hover:bg-paper-200"}
            >
              复制 SPD
            </button>
            <button
              onClick={() => setReorderOpen(true)}
              className={btnBase + " text-ink-700 border border-line bg-paper-50 hover:bg-paper-200"}
            >
              排序
            </button>
            <button
              onClick={() => setDtOpen(true)}
              className={btnBase + " text-ink-600 hover:text-ink-900 hover:bg-paper-200"}
            >
              数据导入/导出
            </button>
            <button
              onClick={() => setPresetOpen(true)}
              className={btnBase + " text-ink-600 hover:text-ink-900 hover:bg-paper-200"}
            >
              预设管理
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className={btnBase + " text-ink-600 hover:text-ink-900 hover:bg-paper-200"}
            >
              设置
            </button>
            <button
              onClick={handleClear}
              className={btnBase + " text-danger hover:bg-paper-200"}
            >
              清空全部
            </button>
          </>
        )}
      </div>

      {/* Table region */}
      <div className="bg-paper-100 p-2 sm:p-3 rounded-2xl">
        <TableEditor
          items={items}
          onChange={handleChange}
          onRemoveRequest={(it) => setDeleteTarget(it)}
          onEdit={(it) => {
            setEditing(it);
            setModalOpen(true);
          }}
          onEditRemark={(it) => setRemarkItem(it)}
          presets={presets}
          onEmptyAdd={openAdd}
          onEmptyCopy={() => setListsOpen(true)}
        />
      </div>

      <footer className="hidden sm:flex mt-10 pt-6 border-t border-line/60 text-sm text-ink-500 flex-wrap items-center justify-between gap-2">
        <p>序号自动递增，删除条目后会自动重新编号。SPD 编码可留空。</p>
        <p className="text-ink-400">数据仅存储于本机浏览器 · v{APP_VERSION}</p>
      </footer>
      <p className="sm:hidden text-center text-[11px] text-ink-400 mt-6">
        数据仅存储于本机浏览器 · v{APP_VERSION}
      </p>

      {/* Mobile bottom action bar */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-line/70 bg-paper-50/95 backdrop-blur px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <button
            onClick={() => setMoreOpen(true)}
            className="w-12 h-12 shrink-0 grid place-items-center rounded-xl border border-line bg-paper-50 text-ink-700 hover:bg-paper-200 active:scale-95 transition-all"
            aria-label="更多操作"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="19" cy="12" r="1.8" />
            </svg>
          </button>
          <button
            onClick={openAdd}
            className="flex-1 h-12 inline-flex items-center justify-center gap-2 rounded-xl text-base font-medium text-paper-50 bg-accent hover:bg-accent-hover shadow-soft active:scale-[0.98] transition-all"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            添加条目
          </button>
          <button
            onClick={() => setShotOpen(true)}
            className="flex-1 h-12 inline-flex items-center justify-center gap-2 rounded-xl text-base font-medium text-paper-50 bg-ink-800 hover:bg-ink-700 active:scale-[0.98] transition-all"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            导出截图
          </button>
        </div>
      </nav>

      {/* 更多操作（手机） */}
      <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title="更多操作">
        <ul className="-mx-2 space-y-0.5">
          <MoreRow
            icon="reorder"
            label="排序"
            desc="调整条目先后顺序"
            disabled={items.length === 0}
            onClick={() => {
              setMoreOpen(false);
              setReorderOpen(true);
            }}
          />
          <MoreRow
            icon="copy"
            label="复制 SPD"
            desc="「SPD 器械申请」+ 逐行序号与编码"
            disabled={items.length === 0}
            onClick={() => {
              setMoreOpen(false);
              copySpdColumn();
            }}
          />
          <MoreRow
            icon="transfer"
            label="数据导入/导出"
            desc="备份、换机迁移、粘贴导入"
            onClick={() => {
              setMoreOpen(false);
              setDtOpen(true);
            }}
          />
          <MoreRow
            icon="sliders"
            label="预设管理"
            desc="科室 / 医生 / SPD 快捷选项"
            onClick={() => {
              setMoreOpen(false);
              setPresetOpen(true);
            }}
          />
          <MoreRow
            icon="settings"
            label="设置"
            desc="版本与更新、数据说明"
            onClick={() => {
              setMoreOpen(false);
              setSettingsOpen(true);
            }}
          />
          <MoreRow
            icon="trash"
            label="清空当前清单"
            desc={`删除「${activeList?.name ?? ""}」的全部 ${items.length} 条记录`}
            danger
            disabled={items.length === 0}
            onClick={() => {
              setMoreOpen(false);
              handleClear();
            }}
          />
        </ul>
        <p className="text-[11px] text-ink-400 mt-4 text-center">
          数据仅存储于本机浏览器 · v{APP_VERSION}
        </p>
      </Sheet>

      <AddItemModal
        open={modalOpen}
        initial={editing}
        nextNo={computedNextNo}
        presets={presets}
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
              meta: data.meta,
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
        listName={activeList?.name ?? ""}
        onClose={() => setShotOpen(false)}
      />

      <SupplierReference open={refOpen} onOpenChange={setRefOpen} />

      <DataTransfer
        open={dtOpen}
        items={items}
        lists={lists}
        onClose={() => setDtOpen(false)}
        onImportItems={handleImportItems}
        onImportBackup={handleImportBackup}
      />

      <ReorderModal
        open={reorderOpen}
        items={items}
        onClose={() => setReorderOpen(false)}
        onReorder={handleReorder}
      />

      <ListManager
        open={listsOpen}
        onClose={() => setListsOpen(false)}
        state={state ?? { schemaVersion: 2, activeListId: "", lists }}
        onSwitch={switchList}
        onCreate={createListAction}
        onDuplicate={duplicateList}
        onRename={renameList}
        onDelete={deleteList}
      />

      {/* 备注编辑抽屉 */}
      <RemarkSheet
        open={remarkItem !== null}
        value={remarkItem?.meta ?? {}}
        presets={presets}
        onClose={() => setRemarkItem(null)}
        onSave={handleSaveRemark}
      />

      {/* 预设管理抽屉 */}
      <PresetManager
        open={presetOpen}
        presets={presets}
        onClose={() => setPresetOpen(false)}
        onSave={handleSavePresets}
      />

      {/* 设置抽屉（版本与更新） */}
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenPresets={() => {
          setSettingsOpen(false);
          setPresetOpen(true);
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除条目？"
        message={
          <>
            确定删除「{deleteTarget?.name || "此条目"}」？删除后序号会自动重新编号。
          </>
        }
        confirmLabel="删除"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) handleRemove(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />

      <ConfirmDialog
        open={clearConfirm}
        title="清空当前清单？"
        message={
          <>
            确定清空「{activeList?.name}」的全部 {items.length} 条记录？
            此操作不可恢复（仅清除本机浏览器数据）。
          </>
        }
        confirmLabel="清空"
        danger
        onCancel={() => setClearConfirm(false)}
        onConfirm={() => {
          updateItems(() => []);
          setClearConfirm(false);
          showToast("已清空当前清单");
        }}
      />
    </main>
  );
}

/* ---------- 更多菜单行 ---------- */

function MoreRow({
  icon,
  label,
  desc,
  danger = false,
  disabled = false,
  onClick,
}: {
  icon: "reorder" | "copy" | "transfer" | "trash" | "settings" | "sliders";
  label: string;
  desc: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-paper-100 transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        <span
          className={
            "shrink-0 w-9 h-9 grid place-items-center rounded-lg border " +
            (danger
              ? "border-danger/30 bg-danger/5 text-danger"
              : "border-line bg-paper-50 text-ink-600")
          }
        >
          {icon === "reorder" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="15" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
          {icon === "copy" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
          {icon === "transfer" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h13" />
              <path d="m14 4 3 3-3 3" />
              <path d="M20 17H7" />
              <path d="m10 14-3 3 3 3" />
            </svg>
          )}
          {icon === "sliders" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
              <circle cx="9" cy="6" r="1.6" fill="currentColor" stroke="none" />
              <circle cx="15" cy="12" r="1.6" fill="currentColor" stroke="none" />
              <circle cx="7" cy="18" r="1.6" fill="currentColor" stroke="none" />
            </svg>
          )}
          {icon === "settings" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          )}
          {icon === "trash" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className={"block text-sm font-medium " + (danger ? "text-danger" : "text-ink-800")}>
            {label}
          </span>
          <span className="block text-[11px] text-ink-400 mt-0.5 truncate">{desc}</span>
        </span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ink-300">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </li>
  );
}