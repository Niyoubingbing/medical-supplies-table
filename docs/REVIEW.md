# 项目审查报告

- 审查日期：2026-08-14（后续修订请更新此处）
- 审查对象：`medical-supplies-table`（医用耗材录入表 PWA）
- 审查范围：全部源代码、配置、构建/部署脚本、工作日志（`.workbuddy/memory/`）
- 结论先行：**产品功能完整、核心实现（原生 Canvas 导出）扎实，可以放心多人接手；主要风险集中在「工程管理」而非「代码」——版本机制缺失、文档失真、凭据泄露、无自动化门禁。**

---

## 0. 状态更新（2026-08-16，v1.1.0 界面重设计 + 多清单之后）

本次重设计修复/变更了以下审查项：

| 原编号 | 状态 | 说明 |
|---|---|---|
| P0-2 | ✅ 已修复 | `saveState` 返回写入结果，失败时页面 Toast 提示用户立即备份 |
| P2-2 | ✅ 已修复 | 手机/桌面行内编辑逻辑抽为公共 `useInlineEdit` hook |
| P2-6 | ✅ 已修复 | `DataTransfer` 重写，`importRef` 死代码移除 |
| P3-3 | ✅ 已修复 | 移除 `viewport.maximumScale: 1`，允许页面缩放 |
| P3-4 | ✅ 已修复 | 删除/清空/覆盖导入/删除清单统一走 `ConfirmDialog`（导出失败仍保留一处 alert） |
| P3-9 | ✅ 已修复 | 「必填」语义统一为可留空，桌面与手机提示一致 |
| 新增 | 多清单（ADR-8） | 清单切换/新建/重命名/复制/删除；周六/周日/周一场景；旧数据自动迁移；全量备份导出 |
| 新增 | 手机端重设计（ADR-9） | 吸顶清单头部、卡片信息层级、底部固定操作栏 +「更多」抽屉、弹窗改底部抽屉 |

验证：本地 `tsc` 与 `next build` 通过；无头浏览器 25 项布局体检全过（触控目标 ≥44px、无溢出、抽屉/操作栏/表单均正常）。

**仍未处理（优先级不变）**：P0-1（撤销泄露的 PAT）、P1-1~P1-6、P2-1/P2-3/P2-4/P2-5/P2-7、P3-1/P3-2/P3-5/P3-6/P3-7/P3-8。路线图见 §5。

---

## 1. 验证限制（重要）

本环境无法访问外网（TLS 被沙箱拦截），以下事项**未能在本次审查中实测**，需按 `docs/RELEASE.md` 的冒烟清单补验：

- 线上站点 `https://medical-supplies-table.vercel.app` 的健康状态
- GitHub 仓库 `Niyoubingbing/medical-supplies-table` 当前文件/提交是否与本地一致
- PWA 安装、离线刷新、SW 更新提示的真实行为
- 导出 PNG 在手机端浏览器（iOS Safari / 安卓 Chrome）的效果

---

## 2. 项目概览

| 项 | 状态 |
|---|---|
| 技术栈 | Next.js 14.2.15 (App Router) + TypeScript 5.5 + Tailwind 3.4 |
| 架构 | 纯前端静态应用，无后端；数据存 `localStorage`，不上传服务器 |
| 部署 | Vercel（已关联 GitHub `main` 分支，push 自动部署） |
| 仓库 | `Niyoubingbing/medical-supplies-table`（公开） |
| 迭代历史 | 2026-08-12 至 08-14，约 20 次迭代，全部记录在 `.workbuddy/memory/` |
| 测试 | 无自动化测试 |
| CI | 无 |
| 许可证 | 无（公开仓库，存在法律风险） |

### 已实现功能（v1 现状）

- 表格就地编辑（桌面表格 + 手机卡片双端响应式）
- 添加/编辑/删除条目，序号自动重排，请购数/单位固定「1 套」
- 拖拽排序、SPD 列一键复制、JSON 导入/导出
- 原生 Canvas 绘制的高清 PNG 导出（无 html2canvas 依赖）
- 供应商/品牌目录悬浮面板（11 家供应商，硬编码）
- PWA：manifest、图标、离线 Service Worker、更新提示横幅

---

## 3. 发现清单

严重度定义：**P0** 立即处理 · **P1** 近期（接手团队必须做）· **P2** 代码结构债 · **P3** 体验与规范。

### P0 — 立即处理

| # | 位置 | 问题 | 建议 |
|---|---|---|---|
| P0-1 | `.workbuddy/memory/2026-08-12.md` | **完整 GitHub PAT 明文记录在日志中**（`ghp_RVOS...u3Av`，含 repo 权限）。该文件在 OneDrive 同步目录里，任何能看到工作区的人都能拿到 token 改写仓库。 | 1. 立即在 GitHub → Settings → Developer settings → Personal access tokens 撤销该 token；2. 新 token 设最小权限（仅 `repo`）+ 有效期；3. 今后日志中一律打码（`ghp_xxxx`）；4. 参见 `SECURITY.md`。 |
| P0-2 | `lib/storage.ts` | `saveItems` 静默吞掉 `QuotaExceededError` 等写入失败——用户录入大量数据后可能**静默丢失且无任何提示**。 | 写入失败时向用户提示「保存失败，请立即导出备份」；导出 JSON 已是现成逃生通道。 |

### P1 — 管理机制缺失（接手团队的必修课）

| # | 位置 | 问题 | 建议 |
|---|---|---|---|
| P1-1 | 工作区 / `push-to-github.mjs` | 本地目录**不是 git 仓库**，部署靠脚本「全量树替换」提交：无本地历史、无 diff、无分支、无评审，`COMMIT_MSG` 硬编码需每次手改。 | 本地 `git init` + 正规 git 工作流（分支 → PR → 合并 → push → Vercel 自动部署）；脚本降级为备用通道。见 `CONTRIBUTING.md`。 |
| P1-2 | `package.json` / `lib/version.ts` / `public/sw.js` | 三处版本号各自为政且**从未随迭代递增**：package.json `0.1.0`、APP_VERSION `1.0.0`、SW 缓存名 `medical-pwa-v3`。SW 缓存名不 bump 会导致已安装用户清理不到旧缓存。 | 统一为单一版本源 + 发布清单（`docs/RELEASE.md` 给出了方案与检查表）。 |
| P1-3 | `README.md` | 文档已失真：技术栈仍写「html2canvas」（第 11 次迭代已移除）；字段表仍写「品名/规格必填」（第 10 次迭代已改为可留空）；功能清单缺 PWA/离线、导入导出、排序、供货目录等 7 项新功能。 | 按现状重写（本次已修正）。今后 PR 必须同步文档（已写入 PR 模板）。 |
| P1-4 | 全仓 | 无任何自动化：无 CI、无测试、无 ESLint 配置（`npm run lint` 首次运行会失败并要求初始化）。 | 先加 GitHub Actions 门禁（`tsc --noEmit` + `next build`，见 `.github/workflows/ci.yml`）；逐步补 ESLint 与冒烟脚本。 |
| P1-5 | 仓库 | 公开仓库无 LICENSE、无 SECURITY、无 PR/Issue 模板、无 CODEOWNERS。 | 已补齐（`.github/`、`SECURITY.md`）；LICENSE 需仓库所有者选择（MIT 或私有化见 §4）。 |
| P1-6 | 仓库可见性 | 仓库为**公开**，但 `SupplierReference.tsx` 含供应商-品牌对应关系（内部业务信息）。 | 请所有者决策：改为 private，或将供货目录抽为数据文件并从公开仓库排除。见 §4 决策项。 |

### P2 — 代码结构债

| # | 位置 | 问题 | 建议 |
|---|---|---|---|
| P2-1 | `components/ExportTable.tsx` ↔ `lib/drawExport.ts` | 列宽/配色常量**两份拷贝**手工同步，日志显示每次改列宽都要「两处同步」（已反复踩坑）。 | 抽 `lib/exportSpec.ts` 单一来源，两处 import。 |
| P2-2 | `components/TableEditor.tsx` | `Cell`（桌面）与 `CardField`（手机）编辑逻辑几乎逐行重复（~60 行）。 | 抽公共 hook `useInlineEdit(value)` 统一 draft/focus/commit/cancel。 |
| P2-3 | `components/SupplierReference.tsx` | 供应商数据硬编码在组件内，更新业务数据必须改代码。 | 抽 `data/suppliers.json`（或 TS 常量模块），组件只做渲染。见 `docs/SUPPLIER-DATA.md`。 |
| P2-4 | `lib/storage.ts` | localStorage 无 schema 版本字段与迁移机制（key 带 v1 但无迁移函数）；`loadItems` 校验宽松（只查 id/name）。 | 数据结构加 `schemaVersion`；load 时按版本迁移；校验补齐字段。 |
| P2-5 | `package.json` | `uuid` 仅为生成 id 引入，`crypto.randomUUID()` 可替代（现代浏览器已全覆盖）。 | 移除依赖，减包体、少一份供应链风险。 |
| P2-6 | `components/DataTransfer.tsx` | `importRef` 声明未使用（死代码）。 | 删除。 |
| P2-7 | 全仓 | 无依赖锁定：`package-lock.json` 被推送脚本刻意排除，Vercel 与本地按 `^` 范围各自安装，版本可漂移。 | 恢复并提交 `package-lock.json`；CI 用 `npm ci`。 |

### P3 — 体验与规范

| # | 位置 | 问题 | 建议 |
|---|---|---|---|
| P3-1 | `TableEditor.tsx` | 单元格只能鼠标点击进入编辑，无键盘可达性；`<td>` 上绑 onClick 无 tabIndex/role。 | 加 tabIndex=0 + Enter/F2 进入编辑（可作为无障碍专项）。 |
| P3-2 | 各 Modal | 模态框无 focus trap、无 `role="dialog"`/`aria-modal`；Escape 处理仅监听 window。 | 统一 Modal 组件或补 aria 属性。 |
| P3-3 | `app/layout.tsx` | `viewport.maximumScale: 1` 禁止用户缩放，违反无障碍惯例。 | 移除 maximumScale。 |
| P3-4 | `page.tsx` / `TableEditor.tsx` | 使用原生 `confirm()`/`alert()`，与整体设计风格割裂。 | 换统一 Confirm 组件（低优先级）。 |
| P3-5 | 多标签页 | 无 `storage` 事件监听——两个标签页同时编辑会互相覆盖。 | 低优先级；至少在文档中声明「不支持多开」。 |
| P3-6 | `next-env.d.ts` / `.gitignore` | `next-env.d.ts` 被 gitignore（惯例应提交，保证 TS 环境一致）。 | 从 `.gitignore` 移除。 |
| P3-7 | 工作区根目录 | 残留 `_next_trash_PWA2/`（Next 缓存垃圾，约 37MB）、`medical-supplies-table.zip`（5.3MB，含 node_modules）、`medical-supplies-table-src.zip`（13KB）——与 OneDrive 同步双保险意义重叠。 | 确认无遗漏后删除；今后备份用 git 而非 zip。 |
| P3-8 | 知识存放 | `.workbuddy/memory` 在根目录与项目内各一份，知识分散在仓库之外。 | 采纳 `docs/PROJECT-MANAGEMENT.md` 的知识三层模型：memory 只是草稿，仓库文档才是权威。 |
| P3-9 | `components/AddItemModal.tsx` vs `TableEditor.tsx` | 语义不一致：弹窗说「品名/规格可留空」，表格单元格悬停仍提示「必填」（`required` 属性残留）。 | 统一为可留空；如业务确需必填，改回强制校验并同步文档。 |

---

## 4. 需要所有者决策的问题

| # | 决策项 | 选项与影响 |
|---|---|---|
| D1 | 仓库公开 vs 私有 | 公开：便于协作但供货目录业务信息暴露（P1-6）；私有：需处理 Vercel 团队权限。**建议私有**。 |
| D2 | LICENSE 选择 | MIT（最宽松）或保留版权。公开仓库必须有 LICENSE，否则他人无合法使用权。 |
| D3 | 「品名/规格」是否必填 | 代码两处语义不一致（P3-9）。产品上定一条规则，代码与文档同改。 |
| D4 | 数据备份策略 | 纯 localStorage 意味着「清浏览器=丢数据」。是否接受现状？如需更强保障，可考虑导出提醒（每周/每次导出前提醒备份 JSON）。 |
| D5 | 更新推送方 | 现有 SW 更新横幅 + `controllerchange` 自动刷新已可用；是否需要「强制更新」（blocking）取决于临床场景对旧版本容忍度。 |

---

## 5. 修复路线图（建议）

- **阶段 0（本周，安全止血）**：撤销泄露的 PAT（P0-1）；处理保存失败提示（P0-2）；决策 D1/D2。
- **阶段 1（接手团队建立机制）**：本地 git 化 + 工作流（P1-1）；统一版本机制与发布清单（P1-2）；CI 门禁（P1-4）；README/文档体系落地（P1-3，本次已交付）；LICENSE（P1-5）。
- **阶段 2（结构债清理，随功能迭代顺带做）**：常量单一化（P2-1）、公共编辑 hook（P2-2）、供应商数据外置（P2-3）、去掉 uuid（P2-5）、恢复 lock 文件（P2-7）。
- **阶段 3（体验专项）**：无障碍（P3-1~3）、统一弹窗（P3-4）、工作区清理（P3-7）。

---

## 6. 本次审查交付的文档

| 文档 | 用途 |
|---|---|
| `docs/PROJECT-MANAGEMENT.md` | 项目管理机制总设计（角色、流程、质量门禁、知识管理） |
| `docs/ARCHITECTURE.md` | 架构、数据模型、技术决策记录（ADR）、已知坑清单 |
| `docs/RELEASE.md` | 版本规则、发布清单、冒烟测试、回滚 |
| `docs/SUPPLIER-DATA.md` | 供货目录数据维护指南与改造方案 |
| `CONTRIBUTING.md` | 贡献/协作/AI 助手规范 |
| `CHANGELOG.md` | 从工作日志重建的完整变更历史 |
| `SECURITY.md` | 安全说明与凭据事件处置 |
| `.github/` | CI 工作流、CODEOWNERS、PR/Issue 模板 |
