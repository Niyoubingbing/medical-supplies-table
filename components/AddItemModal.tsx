"use client";

import { useEffect, useRef, useState } from "react";
import type { Item } from "@/types/item";
import { FIXED_QTY, FIXED_UNIT } from "@/types/item";

interface Props {
  open: boolean;
  initial?: Partial<Item> | null;
  nextNo: number;
  onClose: () => void;
  onSave: (data: Omit<Item, "id" | "no" | "qty" | "unit"> & { no: number }) => void;
}

export default function AddItemModal({
  open,
  initial,
  nextNo,
  onClose,
  onSave,
}: Props) {
  const [spd, setSpd] = useState("");
  const [name, setName] = useState("");
  const [spec, setSpec] = useState("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSpd(initial?.spd ?? "");
      setName(initial?.name ?? "");
      setSpec(initial?.spec ?? "");
      setRemark(initial?.remark ?? "");
      setError(null);
      // Focus name field on open
      setTimeout(() => nameRef.current?.focus(), 30);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("品名不能为空");
      return;
    }
    if (!spec.trim()) {
      setError("规格不能为空");
      return;
    }
    onSave({
      spd: spd.trim(),
      no: initial?.no ?? nextNo,
      name: name.trim(),
      spec: spec.trim(),
      remark: remark.trim(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="relative w-[min(560px,92vw)] rounded-2xl bg-paper-50 shadow-card border border-line/60 p-7"
        style={{ fontFamily: "inherit" }}
      >
        <h2
          className="text-[22px] font-semibold text-ink-900 tracking-tight"
          style={{ letterSpacing: "0.01em" }}
        >
          {initial?.id ? "编辑条目" : "添加条目"}
        </h2>
        <p className="text-sm text-ink-500 mt-1 mb-5">
          请购数与单位已固定为「{FIXED_QTY} {FIXED_UNIT}」，无需填写。
        </p>

        <div className="space-y-3">
          <Field label="SPD">
            <input
              value={spd}
              onChange={(e) => setSpd(e.target.value)}
              placeholder="如 SPD-2026-001（可留空）"
              className="cell-input w-full rounded-md border border-line bg-paper-50 px-3 py-2 text-ink-800"
            />
          </Field>
          <Field label="品名" required>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如 冠龙PVP器械"
              className="cell-input w-full rounded-md border border-line bg-paper-50 px-3 py-2 text-ink-800"
            />
          </Field>
          <Field label="规格" required>
            <textarea
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              rows={2}
              placeholder="如 经皮L3、L4、L5椎体成形术"
              className="cell-input w-full rounded-md border border-line bg-paper-50 px-3 py-2 text-ink-800 resize-y"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="请购数">
              <input
                value={FIXED_QTY}
                readOnly
                className="cell-input cell-input--readonly w-full rounded-md border border-line bg-paper-100 px-3 py-2"
              />
            </Field>
            <Field label="单位">
              <input
                value={FIXED_UNIT}
                readOnly
                className="cell-input cell-input--readonly w-full rounded-md border border-line bg-paper-100 px-3 py-2"
              />
            </Field>
          </div>
          <Field label="备注">
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={2}
              placeholder="如 许惠刁、565214、骨三王伟豪"
              className="cell-input w-full rounded-md border border-line bg-paper-50 px-3 py-2 text-ink-800 resize-y"
            />
          </Field>
        </div>

        {error && (
          <p className="mt-3 text-sm text-accent">{error}</p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-ink-700 hover:bg-paper-200 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            className="rounded-md px-4 py-2 text-sm font-medium text-paper-50 bg-accent hover:bg-accent-hover transition-colors shadow-soft"
          >
            {initial?.id ? "保存修改" : "添加到列表"}
          </button>
        </div>
      </form>
    </div>
  );
}

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
    <label className="block">
      <span className="block text-xs font-medium text-ink-600 mb-1 tracking-wide">
        {label}
        {required && <span className="text-accent ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
