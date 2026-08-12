"use client";

import { useState } from "react";

interface Props {
  targetRef: React.RefObject<HTMLElement>;
  filename?: string;
}

export default function ExportButton({ targetRef, filename }: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleClick = async () => {
    if (!targetRef.current) return;
    setBusy(true);
    setErr(null);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const node = targetRef.current;
      const canvas = await html2canvas(node, {
        backgroundColor: "#faf8f5",
        scale: 2,
        useCORS: true,
        logging: false,
        // Avoid clipping wide tables on small viewports
        windowWidth: Math.max(node.scrollWidth, document.documentElement.clientWidth),
      });
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      const stamp = new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\..+/, "")
        .replace("T", "-");
      a.href = dataUrl;
      a.download = (filename || `医用耗材录入表-${stamp}`) + ".png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      setErr("截图失败，请重试");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-paper-50 bg-ink-800 hover:bg-ink-700 disabled:opacity-60 transition-colors shadow-soft"
        title="仅导出表格主体"
      >
        {busy ? (
          <>
            <span className="inline-block w-3 h-3 rounded-full border-2 border-paper-50 border-t-transparent animate-spin" />
            正在截图…
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            一键导出截图
          </>
        )}
      </button>
      {err && <span className="text-xs text-accent">{err}</span>}
    </div>
  );
}
