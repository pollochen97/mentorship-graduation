import { Placeholder } from "@/components/book/Placeholder";
import type { PageProps } from "@/components/book/types";

// Empty shell from #3; #13 replaces this file.
export function GroupPhoto({ no, label, pageIndex, pageCount }: PageProps) {
  return (
    <Placeholder no={no} label={label} issue={13} pageIndex={pageIndex} pageCount={pageCount} />
  );
}
