import { IBM_Plex_Mono, Noto_Sans_TC } from "next/font/google";

// Exposed as CSS variables; design tokens (#2) build the font stacks on top of them.
export const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  weight: ["400", "500", "700"],
  display: "swap",
  preload: false, // CJK fonts are split into many files; preloading all of them hurts first paint
});

export const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});
