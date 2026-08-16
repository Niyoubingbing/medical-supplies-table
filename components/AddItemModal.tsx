"use client";

import { useEffect, useRef, useState } from "react";
import Sheet from "@/components/Sheet";
import RemarkEditor from "@/components/RemarkEditor";
import type { Item, RemarkMeta } from "@/types/item";
import { FIXED_QTY, FIXED_UNIT, joinRemark, isEmptyMeta, splitSpd, toggleSpd } from "@/types/item";
import type { Presets } from "@/lib/presets";

interface Props {
  open: boolean;
  initial?: Partial<Item> | null;
  nextNo: number;
  presets: Presets;
  onClose: () => void;
  onSave: (data: {
    spd: string;
    no: number;
    name: string;
    spec: string;
    remark: string;
    meta?: RemarkMeta;
  }) => void;
  onOpenSupplier?: () => void;
}

export default function AddItemModal({
  open,
  initial,
  nextNo,
  presets,
  onClose,
  onSave,
  onOpenSupplier,
}: Props) {
  const [spd, setSpd] = useState("");
  const [name, setName] = useState("");
  const [spec, setSpec] = useState("");
  const [meta, setMeta] = useState<RemarkMeta>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSpd(initial?.spd ?? "");
      setName(initial?.name ?? "");
      setSpec(initial?.spec ?? "");
      setMeta(initial?.meta ?? {});
      // 抽屉动画结束后聚焦品名
      setTimeout(() => nameRef.current?.focus(), 60);
    }
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      spd: spd.trim(),
      no: initial?.no ?? nextNo,
      name: name.trim(),
      spec: spec.trim(),
      remark: joinRemark(meta),
      meta: isEmptyMeta(meta) ? undefined : meta,
    });
    onClose();
  };

  const isEdit = Boolean(initial?.id);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? "编辑条目" : "添加条目"}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-ink-700 hover:bg-paper-200 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            form="add-item-form"
            className="rounded-md px-5 py-2 text-sm font-medium text-paper-50 bg-accent hover:bg-accent-hover transition-colors shadow-soft"
          >
            {isEdit ? "保存修改" : "添加到列表"}
          </button>
        </div>
      }
    >
      <form id="add-item-form" onSubmit={handleSubmit}>
        <p className="text-[11px] text-ink-400 mb-3">
          请购数与单位固定为「{FIXED_QTY} {FIXED_UNIT}」，品名/规格可留空。
        </p>

        {onOpenSupplier && (
          <button
            type="button"
            onClick={onOpenSupplier}
            className="mb-4 inline-flex items-center gap-1.5 rounded-md border border-line bg-paper-50 px-3 py-1.5 text-sm text-ink-700 hover:bg-paper-200 transition-colors"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            打开供货目录参考
          </button>
        )}

        <div className="space-y-3">
          <Field label="品名">
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如 冠龙PVP器械（可留空）"
              className="cell-input w-full rounded-md border border-line bg-paper-50 px-3 py-2 text-ink-800"
            />
          </Field>
          <Field label="SPD（可多选）">
            <input
              value={spd}
              onChange={(e) => setSpd(e.target.value)}
              placeholder="输入，或点下方快捷项多选（，分隔）"
              className="cell-input w-full rounded-md border border-line bg-paper-50 px-3 py-2 text-ink-800"
            />
            {presets.spds.length > 0 && (
              <span className="flex flex-wrap gap-1.5 mt-1.5">
                {presets.spds.map((c) => {
                  const active = splitSpd(spd).includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSpd(toggleSpd(spd, c))}
                      className={
                        "rounded-full border px-2.5 py-1 text-xs transition-colors " +
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
            )}
          </Field>
          <Field label="规格">
            <textarea
              value={spec}
              onChange={(e) => setSpec(e.target.value)}
              rows={2}
              placeholder="如 经皮L3、L4、L5椎体成形术（可留空）"
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

          {/* 结构化备注 */}
          <div className="border-t border-line/60 pt-3">
            <p className="text-xs font-medium text-ink-600 mb-2 tracking-wide">
              备注（病人 / 住院号 / 科室 / 医生）
            </p>
            <RemarkEditor value={meta} onChange={setMeta} presets={presets} />
          </div>
        </div>
      </form>
    </Sheet>
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