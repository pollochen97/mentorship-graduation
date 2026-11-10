// Demo content (NEXT_PUBLIC_CONTENT=demo, see next.config.ts): made-up 工作人員 with no photos, so the
// page shows each role's sea motif instead. Same roles and count as content/staff.ts.
import type { StaffMember } from "../types";

export const STAFF: StaffMember[] = [
  { role: "船長", name: "阿海" },
  { role: "客座講師", name: "林老師" },
  { role: "引水人", name: "Grace" },
  { role: "引水人", name: "Daniel" },
  { role: "助教", name: "阿凡" },
  { role: "助教", name: "思妤" },
  { role: "助理", name: "Peggy" },
  { role: "助理", name: "Andy" },
  { role: "助理", name: "小安" },
];
