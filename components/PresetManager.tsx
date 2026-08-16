"use client";

import { useEffect, useState } from "react";
import Sheet from "@/components/Sheet";
import type { Presets } from "@/lib/presets";

interface Props {
  open: boolean;
  presets: Presets;
  onClose: () => void;
  onSave: (p: Presets) => void;
}

/** 预设管理：增删「科室」与「主治医生」快捷选项。 */
export default function PresetManager({ open, presets, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<Presets>(presets);
  const [newSpd, setNewSpd] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newDoctor, setNewDoctor] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(presets);
      setNewSpd("");
      setNewDept("");
      setNewDoctor("");
    }
  }, [open, presets]);

  const addSpd = () => {
    const v = newSpd.trim();
    if (!v || draft.spds.includes(v)) return;
    setDraft((d) => ({ ...d, spds: [...d.spds, v] }));
    setNewSpd("");
  };

  const addDept = () => {
    const v = newDept.trim();
    if (!v || draft.depts.includes(v)) return;
    setDraft((d) => ({ ...d, depts: [...d.depts, v] }));
    setNewDept("");
  };
  const addDoctor = () => {
    const v = newDoctor.trim();
    if (!v || draft.doctors.includes(v)) return;
    setDraft((d) => ({ ...d, doctors: [...d.doctors, v] }));
    setNewDoctor("");
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="预设管理"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-ink-700 hover:bg-paper-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="rounded-md px-5 py-2 text-sm font-medium text-paper-50 bg-accent hover:bg-accent-hover transition-colors shadow-soft"
          >
            保存
          </button>
        </div>
      }
    >
      <p className="text-[11px] text-ink-400 mb-4">
        预设用于添加/编辑条目时快速填入「SPD」「科室」与「主治医生」。
      </p>

      <Section title="预设 SPD" items={draft.spds} onRemove={(v) => setDraft((d) => ({ ...d, spds: d.spds.filter((x) => x !== v) }))}>
        <div className="flex items-center gap-2">
          <input
            value={newSpd}
            onChange={(e) => setNewSpd(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSpd()}
            placeholder="新增 SPD，如 SPD-2026-001"
            className="cell-input flex-1 min-w-0 rounded-md border border-line bg-paper-50 px-3 py-2 text-sm"
          />
          <button
            onClick={addSpd}
            className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-paper-50 bg-accent hover:bg-accent-hover"
          >
            添加
          </button>
        </div>
      </Section>

      <div className="border-t border-line/60 my-4" />

      <Section title="预设科室" items={draft.depts} onRemove={(v) => setDraft((d) => ({ ...d, depts: d.depts.filter((x) => x !== v) }))}>
        <div className="flex items-center gap-2">
          <input
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDept()}
            placeholder="新增科室，如「骨三」"
            className="cell-input flex-1 min-w-0 rounded-md border border-line bg-paper-50 px-3 py-2 text-sm"
          />
          <button
            onClick={addDept}
            className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-paper-50 bg-accent hover:bg-accent-hover"
          >
            添加
          </button>
        </div>
      </Section>

      <div className="border-t border-line/60 my-4" />

      <Section title="预设主治医生" items={draft.doctors} onRemove={(v) => setDraft((d) => ({ ...d, doctors: d.doctors.filter((x) => x !== v) }))}>
        <div className="flex items-center gap-2">
          <input
            value={newDoctor}
            onChange={(e) => setNewDoctor(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDoctor()}
            placeholder="新增医生姓名"
            className="cell-input flex-1 min-w-0 rounded-md border border-line bg-paper-50 px-3 py-2 text-sm"
          />
          <button
            onClick={addDoctor}
            className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-paper-50 bg-accent hover:bg-accent-hover"
          >
            添加
          </button>
        </div>
      </Section>
    </Sheet>
  );
}

function Section({
  title,
  items,
  onRemove,
  children,
}: {
  title: string;
  items: string[];
  onRemove: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-sm font-medium text-ink-800 mb-2">
        {title}
        <span className="text-ink-400 font-normal text-xs ml-1.5">{items.length} 项</span>
      </h3>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {items.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-paper-50 pl-2.5 pr-1 py-1 text-[13px] text-ink-800"
          >
            {v}
            <button
              onClick={() => onRemove(v)}
              className="w-5 h-5 grid place-items-center rounded-full text-ink-400 hover:text-danger hover:bg-paper-200 transition-colors"
              aria-label={`删除 ${v}`}
              title={`删除 ${v}`}
            >
              ×
            </button>
          </span>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-ink-400 italic">暂无预设</p>
        )}
      </div>
      {children}
    </section>
  );
}
