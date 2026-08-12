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
      <div className="rounded-2xl border border-dashed border-line bg-paper-50 py-16 text-center">
        <p className="text-ink-500 text-base">尚无条目</p>
        <p className="text-ink-400 text-sm mt-1 px-4">
          点击右上角「添加条目」开始录入第一条耗材信息
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {items.map((it) => (
        <ItemCard key={it.id} item={it} onChange={onChange} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ItemCard({
  item,
  onChange,
  onRemove,
}: {
  item: Item;
  onChange: (id: string, patch: Partial<Item>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <article className="group relative rounded-2xl bg-paper-50 border border-line/70 shadow-card p-4 sm:p-5 hover:border-accent/40 transition-colors">
      {/* Header row: 序号 + 品名 + delete */}
      <header className="flex items-start gap-3 mb-3">
        <span
          className="shrink-0 inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2 rounded-md bg-ink-800 text-paper-50 font-semibold tabular-nums text-sm"
          aria-label="序号"
        >
          #{item.no}
        </span>
        <div className="flex-1 min-w-0">
          <Cell
            value={item.name}
            onCommit={(v) => onChange(item.id, { name: v })}
            multiline
            placeholder="未填写品名"
            required
            variant="title"
          />
        </div>
        <button
          onClick={() => {
            if (confirm(`确定删除「${item.name || "此条目"}」？`)) {
              onRemove(item.id);
            }
          }}
          className="shrink-0 text-ink-400 hover:text-accent transition-colors leading-none p-1 -mr-1"
          title="删除该条"
          aria-label="删除"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </header>

      {/* 规格 block */}
      <Field label="规格" required>
        <Cell
          value={item.spec}
          onCommit={(v) => onChange(item.id, { spec: v })}
          multiline
          placeholder="未填写"
          required
          variant="block"
        />
      </Field>

      {/* 备注 block */}
      <Field label="备注">
        <Cell
          value={item.remark}
          onCommit={(v) => onChange(item.id, { remark: v })}
          multiline
          placeholder="—"
          variant="block-muted"
        />
      </Field>

      {/* Footer chips: SPD + 请购数 + 单位 */}
      <footer className="mt-3 pt-3 border-t border-line/60 flex flex-wrap items-center gap-2">
        <Chip label="SPD">
          <Cell
            value={item.spd}
            onCommit={(v) => onChange(item.id, { spd: v })}
            placeholder="—"
            variant="inline-tiny"
          />
        </Chip>
        <Chip label="请购数">
          <span className="tabular-nums">{FIXED_QTY}</span>
        </Chip>
        <Chip label="单位">{FIXED_UNIT}</Chip>
      </footer>
    </article>
  );
}

/* ---------- Sub-components ---------- */

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2.5">
      <div className="text-[11px] font-medium text-ink-500 tracking-widest uppercase mb-1">
        {label}
        {required && <span className="text-accent ml-0.5">*</span>}
      </div>
      {children}
    </div>
  );
}

function Chip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-paper-200/70 px-2.5 py-1 text-[12px] text-ink-700">
      <span className="text-ink-500 font-medium">{label}</span>
      <span className="text-ink-800">{children}</span>
    </span>
  );
}

type CellVariant =
  | "title"     // 品名（大字号、加粗）
  | "block"     // 规格（多行，浅色 chip 背景）
  | "block-muted" // 备注（多行，更浅背景）
  | "inline-tiny"; // chip 内小字（SPD）

interface CellProps {
  value: string;
  onCommit?: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
  required?: boolean;
  variant?: CellVariant;
}

function Cell({
  value,
  onCommit,
  multiline,
  placeholder,
  required,
  variant = "block",
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
        // auto-grow
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

  if (editing) {
    const baseClass = variantClass(variant, true);
    if (multiline) {
      return (
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
          className={baseClass}
        />
      );
    }
    return (
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
        className={baseClass}
      />
    );
  }

  const empty = !value.trim();
  const displayClass = variantClass(variant, false);

  if (empty) {
    return (
      <div
        onClick={() => setEditing(true)}
        className={displayClass + " cursor-text italic text-ink-400"}
        title={required ? "必填" : "点击编辑"}
      >
        {placeholder ?? "点击填写"}
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={displayClass + " cursor-text whitespace-pre-wrap break-words"}
      style={{ textWrap: "pretty" as React.CSSProperties["textWrap"] }}
      title="点击编辑"
    >
      {value}
    </div>
  );
}

function variantClass(variant: CellVariant, editing: boolean): string {
  const base = "w-full rounded-md transition-colors";
  const editRing = "ring-2 ring-accent bg-paper-50 px-3 py-1.5 outline-none border-0 text-ink-900";
  switch (variant) {
    case "title":
      return editing
        ? base + " " + editRing + " text-[17px] font-semibold leading-snug"
        : "text-[17px] font-semibold leading-snug text-ink-900 py-0.5";
    case "block":
      return editing
        ? base + " " + editRing + " text-[14.5px] leading-relaxed min-h-[3em] resize-y"
        : "text-[14.5px] leading-relaxed text-ink-800 px-3 py-2 bg-paper-200/40 rounded-md min-h-[2.4em]";
    case "block-muted":
      return editing
        ? base + " " + editRing + " text-[13.5px] leading-relaxed min-h-[3em] resize-y"
        : "text-[13.5px] leading-relaxed text-ink-600 px-3 py-2 bg-paper-200/20 rounded-md min-h-[2.4em]";
    case "inline-tiny":
      return editing
        ? base + " ring-2 ring-accent bg-paper-50 px-1.5 py-0.5 outline-none border-0 text-[12px] text-ink-900 max-w-[10rem]"
        : "text-[12px] text-ink-800";
  }
}

function autoGrow(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}
