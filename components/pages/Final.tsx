import { Placeholder } from "@/components/book/Placeholder";
import type { PageProps } from "@/components/book/types";

// Empty shell from #3; #12 replaces this file.
export function Final({ no, label, pageIndex, pageCount }: PageProps) {
  return (
    <Placeholder no={no} label={label} issue={12} pageIndex={pageIndex} pageCount={pageCount} />
  );
}
