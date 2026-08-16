# 医用耗材录入表

本地存储的医用耗材请购单编辑器 — 数据保存在浏览器，刷新不丢失，支持就地编辑、拖拽排序、一键导出高清 PNG，可安装为 PWA 离线使用。

线上地址：https://medical-supplies-table.vercel.app

## 功能

- **本地存储** — 数据写入 `localStorage`，无需后端、无需登录、不上传服务器
- **多清单** — 新建/切换/重命名/复制/删除清单；周六、周日、周一各一份，互相复制做模板，不再来回备份切换（旧数据自动迁移）
- **就地编辑** — 桌面为表格、手机（<640px）为卡片；点击字段即可编辑，回车保存，Esc 取消
- **添加/编辑/删除条目** — 底部抽屉表单；请购数与单位固定为「1 套」；删除/清空均有确认
- **拖拽排序** — 支持拖拽与 ▲▼ 微调，保存后序号自动重排
- **一键导出截图** — 原生 Canvas 绘制，仅导出表格主体为高清 PNG（约 A4 宽度），文件名含清单名与时间戳
- **SPD 列一键复制** — 格式「SPD 器械申请」+ 逐行「序号 <SPD>」
- **数据导入/导出** — 当前清单或全部清单备份，粘贴到其它设备恢复（导入前有覆盖确认）
- **供货目录** — 右下角悬浮面板，按供应商查看品牌参考，录入时可对照
- **PWA** — 可安装到主屏；Service Worker 提供离线外壳与新版本更新提示

## 字段

| 字段 | 说明 |
|---|---|
| SPD | 可填编码/分类，可留空 |
| 序号 | 自动递增，删除/排序后自动重排 |
| 品名 | 可留空（支持多行） |
| 规格 | 可留空（支持多行） |
| 请购数 | 固定 1（不可改） |
| 单位 | 固定「套」（不可改） |
| 备注 | 可填，可多行 |

## 技术栈

- Next.js 14 (App Router) + TypeScript（strict）
- Tailwind CSS
- 原生 Canvas 2D 导出（已弃用 html2canvas，见 `docs/ARCHITECTURE.md` ADR-1）
- PWA：manifest + Service Worker（缓存优先，离线可用）
- Noto Serif SC / Source Serif 4（经 Google Fonts 中国镜像加载，中文衬线）

## 本地开发

```bash
npm install --registry=https://registry.npmmirror.com/
npm run dev
```

打开 http://localhost:3000（开发环境不注册 Service Worker，不影响调试）。

提 PR 前自检：

```bash
npx tsc --noEmit
npm run build
```

> 本机在 OneDrive 路径下构建末尾可能报 `.next` 清理错误（safe-delete 沙箱拦截，产物实际完整）：先手动删除 `.next` 再构建即可，CI/Vercel 无此问题。

## 部署

### Vercel（当前方式，已接好 GitHub → Vercel 自动部署）

项目关联 GitHub 仓库 `Niyoubingbing/medical-supplies-table`，`main` 分支 push / PR 合并后自动构建上线。

- 推荐流程：本地 `git push`（或经 PR 合并）→ Vercel 自动构建 → 按 `docs/RELEASE.md` 执行发布冒烟
- 备用通道：无 git 环境的机器可用 `push-to-github.mjs`（需 PAT 环境变量，见 `SECURITY.md`）

### 其他平台

任意支持 Next.js 的平台均可：

```bash
npm run build
```

## 文档导航

| 文档 | 用途 |
|---|---|
| `docs/PROJECT-MANAGEMENT.md` | 项目管理机制（角色、流程、质量门禁、知识管理） |
| `docs/REVIEW.md` | 项目审查报告与修复路线图 |
| `docs/ARCHITECTURE.md` | 架构、数据模型、技术决策（ADR）、历史坑清单 |
| `docs/RELEASE.md` | 版本规则与发布流程（含冒烟清单） |
| `docs/SUPPLIER-DATA.md` | 供货目录数据维护指南 |
| `CONTRIBUTING.md` | 贡献指南（工作流、提交规范、AI 协作规范） |
| `CHANGELOG.md` | 变更历史 |
| `SECURITY.md` | 数据边界与安全事项 |

## 参与贡献

见 `CONTRIBUTING.md`。问题与需求请用 Issue 模板提交（bug / feature）。

## 数据说明

所有数据仅保存在您的浏览器本地（支持多个清单，如周六/周日/周一清单），请定期使用「数据导入/导出」备份。
