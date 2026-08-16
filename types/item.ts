export interface Item {
  id: string;
  spd: string;     // SPD 编码
  no: number;      // 序号
  name: string;    // 品名
  spec: string;    // 规格
  qty: number;     // 请购数（固定为 1）
  unit: string;    // 单位（固定为 "套"）
  remark: string;  // 备注（展示/导出文本，由 meta 序列化而来或历史自由文本）
  meta?: RemarkMeta; // 结构化备注（v1.1 起；旧数据无此字段）
}

/** 结构化备注：病人名字 / 住院号 / 预设科室 / 预设主治医生 */
export interface RemarkMeta {
  patient?: string;
  admissionNo?: string;
  dept?: string;
  doctor?: string;
}

export const FIXED_QTY = 1;
export const FIXED_UNIT = "套";

/** 结构化备注 → 展示/导出文本：「名字，住院号，科室，医生」（空值跳过） */
export function joinRemark(meta: RemarkMeta | undefined): string {
  if (!meta) return "";
  return [meta.patient, meta.admissionNo, meta.dept, meta.doctor]
    .filter((v) => v && v.trim())
    .map((v) => (v as string).trim())
    .join("，");
}

/** 结构化备注是否为空 */
export function isEmptyMeta(meta: RemarkMeta | undefined): boolean {
  if (!meta) return true;
  return !(
    (meta.patient && meta.patient.trim()) ||
    (meta.admissionNo && meta.admissionNo.trim()) ||
    (meta.dept && meta.dept.trim()) ||
    (meta.doctor && meta.doctor.trim())
  );
}

/** SPD 字符串（「中盛，和佳」格式）→ 值列表 */
export function splitSpd(spd: string): string[] {
  return spd
    .split("，")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** SPD 多选切换：在/不在列表中则移除/追加，返回「，」合并文本 */
export function toggleSpd(spd: string, value: string): string {
  const list = splitSpd(spd);
  const idx = list.indexOf(value);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(value);
  return list.join("，");
}