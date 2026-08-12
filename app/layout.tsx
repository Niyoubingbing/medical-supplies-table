import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "./sw-register";

export const metadata: Metadata = {
  title: "医用耗材录入表",
  description: "本地存储的医用耗材请购单编辑器，一键导出截图",
  applicationName: "耗材录入",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "耗材录入",
  },
};

export const viewport: Viewport = {
  themeColor: "#C96442",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="耗材录入" />
      </head>
      <body>
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
