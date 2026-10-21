import type { Metadata } from "next";
import { ibmPlexMono, NOTO_SANS_TC_HREF } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "ENG曼陀號結業分享",
  description: "ENG曼陀號 四個月的航海日誌 · 11/07 Sat. 結業發表",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant" className={ibmPlexMono.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={NOTO_SANS_TC_HREF} />
      </head>
      <body>{children}</body>
    </html>
  );
}
