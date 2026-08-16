# 架构说明（给后续维护者）

> 新接手者必读。包含：模块地图、数据模型、关键机制、技术决策记录（ADR）、历史坑清单。

---

## 1. 系统形态

- 纯前端 Next.js 14（App Router）应用，**静态导出、无后端、无数据库**。
- 所有业务数据存于用户浏览器 `localStorage`（多清单结构，schemaVersion 2）；应用本身不收集、不上传任何数据。
- 部署：Vercel（关联 GitHub `main` 分支，push 即自动构建）。
- PWA：可安装到主屏，Service Worker 提供离线外壳与更新提示。

```
浏览器
├─ React UI（app/page.tsx 状态中心 + components/* 各抽屉/卡片）
├─ lib/storage.ts ── localStorage（键：medical-supplies-table.lists.v2，多清单）
├─ lib/drawExport.ts ── Canvas 2D 画表 → PNG 下载（导出管线）
└─ public/sw.js ── Cache Storage（应用外壳 + 静态资源 + 字体）
```

---

## 2. 模块地图

| 文件 | 职责 | 关键注意 |
|---|---|---|
| `app/page.tsx` | 状态中心：多清单 AppState、各抽屉开关、清单操作、复制 SPD、清空 | 唯一持有数据的地方；所有变更回调在此汇总 |
| `app/layout.tsx` | 元数据、字体（Google Fonts **.cn 镜像**）、SW 注册挂载 | 改字体/图标/themeColor 在这里 |
| `app/manifest.ts` | PWA manifest（Next 路由 `/manifest.webmanifest`） | 改应用名/图标时同步此文件与 `public/icons/` |
| `app/sw-register.tsx` | 生产环境注册 SW + 「新版本可用」横幅 | 仅 `NODE_ENV==='production'` 注册，本地 `npm run dev` 不受干扰 |
| `app/globals.css` | 全局样式、设计 token（paper/ink/accent/danger）、弹层动画 | 中文字体栈顺序有讲究，见 ADR-3 |
| `components/Sheet.tsx` | 统一弹层容器：手机底部抽屉 / 桌面居中对话框，Esc 关闭、滚动锁定 | 所有模态弹窗都应基于它 |
| `components/ConfirmDialog.tsx` | 统一确认对话框（替代原生 confirm） | danger 用 tailwind `danger` 色 |
| `components/Toast.tsx` | 顶部轻提示 | 由页面管理消失时机 |
| `components/ListManager.tsx` | 清单管理：切换/新建/重命名/复制/删除 | 禁止删除最后一个清单（页面层校验） |
| `components/TableEditor.tsx` | 桌面表格 + 手机卡片双端渲染、行内编辑（Cell/CardField/TitleField/SpdField 共享 useInlineEdit） | 两端功能必须对等 |
| `components/AddItemModal.tsx` | 添加/编辑条目表单（Sheet 抽屉） | 请购数/单位固定只读；可打开供货目录（受控） |
| `components/ScreenshotModal.tsx` | 导出截图：手机摘要卡 / 桌面完整预览 | 字体预加载 → `drawExport` → PNG 下载；文件名含清单名 |
| `components/ExportTable.tsx` | 预览用表格（浏览器渲染） | 列宽/配色常量**必须与 drawExport.ts 同步**（REVIEW P2-1） |
| `lib/drawExport.ts` | 原生 Canvas 2D 画表（实际导出内容） | 导出真相来源；垂直居中靠 `textBaseline=middle` 精确计算 |
| `components/DataTransfer.tsx` | JSON 导入/导出：当前清单 / 全部清单备份两种模式，自动识别导入格式 | 导入 = 整体替换（有确认）；强制回填 qty/unit、重排序号 |
| `components/ReorderModal.tsx` | 拖拽 + ▲▼ 排序（Sheet 抽屉） | 显示品名/规格/备注；保存后重排 no |
| `components/RemarkEditor.tsx` | 结构化备注编辑器（病人/住院号/预设科室/预设主治医生 + 预设胶囊） | 用于添加表单与备注抽屉 |
| `components/RemarkSheet.tsx` | 卡片备注编辑抽屉 | 保存时同步 meta 与 remark 文本（joinRemark） |
| `components/PresetManager.tsx` | 预设管理抽屉（科室/医生增删） | 预设独立存储，见 lib/presets.ts |
| `lib/presets.ts` | 预设读写（键 `medical-supplies-table.presets.v1`，内置科室/医生名单） | 与清单数据分离 |
| `components/SupplierReference.tsx` | 供应商/品牌目录悬浮面板 | 数据硬编码在组件内（见 SUPPLIER-DATA.md 的改造计划） |
| `lib/storage.ts` | localStorage 读写、多清单迁移、createList/suggestedListName/nextNo | 写入失败返回 false 由 UI 提示（P0-2 已修） |
| `lib/version.ts` | APP_VERSION（页脚展示） | 与 package.json / sw.js 版本联动，见 RELEASE.md |
| `types/item.ts` | Item 类型与 FIXED_QTY/FIXED_UNIT 常量 | 业务字段定义唯一来源 |
| `types/list.ts` | SupplyList / AppState 类型与 SCHEMA_VERSION | 多清单数据模型 |
| `public/sw.js` | 离线缓存策略（导航 SWR、静态缓存优先、字体缓存） | 改任何缓存相关逻辑都要 bump `CACHE` 版本名 |
| `push-to-github.mjs` | 备用部署通道（Git Data API 全量推送） | 已不推荐；常规流程用 git，见 CONTRIBUTING.md |

---

## 3. 数据模型

```ts
// types/item.ts — 一条耗材条目
interface Item {
  id: string;      // uuid（可换 crypto.randomUUID）
  spd: string;     // SPD 编码，可空
  no: number;      // 序号，自动连续，删除/排序后重排
  name: string;    // 品名（当前允许留空）
  spec: string;    // 规格（当前允许留空，可多行）
  qty: number;     // 请购数，固定 FIXED_QTY = 1
  unit: string;    // 单位，固定 FIXED_UNIT = "套"
  remark: string;  // 备注，可多行
}
```

### 持久化

- 键：`medical-supplies-table.lists.v2`（AppState JSON）。
- 结构：`{ schemaVersion: 2, activeListId, lists: SupplyList[] }`；`SupplyList = { id, name, items, createdAt, updatedAt }`。
- 条目备注（v1.1 起）：`Item.meta?: { patient, admissionNo, dept, doctor }` 为结构化备注；`Item.remark` 始终保存序列化文本（`joinRemark`：非空值以「，」连接），导出/表格显示直接使用 remark；旧数据无 meta，卡片上按自由文本显示。
- 预设：独立键 `medical-supplies-table.presets.v1`，`{ spds, depts, doctors }`；SPD 内置 11 家供货公司名（与 `components/SupplierReference.tsx` 的供应商名单同源，改名单时两处同步）、科室内置「骨一/骨二」、医生内置 10 人名单（均可在「预设管理」增删，清空则回退默认）。
- SPD 多选：`Item.spd` 保持单字符串（「中盛，和佳」格式）；`splitSpd`/`toggleSpd`（types/item.ts）负责拆分与多选切换；导出、桌面表格、复制 SPD 直接使用该字符串。
- **迁移**：v1 键 `medical-supplies-table.items.v1`（单清单数组）在首次加载时自动迁入「默认清单」，迁移成功后删除旧键。
- 时序：挂载时 `loadState()` 水合 → 之后每次 state 变化自动 `saveState()`；**写入失败返回 false，页面 Toast 提示用户备份**（不再静默丢数据）。
- **无多标签页同步**：不支持多开同编辑（REVIEW P3-5）。

### 导入导出格式（DataTransfer）

- 导出「当前清单」：可编辑字段的 JSON 数组 `[{spd,name,spec,remark}]`（与 v1 兼容）。
- 导出「全部清单备份」：`{ app, schemaVersion, lists: [{ name, items: [...] }] }`，用于换机迁移。
- 导入：自动识别两种格式；条目数组 → 替换当前清单，备份对象 → 重建全部清单（id 重新生成、序号重排、qty/unit 强制回填），有覆盖确认。

---

## 4. 关键机制

### 4.1 就地编辑（Cell / CardField）

点击 → 进入编辑态（input / textarea）→ 失焦提交、Enter 提交（多行需 Ctrl/Cmd+Enter）、Esc 取消 → 通过 `onChange(id, patch)` 汇入 page 状态 → 自动持久化。textarea 用 `autoGrow`（height=auto → scrollHeight）。

### 4.2 导出管线（重要）

```
用户点「保存图片」
 → document.fonts.load() 预加载黑体字形（用真实文本 sample 触发 unicode 切片）
 → drawExport(items) 原生 Canvas 2D 绘制
 → canvas.toDataURL('image/png') → <a download> 触发下载
```

- 预览（`ExportTable`）与导出（`drawExport`）是**两条独立渲染路径**，改列宽/配色必须两处同步。
- 画布尺寸：宽 794（A4 @96dpi），SCALE 移动端 2 / 桌面 3（避免超 4096 上限）。
- 垂直居中：`ctx.textBaseline='middle'` + 行块整体居中（`startY = y + (h - textH)/2`）。

### 4.3 Service Worker 缓存策略（public/sw.js）

| 请求类型 | 策略 | 目的 |
|---|---|---|
| 页面导航（HTML） | 缓存优先 + 后台更新（SWR） | 离线即时打开，联网自动拿到新版 |
| 同源静态资源 | 缓存优先，未命中走网络并回写 | 二次访问加速 |
| 跨域字体（.cn 镜像） | 缓存优先 | 首次联网加载后离线也有衬线字体 |
| 其他 | 不拦截 | — |

- 更新机制（**用户确认式**，ADR-15）：SW 文件字节变化 → 新 SW 安装后**进入 waiting（不自动激活）** → 页面弹「新版本已就绪」横幅（立即更新/稍后）与设置里的「确认更新」→ 用户确认后发 `SKIP_WAITING` → 激活 → `controllerchange` → 自动刷新；取消则旧版完整运行、旧缓存不清理。
- **每次改缓存相关代码必须 bump `CACHE` 常量**（`medical-pwa-vN`），确认更新后旧缓存才会被 activate 清理。
- 客户端状态由 `lib/sw-client.ts` 统一管理（updatefound 事件 + 2 秒轮询兜底，防 `reg.waiting` 与 `statechange` 的时序竞态）。

---

## 5. 技术决策记录（ADR 摘要）

> 详细过程见 `.workbuddy/memory/` 工作日志。这里只留结论——**新方案与旧决策冲突时，先在这里追加 ADR 并说明理由，再动代码。**

| # | 决策 | 理由 | 约束 |
|---|---|---|---|
| ADR-1 | 截图导出**弃用 html2canvas，改用原生 Canvas 2D**（2026-08-12，第 11 次迭代） | html2canvas 对 transform 缩放、`<td>` vertical-align、flex 对齐均不可靠，反复修复失败 | 导出内容以 `lib/drawExport.ts` 为准；不要重新引入 html2canvas |
| ADR-2 | 手机端表格**改为卡片布局**（响应式：<640px 卡片，≥640px 保持表格） | 手机窄屏下 8 列表格无法操作 | 两端功能必须对等；改字段时两端同改 |
| ADR-3 | Google Fonts 走**中国镜像** `fonts.googleapis.cn` / `fonts.gstatic.cn`；中文衬线用 **Noto Serif SC** | 国内移动网络下原域名被墙/超时；Source Serif 4 不含中文字形 | 导出字体栈与 body 字体栈两处都要含 CJK 衬线兜底 |
| ADR-4 | GitHub 推送用**自定义脚本走 Git Data API**（历史原因） | 当时沙箱环境无 git 能力、GitHub 连接器只读 | **已被本机制替代**：新流程用正规 git。脚本仅作备用 |
| ADR-5 | 请购数/单位**固定 1 套**，不可编辑；品名/规格**允许留空** | 业务口径（请购单固定数量）；允许草稿式录入 | 若改业务口径，代码（types/item.ts）+ README + 本表同改 |
| ADR-6 | 数据**只存浏览器 localStorage**，无账号、无云端 | 隐私与合规（医疗相关场景），零运维 | 引入任何云端存储前必须重新评估隐私边界，见 SECURITY.md |
| ADR-7 | 序号（no）**随删除/排序自动重排**，始终连续 | 请购单要求序号连续 | 导入也强制重排；不要引入「保留空号」逻辑 |
| ADR-8 | **多清单数据模型**（schemaVersion 2）：用户场景是周六/周日/周一多天清单，单清单 + 备份切换太痛苦 | 2026-08-16 用户需求（频繁备份切换三天清单） | 清单 CRUD + 复制当前清单作模板；导出支持全量备份；旧数据自动迁移 |
| ADR-9 | 手机端交互模型：**底部固定操作栏（添加/导出/更多）+ 弹窗改底部抽屉 + 保留逐字段就地编辑** | 2026-08-16 用户确认的方向：首屏让位给内容，主次操作分层，输入不被键盘遮挡 | 桌面端保持顶部工具栏 + 居中对话框；两端功能对等 |
| ADR-10 | 删除/清空/覆盖导入统一走 **ConfirmDialog**（替代原生 confirm）；不引入撤销（用户明确不要） | 原生弹窗与整体风格割裂；撤销被拒但破坏性操作必须有确认 | danger 操作使用 tailwind `danger` 色 |
| ADR-11 | **行内编辑态无边框化**（`.inline-input`：无 ring/背景/内边距），输入框与展示文本同宽同高 | 2026-08-16 用户反馈：高亮边框使编辑态与展示态尺寸/宽度不一致，交互怪异 | 行内编辑（卡片品名/SPD/规格）一律用 `.inline-input`；抽屉表单（有边框输入框）仍用 `cell-input` |
| ADR-12 | **备注结构化**：病人名字/住院号/预设科室/预设主治医生四字段；预设可增删；`remark` 字符串作为导出与表格显示的唯一来源（由 meta 序列化） | 2026-08-16 用户需求：备注需要结构化录入 + 预设快捷选择，但导出文本保持「名字，住院号，科室，医生」 | 旧自由文本备注兼容（无 meta 时按原文显示）；`drawExport`/`ExportTable` 无需感知 meta |
| ADR-13 | 行内编辑一致性 v2：**品名/SPD 用「下划线表单线」**（展示态淡色线、编辑态主题色线 + 光标，几何零变化）；恢复 `maximumScale: 1` 防 iOS 聚焦缩放跳动 | 2026-08-16 用户反馈：去框化后两种状态仍有视觉跳动 | 行内编辑输入框字号 <16px（SPD 12px/规格 13.5px）依赖 maximumScale 防 iOS 自动缩放；不要再次移除 |
| ADR-14 | **SPD 预设 + 多选**：与科室/医生同机制，预设可经「预设管理」增删；内置 11 家供货公司名；**多选**——点选追加、再点取消，值以「，」合并（`splitSpd`/`toggleSpd`） | 2026-08-16 用户需求：SPD 也要多选按钮输入，选中值逗号合并显示 | SPD 预设存于 presets.v1 的 `spds` 字段（默认 11 家）；`Item.spd` 仍为单字符串（导出/表格/复制 SPD 直接使用） |
| ADR-15 | **PWA 更新用户确认式**：install 不 skipWaiting；新 SW 等待确认；横幅（立即更新/稍后）+ 设置「确认更新」；确认后 controllerchange 自动刷新 | 2026-08-16 用户反馈：自动激活会清旧缓存、离线打开出错；要求缓存优先 + 确认式更新 | 更新检测事件与 `reg.waiting` 存在时序竞态，`sw-client.ts` 用 2 秒轮询兜底；不要恢复自动 skipWaiting |

---

## 6. 历史坑清单（新改动前对照自查）

| 坑 | 表现 | 规避 |
|---|---|---|
| GitHub API 推二进制按 UTF-8 文本读 | PNG 魔数 `89 50 4E 47` 变 `EF BF BD`，图标全坏 | 二进制一律 Buffer + base64；验证文件看**魔数**而非 HTTP 200 |
| 中文要衬线却没加载含 CJK 字形的字体 | 导出/界面中文变黑体 | 必须加载 Noto Serif SC（或自托管），并 `document.fonts.load` 用真实文本触发 |
| 表格列宽/配色两份常量不同步 | 预览与导出不一致 | 改 `ExportTable` 必改 `drawExport`（或抽共享模块，REVIEW P2-1） |
| SW 缓存版本不 bump | 已安装用户旧缓存不清理，更新异常 | 每次发布 bump `CACHE` |
| `next build` 清理 `.next` 时被沙箱 safe-delete 拦截（本机 OneDrive 路径特有） | 构建末尾报错（产物实际完整） | 先删 `.next` 再构建；CI/Vercel 无此问题 |
| 本机 curl 因 TLS 吊销检查报 `CRYPT_E_REVOCATION_OFFLINE` | 网络请求 000 | curl 加 `-k`；脚本设 `NODE_TLS_REJECT_UNAUTHORIZED=0`（仅本机诊断用） |
| 校验线上静态资源只看 HTTP 200 | 图标实际损坏 | 核对 Content-Length + 文件魔数 |
| 截图画布超手机尺寸上限 | iOS 导出失败 | SCALE 移动端保持 2（画布 <4096） |
