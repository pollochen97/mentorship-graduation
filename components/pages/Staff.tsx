import Image from "next/image";
import type { PageProps } from "@/components/book/types";
import { Tag, type Accent } from "@/components/ui";
import { STAFF } from "@/content/staff";
import type { StaffMember } from "@/content/types";
import { ICONS } from "./sailors/Avatar";
import type { AvatarIcon } from "./sailors/avatars";
import styles from "./staff/Staff.module.css";

/** Cards per row; the grid is 5 × 2. */
const COLS = 5;
/** People per page. More than this and the chapter takes another page. */
const PER_PAGE = COLS * 2;

/** The 助教 start a new row, so 船長, 客座講師 and 引水人 keep the top row; null is an empty slot. */
const firstAssistant = STAFF.findIndex((member) => member.role === "助教");
const SLOTS: (StaffMember | null)[] =
  firstAssistant > 0
    ? [
        ...STAFF.slice(0, firstAssistant),
        ...Array<null>((COLS - (firstAssistant % COLS)) % COLS).fill(null),
        ...STAFF.slice(firstAssistant),
      ]
    : STAFF;

/** For the page registry (pages.ts), so a longer list gets its pages without touching it again. */
export const STAFF_PAGES = Math.max(1, Math.ceil(SLOTS.length / PER_PAGE));

/** Each role gets its own label colour and, for people without a photo, its own sea motif. */
const ROLES: Record<string, { tone: Accent; icon: AvatarIcon }> = {
  船長: { tone: "yellow", icon: "wheel" },
  引水人: { tone: "blue", icon: "lighthouse" },
  助教: { tone: "mint", icon: "compass" },
  客座講師: { tone: "pink", icon: "gull" },
};
const OTHER_ROLE = { tone: "yellow", icon: "anchor" } as const;

function Portrait({ member }: { member: StaffMember }) {
  const { tone, icon } = ROLES[member.role] ?? OTHER_ROLE;
  return (
    <span className={styles.portrait} data-tone={tone}>
      {member.photo ? (
        <Image src={member.photo} alt="" fill sizes="22vw" className={styles.photo} />
      ) : (
        <svg
          viewBox="0 0 64 64"
          className={styles.icon}
          aria-hidden
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {ICONS[icon]}
        </svg>
      )}
    </span>
  );
}

/** 工作人員: role, name and a one-line intro for everyone in content/staff.ts, 10 to a page. */
export function Staff({ no, label, pageIndex, pageCount }: PageProps) {
  const onPage = SLOTS.slice(pageIndex * PER_PAGE, (pageIndex + 1) * PER_PAGE);
  // If anyone on the page has an intro, every card keeps room for one, so the portraits line up.
  const withIntros = onPage.some((member) => member?.intro);

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <Tag no={no} tone="mint">
          STAFF
        </Tag>
        <h2 className={styles.title}>{label}</h2>
        <p className={styles.hint}>
          {STAFF.length} 位工作人員
          {pageCount > 1 && ` · ${pageIndex + 1} / ${pageCount}`}
        </p>
      </header>
      <ul className={styles.grid}>
        {onPage.map((member, i) =>
          member === null ? (
            <li key={`gap-${i}`} aria-hidden />
          ) : (
            <li key={`${member.role}-${member.name}`} className={styles.card}>
              <Portrait member={member} />
              <div className={styles.body}>
                <span className={styles.role} data-tone={(ROLES[member.role] ?? OTHER_ROLE).tone}>
                  {member.role}
                </span>
                <span className={styles.name}>{member.name}</span>
                {withIntros && <p className={styles.intro}>{member.intro}</p>}
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
