"use client";

import type { Item } from "@/types/item";
import { FIXED_QTY, FIXED_UNIT } from "@/types/item";

const SERIF = '"Source Serif 4", "Songti SC", "SimSun", "Noto Serif SC", serif';
const C = {
  paper: "#FAF8F5",
  headBg: "#F1E9DD",
  ink: "#2B1810",
  inkSoft: "#6B5B4F",
  line: "#E5DDCC",
  alt: "#FBF9F5",
};

// 列宽（px），总和 = 944，与容器内容宽度一致
const COLS: { key: string; label: string; w: number; align: "left" | "center" }[] = [
  { key: "spd", label: "SPD", w: 84, align: "left" },
  { key: "no", label: "序号", w: 52, align: "center" },
  { key: "name", label: "品名", w: 160, align: "left" },
  { key: "spec", label: "规格", w: 300, align: "left" },
  { key: "qty", label: "请购数", w: 70, align: "center" },
  { key: "unit", label: "单位", w: 52, align: "center" },
  { key: "remark", label: "备注", w: 226, align: "left" },
];

interface Props {
  items: Item[];
  title?: string;
}

export default function ExportTable({ items, title = "医用耗材请购单" }: Props) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  return (
    <div
      style={{
        width: 1000,
        boxSizing: "border-box",
        background: C.paper,
        padding: 28,
        fontFamily: SERIF,
        color: C.ink,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.04em" }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 4 }}>
          请购数固定 {FIXED_QTY} {FIXED_UNIT}/条 · 共 {items.length} 条记录
        </div>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        <colgroup>
          {COLS.map((c) => (
            <col key={c.key} style={{ width: c.w }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {COLS.map((c) => (
              <th
                key={c.key}
                style={{
                  border: `1px solid ${C.line}`,
                  background: C.headBg,
                  padding: "8px 10px",
                  textAlign: c.align,
                  fontWeight: 600,
                  color: C.ink,
                  whiteSpace: "nowrap",
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td
                colSpan={COLS.length}
                style={{
                  border: `1px solid ${C.line}`,
                  padding: "16px 10px",
                  textAlign: "center",
                  color: C.inkSoft,
                }}
              >
                （暂无录入数据）
              </td>
            </tr>
          ) : (
            items.map((it, idx) => (
              <tr
                key={it.id}
                style={{ background: idx % 2 === 1 ? C.alt : C.paper }}
              >
                <td style={cellStyle("left")}>{it.spd || "—"}</td>
                <td style={cellStyle("center")}>{it.no}</td>
                <td style={cellStyle("left", true)}>{it.name || "未填写"}</td>
                <td style={cellStyle("left")}>{it.spec || "未填写"}</td>
                <td style={cellStyle("center")}>{FIXED_QTY}</td>
                <td style={cellStyle("center")}>{FIXED_UNIT}</td>
                <td style={cellStyle("left")}>{it.remark || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div
        style={{
          fontSize: 11,
          color: C.inkSoft,
          marginTop: 10,
          textAlign: "right",
        }}
      >
        生成时间：{stamp}
      </div>
    </div>
  );
}

function cellStyle(
  align: "left" | "center",
  strong = false
): React.CSSProperties {
  return {
    border: `1px solid ${C.line}`,
    padding: "7px 10px",
    textAlign: align,
    verticalAlign: "top",
    whiteSpace: "normal",
    wordBreak: "break-word",
    fontWeight: strong ? 600 : 400,
  };
}
