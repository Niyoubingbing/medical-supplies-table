// 备注预设（科室 / 主治医生）——独立于清单数据存储
export interface Presets {
  spds: string[];
  depts: string[];
  doctors: string[];
}

// SPD 内置预设 = 供货目录参考中的 11 家公司名（components/SupplierReference.tsx 同步来源）
export const DEFAULT_PRESETS: Presets = {
  spds: [
    "中盛", "和佳", "上海葆馥", "恒匡", "瑞兴", "康铭",
    "洲淮", "融智", "元康", "春晖", "美悦",
  ],
  depts: ["骨一", "骨二"],
  doctors: [
    "苏奕洪", "周永飞", "张广", "翁创桂", "胡钦晓",
    "羊博", "鲍铭贵", "许伟才", "郭木鑫", "戎志杰",
  ],
};

const KEY = "medical-supplies-table.presets.v1";

function sanitizeList(x: unknown): string[] {
  if (!Array.isArray(x)) return [];
  return x
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim())
    .filter((v, i, arr) => arr.indexOf(v) === i); // 去重
}

export function loadPresets(): Presets {
  if (typeof window === "undefined") return DEFAULT_PRESETS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PRESETS;
    const parsed = JSON.parse(raw) as {
      spds?: unknown;
      depts?: unknown;
      doctors?: unknown;
    };
    const spds = sanitizeList(parsed?.spds);
    const depts = sanitizeList(parsed?.depts);
    const doctors = sanitizeList(parsed?.doctors);
    // 解析为空时回退默认（用户可能清空了全部预设）
    return {
      spds: spds.length ? spds : DEFAULT_PRESETS.spds,
      depts: depts.length ? depts : DEFAULT_PRESETS.depts,
      doctors: doctors.length ? doctors : DEFAULT_PRESETS.doctors,
    };
  } catch {
    return DEFAULT_PRESETS;
  }
}

export function savePresets(p: Presets): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        spds: sanitizeList(p.spds),
        depts: sanitizeList(p.depts),
        doctors: sanitizeList(p.doctors),
      })
    );
    return true;
  } catch {
    return false;
  }
}
