"use client";

import { useLayoutEffect, useRef, useState } from "react";
import ExportTable from "@/components/ExportTable";
import type { Item } from "@/types/item";

const INNER_W = 1000;

interface Props {
  open: boolean;
  items: Item[];
  onClose: () => void;
}

export default function ScreenshotModal({ open, items, onClose }: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const avail = holderRef.current?.clientWidth ?? 360;
      const s = Math.min(1, avail / INNER_W);
      setScale(s);
      if (captureRef.current && holderRef.current) {
        holderRef.current.style.height =
          captureRef.current.offsetHeight * s + "px";
      }
    };
    // 等一帧，确保 ExportTable 已渲染出真实高度
    const id = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", measure);
    };
  }, [open, items]);

  if (!open) return null;

  const handleSave = async () => {
    if (!captureRef.current) return;
    setSaving(true);
    try {
      const docFonts = (document as Document & { fonts?: FontFaceSet }).fonts;
      if (docFonts?.ready) await docFonts.ready;
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: "#FAF8F5",
        scale: 4,
        useCORS: true,
        logging: false,
        imageTimeout: 15000,
        removeContainer: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      const stamp = new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\..+/, "")
        .replace("T", "-");
      a.href = dataUrl;
      a.download = `医用耗材录入表-${stamp}.png`;
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-[min(820px,94vw)] max-h-[92vh] flex flex-col rounded-2xl bg-paper-50 shadow-card border border-line/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-line/60">
          <h2 className="text-base font-semibold text-ink-900">截图预览</h2>
          <button
            onClick={onClose}
            className="text-ink-500 hover:text-ink-900 text-2xl leading-none px-2"
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-paper-200/40 px-4 py-4">
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
            下方为电脑版式预览，保存后为高清原图（约 4000px 宽）
          </p>
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t border-line/60">
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
      </div>
    </div>
  );
}
