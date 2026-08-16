# 项目管理机制设计

> 本文档回答一个问题：**「后面更多人来更新、管理这个项目时，怎么干不乱套？」**
> 读者：项目管理者、维护者、贡献者、AI 助手。
> 配套文件：`CONTRIBUTING.md`（怎么做）、`docs/RELEASE.md`（怎么发版）、`docs/ARCHITECTURE.md`（代码怎么回事）、`docs/REVIEW.md`（现状问题清单）。

---

## 1. 设计原则

1. **单一权威来源（Single Source of Truth）**：代码与文档都在 GitHub 仓库里，仓库是唯一权威；`.workbuddy/memory` 等本地日志只是过程草稿，不算数。
2. **门禁前置（Fail Fast）**：问题越早被发现越便宜。合并前必须过 CI；发布前必须过冒烟清单。
3. **文档与代码同改（Docs-in-PR）**：任何行为变更的 PR，必须在同一个 PR 里更新对应文档——历史教训（README 失真、双份常量漂移）都源于此原则缺失。
4. **知识不随人走**：每个「为什么」（技术决策、踩坑）必须落进仓库文档，而非某个人的记忆或聊天记录。
5. **轻量适配**：这是个小项目，机制必须轻——不为仪式感增加负担；但「版本号、变更记录、发布清单」这三件事一步都不能省。

---

## 2. 角色与职责

| 角色 | 谁能担任 | 权限 | 职责 |
|---|---|---|---|
| 所有者 Owner | 仓库所有者（Niyoubingbing） | 仓库设置、Vercel、凭据 | 决策 D1~D5（见 REVIEW §4）、凭据管理、生产环境控制 |
| 维护者 Maintainer | 1~2 人 | 合并 PR、打 tag、发布 | 代码评审、发布执行、冒烟验证、CHANGELOG 归档 |
| 贡献者 Contributor | 所有参与修改的人（含 AI 助手） | 开分支、提 PR | 按 CONTRIBUTING 规范提交；自己跑完本地检查再提 PR |
| 业务方 | 实际使用表格的医护人员 | 提 Issue | 反馈问题与需求，确认业务数据（如供货目录）变更 |

**最小可行配置**：1 个 Owner + 1 个 Maintainer 即可运转（可同一人）。

---

## 3. 协作流程（端到端）

```
需求/缺陷
   │  新建 Issue（用模板：bug / feature）
   ▼
认领 → 从 main 拉分支（feat/xxx · fix/xxx · docs/xxx）
   ▼
本地开发（npm run dev；改前先读 ARCHITECTURE 的坑清单）
   ▼
本地自检：npx tsc --noEmit && npm run build
   ▼
同步更新文档（README / CHANGELOG / ARCHITECTURE 按需）→ 提交
   ▼
推送分支 → 开 PR（套用 PR 模板 checklist）
   ▼
CI 自动跑 tsc + build（全绿才可合并）
   ▼
Maintainer 评审（≥1 人通过）→ 合并到 main
   ▼
Vercel 自动部署（productionBranch: main）
   ▼
发布冒烟（RELEASE.md 清单）→ 打 tag vX.Y.Z → 归档 CHANGELOG
```

### 分支规则

- `main`：唯一长期分支，永远可部署。**任何人（含 AI 助手）不直接推 main**——一切经 PR。
- 临时分支命名：`feat/<描述>`、`fix/<描述>`、`docs/<描述>`、`chore/<描述>`。
- 合并方式：Squash merge（保持 main 历史干净，一个 PR 一条记录）。

### 提交信息规范（Conventional Commits）

```
<type>: <一句话描述（中文）>

[可选] 详细说明、动机、影响面
```

type 取值：`feat`（新功能）/ `fix`（修 bug）/ `docs`（纯文档）/ `refactor`（重构不改行为）/ `chore`（构建、依赖、杂务）/ `style`（格式）。

示例：
```
feat: 新增 SPD 列一键复制（含剪贴板降级方案）

- 复制格式：首行「SPD 器械申请」+ 逐行「序号 <SPD>」
- 非安全上下文回退 textarea + execCommand
```

---

## 4. 版本与发布机制

见 `docs/RELEASE.md`，要点：

- 版本号**只有一处权威**：`package.json` 的 `version`（SemVer）。
- 另两处（`lib/version.ts` 的 `APP_VERSION`、`public/sw.js` 的 `CACHE`）**必须与它联动**：SW 缓存名含版本号，每次发版 bump，否则已安装用户清不掉旧缓存。
- 每次发布按 RELEASE.md 的 8 步清单执行，缺一步视作发布未完成。
- 发布必须过冒烟测试（含历史踩坑：PNG 文件魔数、字体、居中、离线刷新）。

---

## 5. 质量门禁

### 5.1 合并门禁（CI，自动）

`.github/workflows/ci.yml`：对每个 PR 和 main 的 push 执行
1. `npx tsc --noEmit`（类型检查）
2. `npm run build`（生产构建）

> lint 待 ESLint 配置落地后加入（当前 `next lint` 无配置会失败，见 REVIEW P1-4）。

### 5.2 完成的定义（Definition of Done）

一个 PR 只有在**全部满足**时才叫「完成」：
- [ ] `tsc --noEmit` 与 `next build` 本地通过
- [ ] 行为变更已同步文档（README/CHANGELOG/ARCHITECTURE/SUPPLIER-DATA 按需）
- [ ] 涉及导出表格式 → `ExportTable.tsx` 与 `lib/drawExport.ts` **两处同步修改**（或已抽共享模块）
- [ ] 涉及静态资源/缓存 → `public/sw.js` 缓存版本已 bump
- [ ] 涉及手机端 → 已在手机尺寸（<640px）实测
- [ ] PR 描述按模板填写，附测试证据（截图/录屏）

### 5.3 发布冒烟（人工，发布后）

按 `docs/RELEASE.md` §5 清单逐项执行并留痕（结果贴进 CHANGELOG 或 PR）。

---

## 6. 知识管理（三层模型）

```
第 1 层  过程草稿：.workbuddy/memory/*.md、聊天记录
            ↓ 每次发布时提炼（由维护者或 AI 助手执行）
第 2 层  仓库文档：CHANGELOG / ARCHITECTURE(ADR) / RELEASE / SUPPLIER-DATA / REVIEW
            ↓ 对外引用
第 3 层  读者入口：README（新接手者第一个看的文件）
```

规则：
- **「为什么」只信第 2 层。** 任何技术决策（如「为什么弃用 html2canvas」）必须写进 `ARCHITECTURE.md` 的 ADR 表，否则不算被团队知晓。
- **每次发布闭环**：发布完成后，把本轮 memory 日志的要点归档进 CHANGELOG 与 ADR，然后才允许进入下一轮迭代。
- **单点存放**：memory 只保留一处（工作区根目录），项目内 `.workbuddy` 不再新建。

### 文档地图（谁、什么时候、必须更新什么）

| 文档 | 读者 | 更新时机 | 责任人 |
|---|---|---|---|
| `README.md` | 所有人（第一入口） | 功能增删、命令/部署变化 | PR 作者 |
| `CHANGELOG.md` | 用户、维护者 | 每次发布 | 维护者 |
| `docs/ARCHITECTURE.md` | 开发者 | 架构/数据/决策变化 | PR 作者 |
| `docs/RELEASE.md` | 维护者 | 流程/清单变化 | 维护者 |
| `docs/SUPPLIER-DATA.md` | 业务方、开发者 | 供应商/品牌变更 | 业务方确认 + PR 作者 |
| `docs/REVIEW.md` | 管理者 | 每次全面审查 | 维护者 |
| `CONTRIBUTING.md` | 贡献者 | 规范变化 | 维护者 |
| `SECURITY.md` | 所有人 | 安全事件/策略变化 | Owner |

---

## 7. 安全管理

- **凭据**：PAT 只在部署机上作为环境变量使用，最短权限（`repo`）+ 最短期（建议 30 天）；**绝不进日志、文档、脚本**。泄露处置流程见 `SECURITY.md`。
- **分支保护**（建议在 GitHub 开启）：`main` 需 PR 才能合并、需 CI 通过、禁止 force push。
- **数据边界**：应用不收集、不上传任何数据；`localStorage` 属用户设备。对外沟通（README/隐私说明）保持一致口径。
- **依赖**：恢复 `package-lock.json` 并提交，减少供应链漂移；定期 `npm audit`（维护者月度例行）。

---

## 8. 与 AI 助手的协作规范

本项目历史由 AI 助手重度参与。继续允许 AI 参与时，遵循：

1. AI 与人类贡献者地位相同——**同样走 Issue → 分支 → PR → 评审**，不允许 AI 直接改 main 或绕过文档义务。
2. AI 产出的改动必须由维护者人工验证「行为正确 + 文档已同步」，重点是 AI 看不到的用户体验（手机实测、离线实测、导出 PNG 肉眼核验）。
3. AI 长任务结束后，其过程日志先落到 memory（第 1 层），**由维护者决定哪些进仓库文档**——AI 不得自行将过程记录当正式文档。
4. 高影响操作（改导出格式、改存储结构、改 SW 策略、改部署链路）在动手前须经维护者确认，并记录到 ADR。
5. AI 生成代码中的历史坑必须对照 `ARCHITECTURE.md` 的坑清单自查。

---

## 9. 度量与回顾（轻量）

- **月度回顾（30 分钟）**：过一遍本月 CHANGELOG；检查 REVIEW 路线图进度；`npm audit`；memory 归档。
- **季度全面审查**：更新 `docs/REVIEW.md`（本文件即模板），重新评估 P0~P3 清单。
- **不引入**：燃尽图、周报、工时统计等重型度量——项目规模不需要。
