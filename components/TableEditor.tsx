"use client";

import { useEffect, useRef, useState } from "react";
import type { Item } from "@/types/item";
import { FIXED_QTY, FIXED_UNIT } from "@/types/item";

interface Props {
  items: Item[];
  onChange: (id: string, patch: Partial<Item>) => void;
  onRemove: (id: string) => void;
}

export default function TableEditor({ items, onChange, onRemove }: Props) {
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
    <div className="overflow-x-auto rounded-xl border border-line bg-paper-50 shadow-card">
      <table
        className="w-full border-collapse text-[12.5px] sm:text-[14.5px]"
        style={{ tableLayout: "fixed" }}
      >
        <colgroup>
          <col style={{ width: "9%" }} />   {/* SPD */}
          <col style={{ width: "5%" }} />    {/* 序号 */}
          <col style={{ width: "16%" }} />   {/* 品名 */}
          <col style={{ width: "30%" }} />   {/* 规格 */}
          <col style={{ width: "7%" }} />    {/* 请购数 */}
          <col style={{ width: "5%" }} />    {/* 单位 */}
          <col style={{ width: "23%" }} />   {/* 备注 */}
          <col style={{ width: "5%" }} />    {/* × */}
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
            <Th className="!text-center">×</Th>
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
              <td className="px-1 py-2 text-center align-top">
                <button
                  onClick={() => {
                    if (confirm(`确定删除「${it.name || "此条目"}」？`)) {
                      onRemove(it.id);
                    }
                  }}
                  className="text-ink-400 hover:text-accent transition-colors leading-none p-1 inline-flex"
                  title="删除该条"
                  aria-label="删除"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
        "px-2 py-2 sm:px-3 sm:py-2.5 text-left font-semibold tracking-wide text-[11.5px] sm:text-[13px] " +
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
      <td
        className={
          "px-2 py-2 sm:px-3 sm:py-2.5 align-top " + className
        }
        style={wrapStyle}
      >
        {value}
      </td>
    );
  }

  if (editing) {
    const base =
      "w-full bg-paper-50 px-2 py-1.5 rounded-sm border-0 outline-none ring-2 ring-accent text-ink-900 leading-relaxed";
    return (
      <td className="px-1 py-1 align-top">
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
      className={
        "px-2 py-2 sm:px-3 sm:py-2.5 align-top cursor-text " + className
      }
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
