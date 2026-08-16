"use client";

import type { RemarkMeta } from "@/types/item";
import type { Presets } from "@/lib/presets";

interface Props {
  value: RemarkMeta;
  onChange: (v: RemarkMeta) => void;
  presets: Presets;
}

/**
 * 结构化备注编辑器：
 * 病人名字 / 住院号（自由输入）+ 预设科室 / 预设主治医生（输入框 + 预设 chips 快捷填入）。
 */
export default function RemarkEditor({ value, onChange, presets }: Props) {
  const set = (k: keyof RemarkMeta, v: string) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="病人名字"
          value={value.patient ?? ""}
          onChange={(v) => set("patient", v)}
          placeholder="如 张三丰"
        />
        <Field
          label="住院号"
          value={value.admissionNo ?? ""}
          onChange={(v) => set("admissionNo", v)}
          placeholder="如 123456"
        />
      </div>
      <Field
        label="预设科室"
        value={value.dept ?? ""}
        onChange={(v) => set("dept", v)}
        placeholder="点下方快捷选择，或手动输入"
        chips={presets.depts}
      />
      <Field
        label="预设主治医生"
        value={value.doctor ?? ""}
        onChange={(v) => set("doctor", v)}
        placeholder="点下方快捷选择，或手动输入"
        chips={presets.doctors}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  chips,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  chips?: string[];
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-ink-600 mb-1 tracking-wide">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="cell-input w-full rounded-md border border-line bg-paper-50 px-3 py-2 text-ink-800"
      />
      {chips && chips.length > 0 && (
        <span className="flex flex-wrap gap-1.5 mt-1.5">
          {chips.map((c) => {
            const active = value.trim() === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => onChange(active ? "" : c)}
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
    </label>
  );
}
