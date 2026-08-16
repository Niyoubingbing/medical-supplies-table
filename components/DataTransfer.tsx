"use client";

import { useEffect, useMemo, useState } from "react";
import Sheet from "@/components/Sheet";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { Item } from "@/types/item";
import { FIXED_QTY, FIXED_UNIT } from "@/types/item";
import type { AppState, SupplyList } from "@/types/list";
import { createList } from "@/lib/storage";
import { v4 as uuidv4 } from "uuid";

interface Props {
  open: boolean;
  items: Item[];
  lists: SupplyList[];
  onClose: () => void;
  onImportItems: (items: Item[]) => void;
  onImportBackup: (state: AppState) => void;
}

type Parsed =
  | { kind: "items"; items: Item[] }
  | { kind: "state"; state: AppState };

function str(v: unknown): string {
  return typeof v === "string" ? v : String(v ?? "");
}

function coerceRow(x: unknown): {
  spd: string;
  name: string;
  spec: string;
  remark: string;
  meta?: { patient: string; admissionNo: string; dept: string; doctor: string };
} {
  const o = (x ?? {}) as Record<string, unknown>;
  const m = o.meta && typeof o.meta === "object" ? (o.meta as Record<string, unknown>) : null;
  return {
    spd: str(o.spd),
    name: str(o.name),
    spec: str(o.spec),
    remark: str(o.remark),
    meta: m
      ? {
          patient: str(m.patient),
          admissionNo: str(m.admissionNo),
          dept: str(m.dept),
          doctor: str(m.doctor),
        }
      : undefined,
  };
}

function toExportList(items: Item[]): string {
  const data = items.map((it) => ({
    spd: it.spd,
    name: it.name,
    spec: it.spec,
    remark: it.remark,
    meta: it.meta,
  }));
  return JSON.stringify(data, null, 2);
}

function toExportAll(lists: SupplyList[]): string {
  const data = {
    app: "medical-supplies-table",
    schemaVersion: 2,
    lists: lists.map((l) => ({
      name: l.name,
      items: l.items.map((it) => ({
        spd: it.spd,
        name: it.name,
        spec: it.spec,
        remark: it.remark,
        meta: it.meta,
      })),
    })),
  };
  return JSON.stringify(data, null, 2);
}

export default function DataTransfer({
  open,
  items,
  lists,
  onClose,
  onImportItems,
  onImportBackup,
}: Props) {
  const [mode, setMode] = useState<"list" | "all">("list");
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Parsed | null>(null);

  const exportText = useMemo(
    () => (mode === "list" ? toExportList(items) : toExportAll(lists)),
    [mode, items, lists]
  );

  useEffect(() => {
    if (open) {
      setCopied(false);
      setImportText("");
      setError(null);
      setPending(null);
    }
  }, [open]);

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
      setError("复制失败，请手动选择文本复制。");
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setImportText(text);
      setError(null);
    } catch {
      setError("无法读取剪贴板，请手动粘贴。");
    }
  };

  const tryParse = (): Parsed | null => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(importText);
    } catch {
      setError("文本不是合法的 JSON，请确认已复制完整的导出内容。");
      return null;
    }

    // 旧格式 / 当前清单格式：条目数组
    if (Array.isArray(parsed)) {
      const out: Item[] = parsed.map((x, i) => ({
        id: uuidv4(),
        no: i + 1,
        qty: FIXED_QTY,
        unit: FIXED_UNIT,
        ...coerceRow(x),
      }));
      setError(null);
      return { kind: "items", items: out };
    }

    // 全部清单备份格式
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as Record<string, unknown>).lists)
    ) {
      const raw = parsed as { lists: unknown[] };
      const restored = raw.lists.map((l, i) => {
        const o = (l ?? {}) as Record<string, unknown>;
        const listItems = (Array.isArray(o.items) ? o.items : []).map((x, j) => ({
          id: uuidv4(),
          no: j + 1,
          qty: FIXED_QTY,
          unit: FIXED_UNIT,
          ...coerceRow(x),
        }));
        return createList(
          String(o.name ?? "").trim() || `清单 ${i + 1}`,
          listItems
        );
      });
      if (restored.length === 0) {
        setError("备份中没有清单。");
        return null;
      }
      setError(null);
      return {
        kind: "state",
        state: { schemaVersion: 2, activeListId: restored[0].id, lists: restored },
      };
    }

    setError("无法识别的数据：应为条目数组，或含 lists 的清单备份。");
    return null;
  };

  const handleImportClick = () => {
    const parsed = tryParse();
    if (!parsed) return;
    const hasData = items.length > 0 || lists.some((l) => l.items.length > 0);
    if (hasData) {
      setPending(parsed);
    } else {
      apply(parsed);
    }
  };

  const apply = (parsed: Parsed) => {
    if (parsed.kind === "items") {
      onImportItems(parsed.items);
    } else {
      onImportBackup(parsed.state);
    }
    setPending(null);
    setImportText("");
    setError(null);
    onClose();
  };

  const totalRows = pending
    ? pending.kind === "items"
      ? pending.items.length
      : pending.state.lists.reduce((s, l) => s + l.items.length, 0)
    : 0;
  const pendingListCount =
    pending && pending.kind === "state" ? pending.state.lists.length : 0;
  const pendingItemCount =
    pending && pending.kind === "items" ? pending.items.length : 0;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="数据导入 / 导出"
      width="sm:w-[min(600px,92vw)]"
      footer={
        <button
          onClick={handleImportClick}
          disabled={!importText.trim()}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-paper-50 bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors"
        >
          导入数据
        </button>
      }
    >
      {/* 导出 */}
      <section>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <h3 className="text-sm font-medium text-ink-800">导出（复制到剪贴板）</h3>
          <div className="flex rounded-lg border border-line bg-paper-100 p-0.5 text-xs">
            <button
              onClick={() => setMode("list")}
              className={
                "rounded-md px-2.5 py-1 transition-colors " +
                (mode === "list"
                  ? "bg-paper-50 text-ink-900 shadow-soft font-medium"
                  : "text-ink-500")
              }
            >
              当前清单
            </button>
            <button
              onClick={() => setMode("all")}
              className={
                "rounded-md px-2.5 py-1 transition-colors " +
                (mode === "all"
                  ? "bg-paper-50 text-ink-900 shadow-soft font-medium"
                  : "text-ink-500")
              }
            >
              全部清单备份
            </button>
          </div>
        </div>
        <textarea
          readOnly
          value={exportText}
          className="cell-input w-full rounded-md border border-line bg-paper-100 px-3 py-2 text-[12.5px] text-ink-700 resize-y"
          rows={6}
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px] text-ink-400">
            {mode === "list"
              ? `当前清单 ${items.length} 条，可粘贴到其它设备导入。`
              : `备份全部 ${lists.length} 个清单，可用于换机迁移。`}
          </p>
          <button
            onClick={copyExport}
            className={
              "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium border transition-colors " +
              (copied
                ? "text-accent border-accent/50 bg-accent-soft/40"
                : "text-ink-700 border-line bg-paper-50 hover:bg-paper-200")
            }
          >
            {copied ? "已复制" : "复制到剪贴板"}
          </button>
        </div>
      </section>

      <div className="border-t border-line/60 my-4" />

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
          value={importText}
          onChange={(e) => {
            setImportText(e.target.value);
            setError(null);
          }}
          placeholder='粘贴条目数组，或「全部清单备份」的 JSON'
          className="cell-input w-full rounded-md border border-line bg-paper-50 px-3 py-2 text-[12.5px] text-ink-800 resize-y"
          rows={6}
        />
        {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
        <p className="text-[11px] text-ink-400 mt-1">
          自动识别：条目数组 → 导入到当前清单；含 lists 的备份 → 恢复全部清单（会覆盖现有数据）。
        </p>
      </section>

      {/* 覆盖确认 */}
      <ConfirmDialog
        open={pending !== null}
        title="覆盖现有数据？"
        message={
          pending?.kind === "items" ? (
            <>
              当前清单已有 {items.length} 条记录，导入的 {pendingItemCount} 条将全部替换，此操作不可恢复。
            </>
          ) : (
            <>
              将用备份覆盖全部清单（{pendingListCount} 个清单、
              {totalRows} 条记录），此操作不可恢复。
            </>
          )
        }
        confirmLabel="确认覆盖导入"
        danger
        onCancel={() => setPending(null)}
        onConfirm={() => pending && apply(pending)}
      />
    </Sheet>
  );
}
