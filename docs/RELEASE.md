# 版本与发布流程

> 维护者必读。回答三个问题：版本号怎么定？发布前查什么？发布后验什么？

---

## 1. 版本号规则（SemVer）

`主版本.次版本.修订号`（如 `1.2.0`）：

- **主版本**：不兼容的变更（数据结构大改、导出格式不兼容、移除功能）
- **次版本**：新功能（向下兼容）
- **修订号**：bug 修复、样式微调

当前版本基线：`1.0.0`（历史迭代未按此规范递增，从本次机制落地起开始严格执行）。

---

## 2. 三处版本号必须联动

| 位置 | 内容 | 规则 |
|---|---|---|
| `package.json` → `version` | **唯一权威版本号** | 发布前手工 bump（或后续引入 `npm version`） |
| `lib/version.ts` → `APP_VERSION` | 页脚展示的版本 | 与 package.json 保持一致 |
| `public/sw.js` → `CACHE` | `medical-pwa-vN` | N 随**每次发布**递增（不论改动是否涉及缓存——简单可靠）；否则已安装用户清不掉旧缓存 |

> 建议后续自动化：`npm version patch|minor|major` 后由一个小脚本同步三处（`scripts/sync-version.mjs`），并在 CI 里校验一致性。落地前，请严格按下方清单手工执行。

---

## 3. 发布前检查清单（本地）

- [ ] `npx tsc --noEmit` 通过
- [ ] `npm run build` 通过（本机 OneDrive 路径若报 safe-delete 清理错误，见 ARCHITECTURE §6：先删 `.next` 再构建）
- [ ] `npm run dev` 手动过一遍受影响功能（桌面 + 手机宽度两档）
- [ ] 改了表格格式？→ `ExportTable.tsx` 与 `lib/drawExport.ts` **两处已同步**
- [ ] 改了静态资源/SW/字体？→ `CACHE` 已 bump
- [ ] 改了功能/字段/文案？→ README / CHANGELOG / ARCHITECTURE 已同步
- [ ] 本地构建产物中 `public/` 下的 PNG 文件魔数为 `89 50 4E 47`（历史教训）
- [ ] 分支已合入 `main`（或 PR 已合并）

## 4. 发布步骤

1. 在 `main` 上执行版本三联动（§2）。
2. 更新 `CHANGELOG.md`：把 `Unreleased` 段改名为 `[X.Y.Z] - 日期`，补变更条目。
3. 提交：`chore(release): vX.Y.Z`。
4. `git push origin main` → Vercel 自动构建（可在 Vercel 控制台确认 BUILDING → READY，且 gitSha 与本次提交一致）。
5. 打标签：`git tag vX.Y.Z && git push origin vX.Y.Z`。
6. 执行下方冒烟测试，全部通过。
7. 冒烟结果归档到 CHANGELOG 该版本条目下（一行：验证人 + 结论）。
8. 把本轮 `.workbuddy/memory` 日志要点提炼进 CHANGELOG / ADR（知识管理闭环）。

---

## 5. 发布冒烟清单（必做，留痕）

| # | 检查项 | 方法 | 历史教训 |
|---|---|---|---|
| 1 | 线上 200 + 内容为新版 | 打开 `https://medical-supplies-table.vercel.app`，页脚版本号 = 本次版本 | 页面为 client 组件，不能只看 HTML 关键词，要看 gitSha + 版本号 |
| 2 | manifest / SW / 图标 | 访问 `/manifest.webmanifest`、`/sw.js`、`/icons/icon-192.png`、`/icons/icon-512.png`、`/icons/maskable-512.png`、`/apple-touch-icon.png` 均 200 | 曾出现「200 但文件损坏」，必须核对**文件头魔数** |
| 3 | PWA 安装 | 手机 Chrome/Safari 添加到主屏，图标正确、独立窗口打开 | 图标损坏事件 |
| 4 | 离线可用 | 首次联网打开后，断网（飞行模式）刷新/重开：外壳可用、已有数据可编辑 | 需首次联网后 SW 才生效 |
| 5 | 更新提示（确认式） | 部署新版后打开旧版页面：出现「新版本已就绪」横幅 → 点「稍后」保持旧版完整可用 → 打开「设置」确认「新版本已就绪」→ 点「确认更新」→ 自动刷新加载新版 | SW 不自动激活（ADR-15）；断网状态下旧版仍应完整可用 |
| 6 | 导出 PNG | 多条数据（含多行规格/长品名）导出：文字垂直居中、字体正确（中文黑体）、列宽与预览一致、文件可打开 | html2canvas 历史（ADR-1）、字体历史（ADR-3） |
| 7 | 数据持久化 | 编辑 → 刷新 → 数据仍在；导入/导出 JSON 往返一致 | localStorage 键 `items.v1` |
| 8 | 手机端卡片 | <640px：卡片可编辑、序号/删除/编辑按钮正常 | ADR-2 双端对等 |

> 本机无法访问外网时（沙箱环境），步骤 4~8 请人工在真机执行并回填结果。

---

## 6. 回滚

1. **Vercel 快速回滚**：Vercel 控制台 → Deployments → 上一次成功的部署 → "Redeploy"（秒级）。
2. **代码回滚**：`git revert <sha>` 走正常 PR/发布流程（不推荐 `git reset --force` 破坏历史）。
3. 回滚也要 bump SW 缓存版本（否则已安装用户仍拿旧 SW），并记录到 CHANGELOG（`revert:` 条目）。

---

## 7. 失败案例速查（为什么要有这套流程）

- 图标损坏上线上线才发现 → 因为只验了 HTTP 状态没验魔数。
- 导出居中修了四次 → 因为没有把「两处同步」「真实设备验证」写进强制清单。
- 手机中文字体反复变黑体 → 因为没有「CJK 字体加载」检查项。
- 已安装用户拿不到新版本 → 因为没有强制 bump SW 缓存版本。
