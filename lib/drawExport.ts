import type { Item } from "@/types/item";

// 用浏览器原生 Canvas 2D 直接绘制导出的表格。
// 不再依赖 html2canvas —— 行高、文字换行、垂直居中全部由这里精确计算，
// 因此「预览居中、保存不居中」的 html2canvas 渲染偏差被彻底规避。

const C = {
  paper: "#FFFFFF",
  headBg: "#F2F3F5",
  ink: "#000000", // 全部文字黑色
  inkSoft: "#000000",
  line: "#D9DEE5",
  alt: "#F7F8FA",
  spd: "#000000",
};

// 黑体（sans-serif）字体栈：优先系统黑体，保证导出 PNG 与预览一致。
const FONT_BASE = '"Microsoft YaHei", "黑体", "SimHei", "PingFang SC", "Noto Sans SC", sans-serif';

type Col = { key: string; label: string; w: number; align: "left" | "center" };
const COLS: Col[] = [
  { key: "spd", label: "SPD", w: 78, align: "left" },
  { key: "no", label: "序号", w: 48, align: "center" },
  { key: "name", label: "品名", w: 240, align: "left" },
  { key: "spec", label: "规格", w: 156, align: "left" },
  { key: "qty", label: "请购数", w: 56, align: "center" },
  { key: "unit", label: "单位", w: 40, align: "center" },
  { key: "remark", label: "备注", w: 128, align: "left" },
];

const PAGE_W = 794; // A4 宽度（96dpi ≈ 210mm）
const PAD = 24; // 页面外边距（左右）
const CONTENT_W = PAGE_W - PAD * 2; // 746，与 COLS 宽度合计一致
const FONT_SIZE = 14;
const LINE_H = FONT_SIZE * 1.5; // 21
const VPAD = 6; // 单元格上下内边距（比之前更小，单元格更紧凑）
const HPAD = 8; // 单元格左右内边距
const MIN_ROW_H = VPAD * 2 + LINE_H; // 33

type Cell = { text: string; align: "left" | "center"; strong: boolean; w: number; color?: string };
type Row = { cells: Cell[]; h: number; empty?: boolean };

// CJK 友好的换行：按字符折行（中文），拉丁词按空格折行
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  let line = "";
  const tokens = text.split(/(\s+)/);
  for (const tk of tokens) {
    if (tk === "") continue;
    if (/^\s+$/.test(tk)) {
      line += tk;
      continue;
    }
    if (ctx.measureText(line + tk).width <= maxW) {
      line += tk;
    } else if (ctx.measureText(tk).width > maxW) {
      for (const ch of Array.from(tk)) {
        if (line && ctx.measureText(line + ch).width > maxW) {
          out.push(line.replace(/\s+$/, ""));
          line = ch;
        } else {
          line += ch;
        }
      }
    } else {
      if (line.trim()) out.push(line.replace(/\s+$/, ""));
      line = tk;
    }
  }
  if (line.trim()) out.push(line.replace(/\s+$/, ""));
  return out.length ? out : [""];
}

export function drawExport(items: Item[]): HTMLCanvasElement {
  const SCALE =
    typeof window !== "undefined" && window.innerWidth <= 600 ? 2 : 3;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建 canvas 上下文");

  const setFont = (strong: boolean) => {
    ctx!.font = `${strong ? 600 : 400} ${FONT_SIZE}px ${FONT_BASE}`;
  };

  // 1) 计算每一行的单元格换行与行高
  const rows: Row[] = [];
  if (items.length === 0) {
    rows.push({
      empty: true,
      h: MIN_ROW_H,
      cells: [
        { text: "（暂无录入数据）", align: "center", strong: false, w: CONTENT_W },
      ],
    });
  } else {
    for (const it of items) {
      const raw: Cell[] = [
        { text: it.spd || "—", align: "left", strong: false, w: COLS[0].w },
        { text: String(it.no), align: "center", strong: false, w: COLS[1].w },
        { text: it.name || "未填写", align: "left", strong: true, w: COLS[2].w },
        { text: it.spec || "未填写", align: "left", strong: false, w: COLS[3].w },
        { text: String(it.qty), align: "center", strong: false, w: COLS[4].w },
        { text: it.unit, align: "center", strong: false, w: COLS[5].w },
        { text: it.remark || "—", align: "left", strong: true, w: COLS[6].w },
      ];
      let maxLines = 1;
      raw.forEach((c) => {
        setFont(c.strong);
        maxLines = Math.max(maxLines, wrap(ctx, c.text, c.w - HPAD * 2).length);
      });
      rows.push({
        cells: raw,
        h: Math.max(MIN_ROW_H, VPAD * 2 + maxLines * LINE_H),
      });
    }
  }
  const headerH = MIN_ROW_H;
  const tableH = headerH + rows.reduce((s, r) => s + r.h, 0);
  const totalH = PAD * 2 + tableH;

  canvas.width = PAGE_W * SCALE;
  canvas.height = Math.round(totalH * SCALE);
  ctx.scale(SCALE, SCALE);

  // 2) 背景
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, PAGE_W, totalH);

  // 3) 单元格底色（先铺色，后画网格，避免双线变粗）
  let y = PAD;
  const paintBg = (h: number, fill: string) => {
    let x = PAD;
    for (const c of COLS) {
      ctx.fillStyle = fill;
      ctx.fillRect(x, y, c.w, h);
      x += c.w;
    }
  };
  paintBg(headerH, C.headBg);
  y += headerH;
  rows.forEach((r, idx) => {
    if (!r.empty) paintBg(r.h, idx % 2 === 1 ? C.alt : C.paper);
    else {
      ctx.fillStyle = C.paper;
      ctx.fillRect(PAD, y, CONTENT_W, r.h);
    }
    y += r.h;
  });

  // 4) 网格线（1px，单线，避免重叠变粗）
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  const isEmpty = rows.length === 1 && rows[0].empty;
  // 竖线
  let vx = PAD;
  for (let i = 0; i <= COLS.length; i++) {
    if (i > 0 && i < COLS.length && isEmpty) {
      vx += COLS[i - 1].w;
      continue;
    }
    const xx = Math.round(vx) + 0.5;
    ctx.beginPath();
    ctx.moveTo(xx, PAD);
    ctx.lineTo(xx, PAD + tableH);
    ctx.stroke();
    if (i < COLS.length) vx += COLS[i].w;
  }
  // 横线
  let hy = PAD;
  const hline = (yy: number) => {
    const v = Math.round(yy) + 0.5;
    ctx.beginPath();
    ctx.moveTo(PAD, v);
    ctx.lineTo(PAD + CONTENT_W, v);
    ctx.stroke();
  };
  hline(hy);
  hy += headerH;
  for (const r of rows) {
    hy += r.h;
    hline(hy);
  }

  // 5) 文字（垂直居中：textBaseline=middle + 行块整体居中）
  ctx.textBaseline = "middle";
  y = PAD;
  const paintText = (cells: Cell[], h: number, strongDefault: boolean) => {
    let x = PAD;
    for (const c of cells) {
      setFont(c.strong ?? strongDefault);
      ctx.fillStyle = c.color ?? C.ink;
      const lines = wrap(ctx, c.text || "—", c.w - HPAD * 2);
      const textH = lines.length * LINE_H;
      const startY = y + (h - textH) / 2;
      lines.forEach((ln, i) => {
        const ly = startY + (i + 0.5) * LINE_H;
        if (c.align === "center") {
          ctx.textAlign = "center";
          ctx.fillText(ln, x + c.w / 2, ly);
        } else {
          ctx.textAlign = "left";
          ctx.fillText(ln, x + HPAD, ly);
        }
      });
      x += c.w;
    }
  };
  paintText(
    COLS.map((c) => ({
      text: c.label,
      align: c.align,
      strong: false,
      w: c.w,
      color: "#000000",
    })),
    headerH,
    false
  );
  y += headerH;
  rows.forEach((r) => {
    if (!r.empty) paintText(r.cells, r.h, false);
    else {
      setFont(false);
      ctx.fillStyle = C.inkSoft;
      ctx.textAlign = "center";
      ctx.fillText("（暂无录入数据）", PAD + CONTENT_W / 2, y + r.h / 2);
    }
    y += r.h;
  });

  return canvas;
}
