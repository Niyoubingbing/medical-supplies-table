"use client";

import type { Item } from "@/types/item";
import { FIXED_QTY, FIXED_UNIT } from "@/types/item";

// 关键：Noto Serif SC（思源宋体）是带中文字形的衬线 Web 字体，必须放到最前，
// 否则中文在 html2canvas 里会回退失败变成黑体。Source Serif 4 仅含拉丁字形。
const SERIF = '"Noto Serif SC", "Source Serif 4", "Songti SC", "SimSun", serif';
const C = {
  paper: "#FAF8F5",
  headBg: "#F1E9DD",
  ink: "#2B1810",
  inkSoft: "#6B5B4F",
  line: "#E5DDCC",
  alt: "#FBF9F5",
};

// 列宽（px），总和 = 944，与容器内容宽度一致（1000 - 左右 padding 28*2）
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
}

// 导出只要表格本身：去掉标题块与底部生成时间，单元格垂直居中
export default function ExportTable({ items }: Props) {
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
                  verticalAlign: "middle",
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
    </div>
  );
}

function cellStyle(
  align: "left" | "center",
  strong = false
): React.CSSProperties {
  return {
    border: `1px solid ${C.line}`,
    padding: "8px 10px",
    textAlign: align,
    verticalAlign: "middle",
    whiteSpace: "normal",
    wordBreak: "break-word",
    fontWeight: strong ? 600 : 400,
  };
}
