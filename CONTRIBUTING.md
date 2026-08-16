# 贡献指南

> 欢迎参与本项目。流程很短：**建 Issue → 开分支 → 本地自检 → 提 PR → 评审合并 → 自动部署。**
> 管理机制总纲见 `docs/PROJECT-MANAGEMENT.md`；代码结构见 `docs/ARCHITECTURE.md`。

---

## 1. 环境准备

- Node.js ≥ 18（建议 20 LTS）
- 安装依赖（国内网络用镜像）：

```bash
npm install --registry=https://registry.npmmirror.com/
```

- 本地开发：

```bash
npm run dev        # http://localhost:3000（dev 环境不注册 Service Worker，改代码即热更新）
```

- 本地自检（提 PR 前必须全过）：

```bash
npx tsc --noEmit
npm run build
```

> 本机在 OneDrive 路径下 `npm run build` 可能于末尾清理 `.next` 时报 safe-delete 错误（产物实际完整）：先手动删除 `.next` 再构建。CI 与 Vercel 无此问题。

---

## 2. 动手前必读

1. `docs/ARCHITECTURE.md` 的 **§2 模块地图**（改哪里）+ **§6 历史坑清单**（对照自查）。
2. 若改动涉及：表格导出格式、手机端布局、存储结构、Service Worker、字体、业务口径——先看 §5 的 ADR，确认是否与既有决策冲突。

---

## 3. 工作流

### 3.1 建 Issue

- bug → 用 Bug 报告模板；新功能 → 用功能请求模板。
- 业务数据变更（供货目录）→ 见 `docs/SUPPLIER-DATA.md` 的流程。

### 3.2 分支

```bash
git checkout main
git pull
git checkout -b feat/spd-copy        # 命名：feat/ fix/ docs/ chore/ refactor/ 前缀
```

### 3.3 提交

Conventional Commits，中文描述（示例见 `docs/PROJECT-MANAGEMENT.md` §3）。一个小建议：**一次提交只做一件事**。

### 3.4 提 PR

- 套用 PR 模板，逐项勾选 checklist。
- PR 必须携带**证据**：桌面截图 + 手机截图（涉及 UI）、导出 PNG 样本（涉及导出）、真机验证记录（涉及 PWA/离线）。
- 文档同步义务：功能/字段/文案变化 → 同 PR 更新 README；格式变化 → 同步 `ExportTable.tsx` 与 `drawExport.ts`；行为变化 → CHANGELOG 的 `Unreleased` 段。

### 3.5 评审与合并

- 由 Maintainer 评审合并（Squash merge）。
- CI 全绿是合并前提（`.github/workflows/ci.yml`：tsc + build）。
- 合并后 Vercel 自动部署；发布验证按 `docs/RELEASE.md` 执行（正式发版动作，通常由 Maintainer 完成）。

---

## 4. 代码约定

- TypeScript 严格模式（`strict: true` 已开启），不引入 `any`（确有必要的局部豁免加注释说明）。
- 样式用 Tailwind 原子类；设计 token（paper/ink/accent）已在 `tailwind.config.ts`，不要硬编码新色值。
- 组件文件顶部 `"use client"`；只有确实需要客户端能力的组件才加。
- 表格/卡片两端功能对等（ADR-2）：改字段编辑逻辑时，桌面 `Cell` 与手机 `CardField` 同改。
- 常量单一来源：业务常量放 `types/item.ts`（现有 `FIXED_QTY/FIXED_UNIT`）；导出列宽/配色**最终应合并到共享模块**（REVIEW P2-1，改造前继续两处同步）。
- 新依赖原则：能用标准 API 就不用包（如 id 生成用 `crypto.randomUUID()`，REVIEW P2-5）。

---

## 5. 测试要求

- 当前无自动化测试框架。**最低要求**：每个 PR 人工验证受影响路径（见 PR 模板）。
- 引入测试框架属于 `feat` 级工作，建议从 `lib/` 纯函数（wrap 换行、DataTransfer 解析、storage 迁移）开始。

---

## 6. AI 助手参与规范

（摘自 `docs/PROJECT-MANAGEMENT.md` §8）

1. AI 与人类贡献者同等对待：Issue → 分支 → PR → 评审，不直接改 main。
2. AI 产物必须人工验证（真机、离线、导出 PNG 肉眼核验）。
3. AI 的过程日志（`.workbuddy/memory`）只是草稿；正式文档由维护者审定后进仓库。
4. 高影响操作（导出格式、存储结构、SW 策略、部署链路）动手前经维护者确认，并追加 ADR。

---

## 7. 常见问题

- **本地 dev 看不到 PWA 效果？** dev 环境不注册 SW；用 `npm run build && npm start` 预览生产行为（注意 `next start` 属生产环境，会注册 SW——测试完记得在浏览器清除该域名的 SW/缓存）。
- **推不动代码？** 检查 git remote 指向 `Niyoubingbing/medical-supplies-table`，且凭据有效（PAT 管理见 `SECURITY.md`）。历史备用脚本 `push-to-github.mjs` 仅在无 git 环境时使用，且已不推荐。
- **构建成功但清理报错？** 见 §1 的 OneDrive 说明。
