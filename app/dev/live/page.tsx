import type { Metadata } from "next";
import { LiveDemo } from "./LiveDemo";

// Playground for the data hooks (#4). Not linked from the book; noindex like the rest of the site.
export const metadata: Metadata = { title: "Live 資料 · ENG曼陀號" };

export default function LivePage() {
  return <LiveDemo />;
}
