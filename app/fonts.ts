import { IBM_Plex_Mono } from "next/font/google";

// Exposed as CSS variables; design tokens (#2) build the font stacks on top of them.
//
// Noto Sans TC is NOT loaded through next/font: Google splits CJK fonts into hundreds of
// unicode-range files, and downloading them all at build time (over 1,000 for three weights)
// makes Turbopack fail intermittently ("next/font/google queries have exactly one entry").
// It is loaded at runtime instead; see NOTO_SANS_TC_HREF and --font-noto-sans-tc in globals.css.
export const NOTO_SANS_TC_HREF =
  "https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap";

export const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});
