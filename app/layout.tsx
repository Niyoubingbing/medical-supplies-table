import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "医用耗材录入表",
  description: "本地存储的医用耗材请购单编辑器，一键导出截图",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 使用 Google Fonts 中国镜像，避免移动网络下 fonts.googleapis.com 被墙导致中文衬线字体加载失败 */}
        <link rel="preconnect" href="https://fonts.googleapis.cn" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.cn"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.cn/css2?family=Source+Serif+4:opsz,wght@8..60,300;8..60,400;8..60,500;8..60,600;8..60,700&family=Noto+Serif+SC:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
