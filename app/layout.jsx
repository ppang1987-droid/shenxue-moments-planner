import "./globals.css";

export const metadata = {
  title: "申学 Family 朋友圈每日规划台",
  description: "独立版朋友圈热点规划和素材生成工具"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
