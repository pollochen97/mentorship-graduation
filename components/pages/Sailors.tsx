import { Placeholder } from "@/components/book/Placeholder";
import type { PageProps } from "@/components/book/types";

// Empty shell from #3; #10 replaces this file.
export function Sailors({ no, label, pageIndex, pageCount }: PageProps) {
  return (
    <Placeholder no={no} label={label} issue={10} pageIndex={pageIndex} pageCount={pageCount} />
  );
}
