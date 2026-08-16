# 供货目录数据维护指南

> 本文件说明「供应商 / 品牌目录」数据现在在哪里、怎么改、以及推荐怎么改造。
> 业务数据变更（新增供应商、调整品牌）**必须由业务方确认后**再提交。

---

## 1. 现状

- 数据位置：`components/SupplierReference.tsx` 顶部的 `SUPPLIERS` 常量（硬编码在组件内）。
- 数据结构：

```ts
type Supplier = { name: string; brands: string[] };
// 例：{ name: "和佳", brands: ["利格泰", "锐健", "春立", "强生", "大博", "亚洲生物"] }
```

- 界面行为：右下角悬浮按钮「供货目录」开关面板；公司名可折叠；品牌以 chip 展示；添加条目弹窗内也可打开参考。

---

## 2. 如何修改（当前方式）

1. 编辑 `components/SupplierReference.tsx` 中的 `SUPPLIERS` 数组。
2. 本地 `npx tsc --noEmit` + `npm run build` + `npm run dev` 目检目录面板。
3. 按 `CONTRIBUTING.md` 流程提 PR（类型 `feat` 或 `docs`，描述里注明业务方确认人）。
4. 发布后按 `docs/RELEASE.md` 冒烟（重点：手机端面板可用）。

### 变更规则

- 品牌名保持与业务口径一致（含括号补充，如「万洁一次性骨水泥搅拌套件」）。
- 排序：公司/品牌顺序即展示顺序，调整顺序也算变更。
- 移除供应商前确认是否有在用条目引用（本应用无引用关系约束，纯参考性质）。

---

## 3. 推荐改造：数据外置（REVIEW P2-3）

**目标**：把业务数据与代码分离，让非技术人员也能提数据变更，代码审查不掺业务内容。

### 方案

1. 新建 `data/suppliers.json`（或 `data/suppliers.ts`，保类型提示）：

```json
{
  "schemaVersion": 1,
  "suppliers": [
    { "name": "中盛", "brands": ["蒙太因单髁", "全膝+单髁骨水泥-混合碗", "力达康"] }
  ]
}
```

2. `SupplierReference.tsx` 改为 `import suppliers from "@/data/suppliers.json"`（tsconfig 已开 `resolveJsonModule`）。
3. PR 顺带补一个最小校验（数组、name/brands 类型），或由 CI 增加 `node scripts/check-suppliers.mjs` 校验 JSON 合法。
4. 更新本文件 §1/§2 为「编辑 `data/suppliers.json`」流程。

### 收益

- 数据变更 PR 只有 JSON diff，评审一目了然。
- 未来可做「目录编辑界面」或从外部表格导入，不改组件逻辑。
- 若仓库改私有/数据需要保密，可把该文件从公开构建中剥离（决策项 D1，见 `docs/REVIEW.md` §4）。

---

## 4. 数据主权提醒

供货目录属于**业务信息**。维护者只负责「格式正确、部署成功」；内容正确性由业务方负责并留痕（PR 描述注明「业务确认：XXX，日期」）。
