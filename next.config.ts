import type { NextConfig } from "next";

// The public demo site (NEXT_PUBLIC_CONTENT=demo, with NEXT_PUBLIC_USE_MOCK=1) swaps the people and
// photos in content/ for the made-up ones in content/demo/. Aliased at build time rather than chosen
// at runtime, so the real names and photos never reach the demo's bundle.
const DEMO_CONTENT = ["sailors", "staff", "sections", "projects"];
const demo = process.env.NEXT_PUBLIC_CONTENT === "demo";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    resolveAlias: demo
      ? Object.fromEntries(
          DEMO_CONTENT.map((name) => [`@/content/${name}`, `./content/demo/${name}.ts`]),
        )
      : {},
  },
  // The site stays public after the event but must not show up in search results.
  // Keep robots.txt free of `Disallow`, or crawlers never see this header.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
