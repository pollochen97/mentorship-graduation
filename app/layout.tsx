import type { Metadata } from "next";
import { ibmPlexMono, notoSansTC } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "ENG曼陀號結業分享",
  description: "ENG曼陀號 四個月的航海日誌 · 11/07 Sat. 結業發表",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant" className={`${notoSansTC.variable} ${ibmPlexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
