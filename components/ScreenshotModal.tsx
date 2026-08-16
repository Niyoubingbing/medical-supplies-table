"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Sheet from "@/components/Sheet";
import ExportTable from "@/components/ExportTable";
import { drawExport } from "@/lib/drawExport";
import type { Item } from "@/types/item";

const INNER_W = 794; // 与导出表格实际宽度一致（A4 794px），预览撑满可用宽度

interface Props {
  open: boolean;
  items: Item[];
  listName?: string;
  onClose: () => void;
}

export default function ScreenshotModal({ open, items, listName, onClose }: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const avail = holderRef.current?.clientWidth ?? 0;
      if (avail <= 0 || !captureRef.current) return;
      const s = Math.min(1, avail / INNER_W);
      setScale(s);
      if (holderRef.current) {
        holderRef.current.style.height =
          captureRef.current.offsetHeight * s + "px";
      }
    };
    const id = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
    };
  }, [open, items]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 确保黑体（sans-serif）系统字体已就绪，canvas 文字才会用黑体而非回退衬线
      const docFonts = (document as Document & { fonts?: FontFaceSet }).fonts;
      if (docFonts) {
        try {
          const sample =
            items
              .map((i) => `${i.name}${i.spec}${i.remark}`)
              .join("") || "医用耗材录入表规格请购数量单位备注合计";
          await Promise.all([
            docFonts.load('400 14px "Microsoft YaHei"', sample),
            docFonts.load('600 14px "Microsoft YaHei"', sample),
            docFonts.load('400 14px "PingFang SC"', sample),
            docFonts.load('600 14px "PingFang SC"', sample),
          ]);
          await docFonts.ready;
        } catch {
          /* ignore — 回退到系统黑体 */
        }
      }
      // 原生 Canvas 直接画表格：垂直居中由绘制逻辑精确计算
      const canvas = drawExport(items);
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      const stamp = new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\..+/, "")
        .replace("T", "-");
      const safeName = (listName || "清单").replace(/[\\/:*?"<>|]/g, "-");
      a.href = dataUrl;
      a.download = `${safeName}-${stamp}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      alert("截图失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="导出截图"
      width="sm:w-[min(860px,94vw)]"
      footer={
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-medium text-paper-50 bg-accent hover:bg-accent-hover disabled:opacity-60 transition-colors shadow-soft"
          >
            {saving ? (
              <>
                <span className="inline-block w-4 h-4 rounded-full border-2 border-paper-50 border-t-transparent animate-spin" />
                正在保存…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                保存图片
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none rounded-lg px-6 py-3 text-base font-medium text-ink-700 border border-line hover:bg-paper-200 transition-colors"
          >
            关闭
          </button>
        </div>
      }
    >
      {/* 完整预览（手机与桌面均显示，自适应缩放） */}
      <div className="bg-paper-200/40 rounded-xl px-3 sm:px-4 py-4">
        <div ref={holderRef} style={{ overflow: "hidden", width: "100%" }}>
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: INNER_W,
            }}
          >
            <div ref={captureRef} style={{ width: INNER_W }}>
              <ExportTable items={items} />
            </div>
          </div>
        </div>
        <p className="text-xs text-ink-400 mt-3 text-center">
          A4 版式预览 · 保存后为高清原图（约 4000px 宽）
        </p>
      </div>
    </Sheet>
  );
}
