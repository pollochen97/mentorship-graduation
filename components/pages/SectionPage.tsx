import { Placeholder } from "@/components/book/Placeholder";
import type { PageProps } from "@/components/book/types";

// Empty shell from #3; #11 replaces this file.
export function SectionPage({ no, label, pageIndex, pageCount }: PageProps) {
  return (
    <Placeholder no={no} label={label} issue={11} pageIndex={pageIndex} pageCount={pageCount} />
  );
}
