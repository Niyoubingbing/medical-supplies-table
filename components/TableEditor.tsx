"use client";

import { useEffect, useRef, useState } from "react";
import type { Item, RemarkMeta } from "@/types/item";
import { FIXED_QTY, FIXED_UNIT, splitSpd, toggleSpd } from "@/types/item";
import type { Presets } from "@/lib/presets";

interface Props {
  items: Item[];
  onChange: (id: string, patch: Partial<Item>) => void;
  /** 请求删除（由页面统一弹出确认对话框） */
  onRemoveRequest: (item: Item) => void;
  onEdit: (item: Item) => void;
  /** 请求编辑结构化备注（由页面打开备注抽屉） */
  onEditRemark: (item: Item) => void;
  presets: Presets;
  onEmptyAdd?: () => void;
  onEmptyCopy?: () => void;
}

export default function TableEditor({
  items,
  onChange,
  onRemoveRequest,
  onEdit,
  onEditRemark,
  presets,
  onEmptyAdd,
  onEmptyCopy,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-paper-50 py-14 px-6 text-center">
        <svg
          width="42"
          height="42"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-ink-300 mx-auto mb-3"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="13" y2="17" />
        </svg>
        <p className="text-ink-600 text-base">本清单还没有条目</p>
        <p className="text-ink-400 text-sm mt-1">
          点击「添加条目」录入第一条；也可以复制其它清单作为模板。
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {onEmptyAdd && (
            <button
              onClick={onEmptyAdd}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-paper-50 bg-accent hover:bg-accent-hover transition-colors"
            >
              添加第一条
            </button>
          )}
          {onEmptyCopy && (
            <button
              onClick={onEmptyCopy}
              className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium text-ink-700 border border-line bg-paper-50 hover:bg-paper-200 transition-colors"
            >
              从其它清单复制
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop / tablet: original table (unchanged) */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-line bg-paper-50 shadow-card">
        <table
          className="w-full border-collapse text-[14.5px]"
          style={{ tableLayout: "fixed" }}
        >
        <colgroup>
          <col style={{ width: "9%" }} />   {/* SPD */}
          <col style={{ width: "5%" }} />    {/* 序号 */}
          <col style={{ width: "16%" }} />   {/* 品名 */}
          <col style={{ width: "30%" }} />   {/* 规格 */}
          <col style={{ width: "5%" }} />    {/* 请购数 */}
          <col style={{ width: "4%" }} />    {/* 单位 */}
          <col style={{ width: "23%" }} />   {/* 备注 */}
          <col style={{ width: "8%" }} />    {/* 操作 */}
        </colgroup>
        <thead>
          <tr className="bg-paper-200/80 text-ink-700 sticky top-0 z-10">
            <Th>SPD</Th>
            <Th className="!text-center">序号</Th>
            <Th>品名</Th>
            <Th>规格</Th>
            <Th className="!text-center">请购数</Th>
            <Th className="!text-center">单位</Th>
            <Th>备注</Th>
            <Th className="!text-center">操作</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, idx) => (
            <tr
              key={it.id}
              className={
                "border-t border-line/70 align-top " +
                (idx % 2 === 1 ? "bg-paper-100/40 " : "bg-paper-50 ") +
                "hover:bg-accent-soft/30 transition-colors"
              }
            >
              <Cell
                value={it.spd}
                onCommit={(v) => onChange(it.id, { spd: v })}
                placeholder="—"
              />
              <Cell
                value={String(it.no)}
                readOnly
                className="text-ink-500 tabular-nums text-center font-medium"
              />
              <Cell
                value={it.name}
                onCommit={(v) => onChange(it.id, { name: v })}
                placeholder="未填写"
                className="font-medium text-ink-900"
              />
              <Cell
                value={it.spec}
                onCommit={(v) => onChange(it.id, { spec: v })}
                multiline
                placeholder="未填写"
              />
              <Cell
                value={String(FIXED_QTY)}
                readOnly
                className="text-ink-500 tabular-nums text-center"
              />
              <Cell
                value={FIXED_UNIT}
                readOnly
                className="text-ink-500 text-center"
              />
              <Cell
                value={it.remark}
                onCommit={(v) => onChange(it.id, { remark: v, meta: undefined })}
                multiline
                placeholder="—"
              />
              <td className="px-1 py-2 align-top">
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => onEdit(it)}
                    className="w-full rounded-md px-2 py-2 text-xs sm:text-sm font-medium text-accent border border-accent/40 bg-accent-soft/30 hover:bg-accent-soft/60 transition-colors"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => onRemoveRequest(it)}
                    className="w-full rounded-md px-2 py-2 text-xs sm:text-sm text-ink-500 hover:text-accent hover:bg-paper-200 transition-colors inline-flex items-center justify-center gap-1"
                    title="删除该条"
                    aria-label="删除"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    删除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {/* Mobile: compact card list (<640px) */}
      <div className="sm:hidden flex flex-col gap-2">
        {items.map((it) => (
          <CardRow
            key={it.id}
            item={it}
            onChange={onChange}
            onRemoveRequest={onRemoveRequest}
            onEdit={onEdit}
            onEditRemark={onEditRemark}
            presets={presets}
          />
        ))}
      </div>
    </>
  );
}

/* ---------- 行内编辑公共逻辑 ---------- */

function useInlineEdit(value: string) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    return draft;
  };
  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };
  return { editing, draft, setDraft, setEditing, commit, cancel };
}

function focusAndSelect(el: HTMLInputElement | HTMLTextAreaElement) {
  el.focus();
  const len = el.value.length;
  if (el instanceof HTMLInputElement) {
    el.setSelectionRange(len, len);
  } else {
    el.selectionStart = el.selectionEnd = len;
  }
}

function autoGrow(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

/* ---------- Mobile card layout (<640px) ---------- */

function CardRow({
  item,
  onChange,
  onRemoveRequest,
  onEdit,
  onEditRemark,
  presets,
}: {
  item: Item;
  onChange: (id: string, patch: Partial<Item>) => void;
  onRemoveRequest: (item: Item) => void;
  onEdit: (item: Item) => void;
  onEditRemark: (item: Item) => void;
  presets: Presets;
}) {
  return (
    <div className="rounded-xl border border-line bg-paper-50 shadow-card overflow-hidden">
      {/* 卡片头：序号 + 品名/SPD */}
      <div className="flex items-start gap-2 px-3 pt-2 pb-0.5">
        <span className="shrink-0 mt-0.5 inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-accent text-paper-50 text-xs font-semibold tabular-nums">
          {item.no}
        </span>
        <div className="flex-1 min-w-0">
          <TitleField
            value={item.name}
            onCommit={(v) => onChange(item.id, { name: v })}
          />
          <SpdField
            value={item.spd}
            onCommit={(v) => onChange(item.id, { spd: v })}
            presets={presets}
          />
        </div>
      </div>

      {/* 规格：标签与内容同行，紧凑 */}
      <div className="px-3 pb-1">
        <CardField
          label="规格"
          value={item.spec}
          onCommit={(v) => onChange(item.id, { spec: v })}
          placeholder="点击填写规格"
        />
      </div>

      {/* 备注：结构化展示（两行两列），点击进入抽屉编辑 */}
      <div className="px-3 pb-1">
        <RemarkField item={item} onEdit={() => onEditRemark(item)} />
      </div>

      {/* 操作行（左侧） */}
      <div className="flex items-center gap-1 px-3 pt-0.5 pb-2">
        <button
          onClick={() => onEdit(item)}
          className="h-7 px-2.5 inline-flex items-center rounded-md text-[11px] font-medium text-accent border border-accent/40 bg-accent-soft/30 hover:bg-accent-soft/60 active:scale-95 transition-all"
        >
          编辑
        </button>
        <button
          onClick={() => onRemoveRequest(item)}
          className="h-7 px-2.5 inline-flex items-center rounded-md text-[11px] text-ink-500 hover:text-danger hover:bg-paper-200 active:scale-95 transition-all"
          title="删除该条"
          aria-label="删除"
        >
          删除
        </button>
      </div>
    </div>
  );
}

/* 品名：卡片标题（点击编辑，多行文本编辑，无边框无背景跳变） */
function TitleField({
  value,
  onCommit,
}: {
  value: string;
  onCommit?: (v: string) => void;
}) {
  const { editing, draft, setDraft, setEditing, commit, cancel } =
    useInlineEdit(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      focusAndSelect(ref.current);
      autoGrow(ref.current);
    }
  }, [editing]);

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          autoGrow(e.target);
        }}
        onBlur={() => {
          const v = commit();
          if (onCommit && v !== value) onCommit(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const v = commit();
            if (onCommit && v !== value) onCommit(v);
          } else if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          }
        }}
        rows={1}
        className="inline-input w-full min-h-[30px] pb-0.5 border-b border-accent/70 text-[16px] font-semibold text-ink-900 leading-snug"
        placeholder="未填写品名"
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="w-full text-left min-h-[30px] pb-0.5 border-b border-line/60 flex items-start"
      title="点击编辑品名"
    >
      <span className="min-w-0 flex-1">
        {value.trim() ? (
          <span className="block text-[16px] font-semibold text-ink-900 leading-snug break-words whitespace-pre-wrap">
            {value}
          </span>
        ) : (
          <span className="block text-[16px] text-ink-400 italic leading-snug">
            未填写品名
          </span>
        )}
      </span>
    </button>
  );
}

/* SPD：卡片头副行（点击编辑，标签保持显示，无边框跳变） */
function SpdField({
  value,
  onCommit,
  presets,
}: {
  value: string;
  onCommit?: (v: string) => void;
  presets: Presets;
}) {
  const { editing, draft, setDraft, setEditing, commit, cancel } =
    useInlineEdit(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && ref.current) focusAndSelect(ref.current);
  }, [editing]);

  if (editing) {
    return (
      <div className="w-full min-h-[24px] pb-0.5 border-b border-accent/70">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] tracking-wider text-ink-400 shrink-0">
            SPD
          </span>
          <input
            ref={ref}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              const v = commit();
              if (onCommit && v !== value) onCommit(v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const v = commit();
                if (onCommit && v !== value) onCommit(v);
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            className="inline-input flex-1 min-w-0 text-[12px] text-ink-600"
            placeholder="可多选（，分隔）"
          />
        </div>
        {presets.spds.length > 0 ? (
          <span className="flex flex-wrap gap-1.5 mt-1.5 mb-1">
            {presets.spds.map((c) => {
              const active = splitSpd(draft).includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setDraft(toggleSpd(draft, c))}
                  className={
                    "rounded-full border px-2.5 py-1 text-[11.5px] transition-colors " +
                    (active
                      ? "border-accent bg-accent text-paper-50 font-medium"
                      : "border-line bg-paper-50 text-ink-700 hover:bg-paper-200")
                  }
                >
                  {c}
                </button>
              );
            })}
          </span>
        ) : (
          <p className="text-[10px] text-ink-400 mt-1.5 mb-0.5">
            暂无 SPD 快捷项，可在「预设管理」中新增
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="w-full text-left min-h-[24px] pb-0.5 border-b border-line/40 flex items-center gap-1.5"
      title="点击编辑 SPD"
    >
      <span className="text-[10px] tracking-wider text-ink-400 shrink-0">SPD</span>
      <span className="min-w-0 flex-1 truncate text-[12px] text-ink-600">
        {value.trim() || <span className="text-ink-400 italic">—</span>}
      </span>
    </button>
  );
}

/* 规格：标签与内容同行的紧凑字段块（点击编辑，无边框跳变） */
function CardField({
  label,
  value,
  onCommit,
  placeholder,
}: {
  label: string;
  value: string;
  onCommit?: (v: string) => void;
  placeholder?: string;
}) {
  const { editing, draft, setDraft, setEditing, commit, cancel } =
    useInlineEdit(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      focusAndSelect(ref.current);
      autoGrow(ref.current);
    }
  }, [editing]);

  if (editing) {
    return (
      <div className="w-full rounded-lg bg-paper-100/70 px-2.5 py-1.5 min-h-[34px] flex items-start">
        <span className="text-[10px] tracking-wider text-ink-400 shrink-0 mr-1.5 mt-[3px]">
          {label}
        </span>
        <textarea
          ref={ref}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            autoGrow(e.target);
          }}
          onBlur={() => {
            const v = commit();
            if (onCommit && v !== value) onCommit(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              const v = commit();
              if (onCommit && v !== value) onCommit(v);
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          rows={1}
          className="inline-input flex-1 min-w-0 text-[13.5px] text-ink-900 leading-relaxed"
          placeholder={placeholder ?? "点击填写"}
        />
      </div>
    );
  }

  const empty = !value.trim();
  return (
    <button
      onClick={() => setEditing(true)}
      className="w-full text-left rounded-lg bg-paper-100/70 hover:bg-paper-200/60 active:bg-paper-200 transition-colors px-2.5 py-1.5 min-h-[34px] flex items-start"
      title={empty ? `点击填写${label}` : `点击编辑${label}`}
    >
      <span className="text-[10px] tracking-wider text-ink-400 shrink-0 mr-1.5 mt-[3px]">
        {label}
      </span>
      {empty ? (
        <span className="block text-[13.5px] text-ink-400 italic leading-relaxed">
          {placeholder ?? "点击填写"}
        </span>
      ) : (
        <span className="block text-[13.5px] text-ink-900 leading-relaxed break-words whitespace-pre-wrap">
          {value}
        </span>
      )}
    </button>
  );
}

/* 备注：结构化展示（病人/住院号/科室/医生 两行两列），点击进入抽屉编辑 */
function RemarkField({ item, onEdit }: { item: Item; onEdit: () => void }) {
  const meta: RemarkMeta = item.meta ?? {};
  const hasMeta =
    Boolean(meta.patient?.trim()) ||
    Boolean(meta.admissionNo?.trim()) ||
    Boolean(meta.dept?.trim()) ||
    Boolean(meta.doctor?.trim());

  return (
    <button
      onClick={onEdit}
      className="w-full text-left rounded-lg bg-paper-100/70 hover:bg-paper-200/60 active:bg-paper-200 transition-colors px-2.5 py-1.5"
      title="点击编辑备注"
    >
      <span className="block text-[10px] tracking-wider text-ink-400 mb-0.5">
        备注
      </span>
      {hasMeta ? (
        <span className="grid grid-cols-2 gap-x-3 gap-y-0.5">
          <MetaCell label="病人" value={meta.patient} />
          <MetaCell label="住院号" value={meta.admissionNo} />
          <MetaCell label="科室" value={meta.dept} />
          <MetaCell label="医生" value={meta.doctor} />
        </span>
      ) : item.remark.trim() ? (
        <span className="block text-[13.5px] text-ink-900 leading-relaxed break-words whitespace-pre-wrap">
          {item.remark}
        </span>
      ) : (
        <span className="block text-[13.5px] text-ink-400 italic leading-relaxed">
          点击填写备注（病人/住院号/科室/医生）
        </span>
      )}
    </button>
  );
}

function MetaCell({ label, value }: { label: string; value?: string }) {
  return (
    <span className="min-w-0 flex items-baseline">
      <span className="text-[10px] text-ink-400 shrink-0 mr-1">{label}</span>
      <span className="text-[13px] text-ink-900 break-words min-w-0">
        {value?.trim() ? value.trim() : <span className="text-ink-400 italic">—</span>}
      </span>
    </span>
  );
}

/* ---------- Desktop cell (unchanged behavior) ---------- */

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={
        "px-2 py-3 sm:px-3 sm:py-2.5 text-left font-semibold tracking-wide text-[12px] sm:text-[13px] " +
        className
      }
      style={{ letterSpacing: "0.04em" }}
    >
      {children}
    </th>
  );
}

interface CellProps {
  value: string;
  onCommit?: (v: string) => void;
  readOnly?: boolean;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}

function Cell({
  value,
  onCommit,
  readOnly,
  multiline,
  placeholder,
  className = "",
}: CellProps) {
  const { editing, draft, setDraft, setEditing, commit, cancel } =
    useInlineEdit(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      const el = ref.current;
      focusAndSelect(el);
      if (el instanceof HTMLTextAreaElement) autoGrow(el);
    }
  }, [editing]);

  const wrapStyle: React.CSSProperties = {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    textWrap: "pretty" as React.CSSProperties["textWrap"],
  };

  if (readOnly) {
    return (
      <td className={"px-2 py-3 sm:px-3 sm:py-2.5 align-top " + className} style={wrapStyle}>
        {value}
      </td>
    );
  }

  if (editing) {
    const base =
      "w-full bg-paper-50 px-2 py-1.5 rounded-sm border-0 outline-none ring-2 ring-accent text-ink-900 leading-relaxed";
    return (
      <td className="px-1 py-1.5 align-top">
        {multiline ? (
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              autoGrow(e.target);
            }}
            onBlur={() => {
              const v = commit();
              if (onCommit && v !== value) onCommit(v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                const v = commit();
                if (onCommit && v !== value) onCommit(v);
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            rows={2}
            className={base + " resize-y min-h-[2.6em]"}
          />
        ) : (
          <input
            ref={ref as React.RefObject<HTMLInputElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              const v = commit();
              if (onCommit && v !== value) onCommit(v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const v = commit();
                if (onCommit && v !== value) onCommit(v);
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            className={base}
          />
        )}
      </td>
    );
  }

  const empty = !value.trim();
  return (
    <td
      className={"px-2 py-3 sm:px-3 sm:py-2.5 align-top cursor-text " + className}
      style={wrapStyle}
      onClick={() => setEditing(true)}
      title={placeholder && empty ? placeholder : "点击编辑"}
    >
      {empty ? (
        <span className="text-ink-400 italic">{placeholder ?? "点击填写"}</span>
      ) : (
        <span>{value}</span>
      )}
    </td>
  );
}