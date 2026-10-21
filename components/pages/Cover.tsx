import { Placeholder } from "@/components/book/Placeholder";
import type { PageProps } from "@/components/book/types";

// Empty shell from #3; #8 replaces this file.
export function Cover({ no, label, pageIndex, pageCount }: PageProps) {
  return (
    <Placeholder no={no} label={label} issue={8} pageIndex={pageIndex} pageCount={pageCount} />
  );
}
