# 医用耗材录入表

本地存储的医用耗材请购单编辑器 — 数据保存在浏览器，刷新不丢失，支持就地编辑、一键导出截图。

## 功能

- **本地存储** — 数据写入 `localStorage`，无需后端、无需登录
- **就地编辑** — 点击表格任意单元格即可编辑，回车保存，Esc 取消
- **添加条目** — 弹窗表单，请购数与单位已固定为「1 套」
- **删除条目** — 行尾 × 按钮，删除后序号自动重新编号
- **一键导出截图** — 仅导出表格主体区域为 PNG，文件名带时间戳

## 字段

| 字段 | 说明 |
|---|---|
| SPD | 可填编码/分类，可留空 |
| 序号 | 自动递增，删除后重排 |
| 品名 | 必填 |
| 规格 | 必填，可多行 |
| 请购数 | 固定 1（不可改） |
| 单位 | 固定「套」（不可改） |
| 备注 | 可填，可多行 |

## 技术栈

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- html2canvas（截图导出）
- Source Serif 4（Google Fonts 衬线字体）

## 本地开发

```bash
npm install --registry=https://registry.npmmirror.com/
npm run dev
```

打开 http://localhost:3000

## 部署

任意支持 Next.js 的平台（推荐 Vercel）：

```bash
npm run build
```
