import { Placeholder } from "@/components/book/Placeholder";
import type { PageProps } from "@/components/book/types";

// Empty shell from #3; #9 replaces this file.
export function Staff({ no, label, pageIndex, pageCount }: PageProps) {
  return (
    <Placeholder no={no} label={label} issue={9} pageIndex={pageIndex} pageCount={pageCount} />
  );
}
