"use client";

import { useState } from "react";

type Supplier = { name: string; brands: string[] };

const SUPPLIERS: Supplier[] = [
  { name: "中盛", brands: ["蒙太因单髁", "全膝+单髁骨水泥-混合碗", "力达康"] },
  { name: "和佳", brands: ["利格泰", "锐健", "春立", "强生", "大博", "亚洲生物"] },
  { name: "上海葆馥", brands: ["正天脊柱", "杰西慧", "威高"] },
  { name: "恒匡", brands: ["正天关节", "北京科仪", "德益达美", "陕西佰傲", "宇翔"] },
  { name: "瑞兴", brands: ["正天创伤", "强生骨水泥", "施乐辉"] },
  { name: "康铭", brands: ["金兴达", "新港钛针"] },
  { name: "洲淮", brands: ["日本郡是刚子可吸收钉", "天津威曼"] },
  { name: "融智", brands: ["蒙太因", "泰科", "科惠", "瑞泰", "捷迈", "贺力氏骨水泥", "德康脊柱"] },
  { name: "元康", brands: ["德康创伤钢板", "大博半髋", "拉思韧带"] },
  { name: "春晖", brands: ["博益宁", "贝奥路", "冠龙", "PVP"] },
  { name: "美悦", brands: ["万洁一次性骨水泥搅拌套件", "锐健编腱器"] },
];

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function SupplierReference({
  open: controlledOpen,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setInternalOpen(v);
  };
  // 默认全部展开，内容立即可见；仍可逐家公司折叠
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(SUPPLIERS.map((s) => s.name))
  );

  const toggle = (name: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  return (
    <>
      {/* 总体悬浮按钮：控制目录显隐 */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "收起供应商目录" : "展开供应商目录"}
        className="fixed z-40 bottom-24 sm:bottom-7 right-4 sm:right-7 flex items-center justify-center gap-2 rounded-full bg-accent text-paper-50 w-14 h-14 sm:w-auto sm:h-auto sm:pl-4 sm:pr-5 sm:py-3.5 shadow-card hover:bg-accent-hover active:scale-95 transition-all"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <span className="text-sm font-medium hidden sm:inline">供货目录</span>
      </button>

      {/* 可折叠面板（层级高于添加/截图的弹窗，便于在录入时参考） */}
      <div
        className={`fixed z-[60] inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-24 sm:right-7 sm:w-[380px] sm:max-w-[calc(100vw-2rem)] transition-all duration-300 ${
          open
            ? "translate-y-0 opacity-100"
            : "translate-y-full sm:translate-y-0 sm:opacity-0 sm:pointer-events-none"
        }`}
      >
        <div className="bg-paper-50 border border-line shadow-card rounded-t-2xl sm:rounded-2xl max-h-[72vh] sm:max-h-[78vh] flex flex-col overflow-hidden">
          {/* 头部 */}
          <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-line">
            <div>
              <h2 className="text-lg font-semibold text-ink-900 leading-tight">
                供应商 / 品牌目录
              </h2>
              <p className="text-xs text-ink-500 mt-1">
                共 {SUPPLIERS.length} 家 · 点公司名可折叠
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="关闭供应商目录"
              className="shrink-0 ml-3 w-8 h-8 -mr-1 grid place-items-center rounded-full text-ink-400 hover:text-ink-800 hover:bg-paper-200 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
          </div>

          {/* 列表 */}
          <div className="overflow-y-auto px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] space-y-2">
            {SUPPLIERS.map((s) => {
              const isOpen = expanded.has(s.name);
              return (
                <div
                  key={s.name}
                  className="rounded-xl border border-line bg-paper-100/60 overflow-hidden"
                >
                  <button
                    onClick={() => toggle(s.name)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-paper-200/60 transition-colors"
                  >
                    <span className="font-medium text-ink-900">{s.name}</span>
                    <span className="flex items-center gap-1.5 text-ink-400 text-xs shrink-0">
                      <span className="hidden sm:inline">{s.brands.length} 个品牌</span>
                      <Chevron open={isOpen} />
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-200 ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-4 pb-3 flex flex-wrap gap-2">
                        {s.brands.map((b) => (
                          <span
                            key={b}
                            className="rounded-full bg-paper-50 border border-line text-ink-700 text-[13px] px-3 py-1"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
