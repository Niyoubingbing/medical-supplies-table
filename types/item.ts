export interface Item {
  id: string;
  spd: string;     // SPD 编码
  no: number;      // 序号
  name: string;    // 品名
  spec: string;    // 规格
  qty: number;     // 请购数（固定为 1）
  unit: string;    // 单位（固定为 "套"）
  remark: string;  // 备注
}

export const FIXED_QTY = 1;
export const FIXED_UNIT = "套";
