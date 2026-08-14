"use client";

import type { Item } from "@/types/item";
import { FIXED_QTY, FIXED_UNIT } from "@/types/item";

// 黑体（sans-serif）字体栈：优先系统黑体，保证导出 PNG 与预览一致。
const SANS = '"Microsoft YaHei", "黑体", "SimHei", "PingFang SC", "Noto Sans SC", sans-serif';
const C = {
  paper: "#FFFFFF",
  headBg: "#F2F3F5",
  ink: "#000000", // 全部文字黑色
  inkSoft: "#000000",
  line: "#D9DEE5",
  alt: "#F7F8FA",
  spd: "#000000",
};

// 列宽（px），总和 = 746，与容器内容宽度一致（A4: 794 - 左右 padding 24*2）
const COLS: { key: string; label: string; w: number; align: "left" | "center" }[] = [
  { key: "spd", label: "SPD", w: 78, align: "left" },
  { key: "no", label: "序号", w: 48, align: "center" },
  { key: "name", label: "品名", w: 240, align: "left" },
  { key: "spec", label: "规格", w: 156, align: "left" },
  { key: "qty", label: "请购数", w: 56, align: "center" },
  { key: "unit", label: "单位", w: 40, align: "center" },
  { key: "remark", label: "备注", w: 128, align: "left" },
];

interface Props {
  items: Item[];
}

// 导出只要表格本身：去掉标题块与底部生成时间，单元格垂直居中
export default function ExportTable({ items }: Props) {
  return (
    <div
      style={{
        width: 794, // A4 宽度（96dpi ≈ 210mm）
        boxSizing: "border-box",
        background: C.paper,
        padding: 24,
        fontFamily: SANS,
        color: C.ink,
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          tableLayout: "fixed",
          fontSize: 14,
          lineHeight: 1.5,
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
                data-align={c.align}
                style={{
                  border: `1px solid ${C.line}`,
                  background: C.headBg,
                  padding: "6px 8px",
                  textAlign: c.align,
                  verticalAlign: "middle",
                  fontWeight: 400,
                  color: "#000000",
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
                data-align="center"
                style={{
                  border: `1px solid ${C.line}`,
                  padding: "12px 8px",
                  textAlign: "center",
                  verticalAlign: "middle",
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
              <td data-align="left" style={cellStyle("left", false)}>{it.spd || "—"}</td>
              <td data-align="center" style={cellStyle("center")}>{it.no}</td>
              <td data-align="left" style={cellStyle("left", true)}>{it.name || "未填写"}</td>
              <td data-align="left" style={cellStyle("left")}>{it.spec || "未填写"}</td>
              <td data-align="center" style={cellStyle("center")}>{FIXED_QTY}</td>
              <td data-align="center" style={cellStyle("center")}>{FIXED_UNIT}</td>
              <td data-align="left" style={cellStyle("left", true)}>{it.remark || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function cellStyle(
  align: "left" | "center",
  strong = false,
  color?: string
): React.CSSProperties {
  return {
    border: `1px solid ${C.line}`,
    padding: "6px 8px",
    textAlign: align,
    verticalAlign: "middle",
    whiteSpace: "normal",
    wordBreak: "break-word",
    fontWeight: strong ? 600 : 400,
    color: color ?? C.ink,
  };
}
