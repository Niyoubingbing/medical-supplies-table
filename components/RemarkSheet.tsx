"use client";

import { useEffect, useState } from "react";
import Sheet from "@/components/Sheet";
import RemarkEditor from "@/components/RemarkEditor";
import type { RemarkMeta } from "@/types/item";
import { isEmptyMeta } from "@/types/item";
import type { Presets } from "@/lib/presets";

interface Props {
  open: boolean;
  value: RemarkMeta;
  presets: Presets;
  onClose: () => void;
  onSave: (meta: RemarkMeta) => void;
}

/** 卡片内备注编辑抽屉：四字段 + 预设快捷选择。 */
export default function RemarkSheet({ open, value, presets, onClose, onSave }: Props) {
  const [draft, setDraft] = useState<RemarkMeta>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="编辑备注"
      footer={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDraft({})}
            className="mr-auto rounded-md px-3 py-2 text-sm text-ink-500 hover:bg-paper-200 transition-colors"
          >
            清空
          </button>
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-ink-700 hover:bg-paper-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => {
              onSave(isEmptyMeta(draft) ? {} : draft);
              onClose();
            }}
            className="rounded-md px-5 py-2 text-sm font-medium text-paper-50 bg-accent hover:bg-accent-hover transition-colors shadow-soft"
          >
            保存
          </button>
        </div>
      }
    >
      <p className="text-[11px] text-ink-400 mb-3">
        保存后，卡片与导出表格中显示为「病人名字，住院号，科室，主治医生」。
      </p>
      <RemarkEditor value={draft} onChange={setDraft} presets={presets} />
    </Sheet>
  );
}
