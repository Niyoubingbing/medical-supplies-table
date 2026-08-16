"use client";

import { useState } from "react";
import Sheet from "@/components/Sheet";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { AppState, SupplyList } from "@/types/list";

interface Props {
  open: boolean;
  onClose: () => void;
  state: AppState;
  onSwitch: (id: string) => void;
  onCreate: (name: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

function relTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const hh = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (sameDay) return `今天 ${hh}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `昨天 ${hh}`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * 清单管理：切换 / 新建 / 重命名 / 复制 / 删除。
 * 手机端为底部抽屉（由 Sheet 提供），桌面端为居中对话框。
 */
export default function ListManager({
  open,
  onClose,
  state,
  onSwitch,
  onCreate,
  onDuplicate,
  onRename,
  onDelete,
}: Props) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [deleting, setDeleting] = useState<SupplyList | null>(null);

  const activeId = state.activeListId;

  const submitCreate = () => {
    onCreate(newName);
    setNewName("");
    setCreating(false);
  };

  const submitRename = () => {
    if (renamingId && renameDraft.trim()) {
      onRename(renamingId, renameDraft);
    }
    setRenamingId(null);
    setRenameDraft("");
  };

  return (
    <Sheet open={open} onClose={onClose} title="清单管理" width="sm:w-[min(480px,92vw)]">
      {/* 快捷操作 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => {
            setCreating(true);
            setNewName("");
          }}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-paper-50 bg-accent hover:bg-accent-hover transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          新建清单
        </button>
        <button
          onClick={() => onDuplicate(activeId)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 border border-line bg-paper-50 hover:bg-paper-200 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          复制当前清单
        </button>
      </div>

      {/* 新建输入 */}
      {creating && (
        <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-paper-100/70">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitCreate();
              if (e.key === "Escape") setCreating(false);
            }}
            placeholder="清单名称，如「周六清单」"
            className="cell-input flex-1 min-w-0 rounded-md border border-line bg-paper-50 px-3 py-2 text-sm"
          />
          <button
            onClick={submitCreate}
            className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-paper-50 bg-accent hover:bg-accent-hover"
          >
            创建
          </button>
          <button
            onClick={() => setCreating(false)}
            className="shrink-0 rounded-md px-3 py-2 text-sm text-ink-500 hover:bg-paper-200"
          >
            取消
          </button>
        </div>
      )}

      {/* 清单列表 */}
      <ul className="space-y-2">
        {state.lists.map((l) => (
          <li
            key={l.id}
            className={
              "rounded-xl border p-3 " +
              (l.id === activeId
                ? "border-accent/50 bg-accent-soft/30"
                : "border-line bg-paper-50 hover:bg-paper-100")
            }
          >
            <div className="w-full text-left">
              {renamingId === l.id ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitRename();
                      if (e.key === "Escape") {
                        setRenamingId(null);
                      }
                    }}
                    className="cell-input flex-1 min-w-0 rounded-md border border-line bg-paper-50 px-2 py-1.5 text-sm"
                  />
                  <button onClick={submitRename} className="shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium text-paper-50 bg-accent">
                    保存
                  </button>
                  <button
                    onClick={() => setRenamingId(null)}
                    className="shrink-0 rounded-md px-2.5 py-1.5 text-xs text-ink-500 hover:bg-paper-200"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onSwitch(l.id);
                    onClose();
                  }}
                  className="w-full flex items-center gap-2"
                >
                  <span className={"flex-1 min-w-0 truncate font-medium " + (l.id === activeId ? "text-ink-900" : "text-ink-700")}>
                    {l.name}
                  </span>
                  {l.id === activeId && (
                    <span className="shrink-0 inline-flex items-center gap-1 text-xs text-accent font-medium">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      使用中
                    </span>
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] text-ink-400 tabular-nums">
                {l.items.length} 条 · {relTime(l.updatedAt)}
              </span>
              <span className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setRenamingId(l.id);
                    setRenameDraft(l.name);
                  }}
                  className="rounded px-1.5 py-0.5 text-xs text-ink-500 hover:text-ink-900 hover:bg-paper-200 transition-colors"
                >
                  重命名
                </button>
                <button
                  onClick={() => onDuplicate(l.id)}
                  className="rounded px-1.5 py-0.5 text-xs text-ink-500 hover:text-ink-900 hover:bg-paper-200 transition-colors"
                >
                  复制
                </button>
                <button
                  onClick={() => setDeleting(l)}
                  className="rounded px-1.5 py-0.5 text-xs text-ink-500 hover:text-danger hover:bg-paper-200 transition-colors"
                >
                  删除
                </button>
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-ink-400 mt-4">
        提示：周六/周日/周一这类相似清单，可先用「复制当前清单」得到副本再修改；删除最后一个清单会被阻止。
      </p>

      <ConfirmDialog
        open={deleting !== null}
        title="删除清单？"
        message={
          <>
            将删除清单「{deleting?.name}」（{deleting?.items.length ?? 0} 条记录），此操作不可恢复。
          </>
        }
        confirmLabel="删除"
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) onDelete(deleting.id);
          setDeleting(null);
        }}
      />
    </Sheet>
  );
}
