"use client";

import { useEffect, useRef, useState } from "react";
import type { Item } from "@/types/item";
import { FIXED_QTY, FIXED_UNIT } from "@/types/item";

interface Props {
  items: Item[];
  onChange: (id: string, patch: Partial<Item>) => void;
  onRemove: (id: string) => void;
  onEdit: (item: Item) => void;
}

export default function TableEditor({
  items,
  onChange,
  onRemove,
  onEdit,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-paper-50 py-16 text-center">
        <p className="text-ink-500 text-base">尚无条目</p>
        <p className="text-ink-400 text-sm mt-1 px-4">
          点击右上角「添加条目」开始录入第一条耗材信息
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop / tablet: keep the original table exactly as before */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-line bg-paper-50 shadow-card">
        <table
          className="w-full border-collapse text-[14.5px]"
          style={{ tableLayout: "fixed" }}
        >
        <colgroup>
          <col style={{ width: "9%" }} />   {/* SPD */}
          <col style={{ width: "5%" }} />    {/* 序号 */}
          <col style={{ width: "15%" }} />   {/* 品名 */}
          <col style={{ width: "29%" }} />   {/* 规格 */}
          <col style={{ width: "7%" }} />    {/* 请购数 */}
          <col style={{ width: "5%" }} />    {/* 单位 */}
          <col style={{ width: "22%" }} />   {/* 备注 */}
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
                required
                className="font-medium text-ink-900"
              />
              <Cell
                value={it.spec}
                onCommit={(v) => onChange(it.id, { spec: v })}
                multiline
                placeholder="未填写"
                required
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
                onCommit={(v) => onChange(it.id, { remark: v })}
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
                    onClick={() => {
                      if (confirm(`确定删除「${it.name || "此条目"}」？`)) {
                        onRemove(it.id);
                      }
                    }}
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

      {/* Mobile: card list (replaces the table below 640px) */}
      <div className="sm:hidden flex flex-col gap-3">
        {items.map((it) => (
          <CardRow
            key={it.id}
            item={it}
            onChange={onChange}
            onRemove={onRemove}
            onEdit={onEdit}
          />
        ))}
      </div>
    </>
  );
}

/* ---------- Mobile card layout (below 640px) ---------- */

function CardRow({
  item,
  onChange,
  onRemove,
  onEdit,
}: {
  item: Item;
  onChange: (id: string, patch: Partial<Item>) => void;
  onRemove: (id: string) => void;
  onEdit: (item: Item) => void;
}) {
  return (
    <div className="rounded-xl border border-line bg-paper-50 shadow-card p-3.5">
      {/* Header: 序号 badge + actions */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center min-w-[1.75rem] h-7 px-2 rounded-full bg-accent text-paper-50 text-sm font-semibold tabular-nums">
            {item.no}
          </span>
          <span className="text-[11px] text-ink-400">序号</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(item)}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-accent border border-accent/40 bg-accent-soft/30 hover:bg-accent-soft/60 transition-colors"
          >
            编辑
          </button>
          <button
            onClick={() => {
              if (confirm(`确定删除「${item.name || "此条目"}」？`)) {
                onRemove(item.id);
              }
            }}
            className="rounded-md px-3 py-1.5 text-xs text-ink-500 hover:text-accent hover:bg-paper-200 transition-colors inline-flex items-center justify-center gap-1"
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
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 gap-2.5">
        <CardField
          label="品名"
          value={item.name}
          onCommit={(v) => onChange(item.id, { name: v })}
          required
          placeholder="未填写"
          className="font-medium"
        />
        <CardField
          label="SPD"
          value={item.spd}
          onCommit={(v) => onChange(item.id, { spd: v })}
          placeholder="—"
        />
        <CardField
          label="规格"
          value={item.spec}
          onCommit={(v) => onChange(item.id, { spec: v })}
          multiline
          required
          placeholder="未填写"
        />
        <div className="grid grid-cols-2 gap-2.5">
          <CardField
            label="请购数"
            value={String(FIXED_QTY)}
            readOnly
          />
          <CardField label="单位" value={FIXED_UNIT} readOnly />
        </div>
        <CardField
          label="备注"
          value={item.remark}
          onCommit={(v) => onChange(item.id, { remark: v })}
          multiline
          placeholder="—"
        />
      </div>
    </div>
  );
}

interface CardFieldProps {
  label: string;
  value: string;
  onCommit?: (v: string) => void;
  readOnly?: boolean;
  multiline?: boolean;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

function CardField({
  label,
  value,
  onCommit,
  readOnly,
  multiline,
  placeholder,
  required,
  className = "",
}: CardFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      const el = ref.current;
      if (!el) return;
      el.focus();
      const len = el.value.length;
      if (el instanceof HTMLInputElement) {
        el.setSelectionRange(len, len);
      } else {
        el.selectionStart = el.selectionEnd = len;
        autoGrow(el);
      }
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (onCommit && draft !== value) onCommit(draft);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const wrapStyle: React.CSSProperties = {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    textWrap: "pretty" as React.CSSProperties["textWrap"],
  };

  if (editing) {
    const base =
      "cell-input w-full bg-paper-50 px-2 py-1.5 rounded-sm border-0 outline-none ring-2 ring-accent text-ink-900 leading-relaxed";
    return (
      <div className="rounded-lg bg-paper-100/70 px-3 py-2">
        <div className="text-[11px] tracking-wide text-ink-400 mb-0.5">
          {label}
        </div>
        {multiline ? (
          <textarea
            ref={ref as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              autoGrow(e.target);
            }}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                commit();
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
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            className={base}
          />
        )}
      </div>
    );
  }

  const empty = !value.trim();
  return (
    <div
      className={
        "rounded-lg bg-paper-100/70 px-3 py-2 " +
        (readOnly ? "" : "cursor-text hover:bg-paper-200/70 transition-colors ")
      }
      style={wrapStyle}
      onClick={() => !readOnly && !editing && setEditing(true)}
      title={!readOnly ? (required && empty ? "必填" : "点击编辑") : undefined}
    >
      <div className="text-[11px] tracking-wide text-ink-400 mb-0.5">
        {label}
      </div>
      {readOnly ? (
        <div className={"text-[14.5px] text-ink-500 tabular-nums " + className} style={wrapStyle}>
          {value}
        </div>
      ) : empty ? (
        <div className={"text-[14.5px] " + className}>
          <span className="text-ink-400 italic">{placeholder ?? "点击填写"}</span>
        </div>
      ) : (
        <div className={"text-[14.5px] text-ink-900 " + className} style={wrapStyle}>
          {value}
        </div>
      )}
    </div>
  );
}

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
  required?: boolean;
  className?: string;
}

function Cell({
  value,
  onCommit,
  readOnly,
  multiline,
  placeholder,
  required,
  className = "",
}: CellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      const el = ref.current;
      if (!el) return;
      el.focus();
      const len = el.value.length;
      if (el instanceof HTMLInputElement) {
        el.setSelectionRange(len, len);
      } else {
        el.selectionStart = el.selectionEnd = len;
        autoGrow(el);
      }
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (onCommit && draft !== value) onCommit(draft);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

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
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                commit();
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
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
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
      title={required && empty ? "必填" : "点击编辑"}
    >
      {empty ? (
        <span className="text-ink-400 italic">{placeholder ?? "点击填写"}</span>
      ) : (
        <span>{value}</span>
      )}
    </td>
  );
}

function autoGrow(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}
