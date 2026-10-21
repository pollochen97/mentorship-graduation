import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import {
  Button,
  Panel,
  PhotoGrid,
  Stamp,
  Tag,
  type Photo,
  type PhotoLayout,
} from "@/components/ui";
import { ModalDemo } from "./ModalDemo";
import styles from "./page.module.css";
import s1 from "./samples/sample-1.jpg";
import s2 from "./samples/sample-2.jpg";
import s3 from "./samples/sample-3.jpg";
import s4 from "./samples/sample-4.jpg";
import s5 from "./samples/sample-5.jpg";
import s6 from "./samples/sample-6.jpg";

// Component preview for the team (#2). Not linked from the book; noindex like the rest of the site.
export const metadata: Metadata = { title: "UI 元件 · ENG曼陀號" };

const PHOTOS: Photo[] = [s1, s2, s3, s4, s5, s6].map((src, i) => ({
  src,
  alt: `範例照片 ${i + 1}`,
}));

const COLORS = [
  ["--ink", "#111111", "線條、文字"],
  ["--paper", "#fdf5e2", "書頁底色"],
  ["--white", "#ffffff", "照片框、卡片"],
  ["--muted", "#4b4a46", "次要文字"],
  ["--yellow", "#f5c13f", "強調色"],
  ["--mint", "#a9d8b8", "強調色"],
  ["--pink", "#f4c4f6", "強調色"],
  ["--blue", "#9ccbf2", "強調色"],
] as const;

const TYPES = [
  ["--type-display", "封面大標", "我們的四個月航程"],
  ["--type-title", "章節標題", "第一次月會"],
  ["--type-heading", "小標題", "留言板 · 卓越工程師"],
  ["--type-stat", "數字", "112"],
  ["--type-body", "內文", "分組、定目標、認識彼此的專長。白板寫滿了，便利貼也用完了兩包。"],
  ["--type-small", "小字", "便條紙內容、卡片說明"],
  ["--type-meta", "日期、等寬資訊", "2026.07.26"],
  ["--type-label", "標籤", "LOG 06 · 卓越工程師"],
] as const;

const LAYOUTS: { layout: PhotoLayout; count: number; note: string }[] = [
  { layout: "hero", count: 1, note: "1 張" },
  { layout: "grid2", count: 2, note: "2 張" },
  { layout: "grid3", count: 4, note: "6 格，只給 4 張時其餘顯示佔位" },
  { layout: "mosaic", count: 3, note: "3 張，第一張佔兩列" },
];

/** A 16:9 book page with container units, so components render at their real proportions. */
function BookPage({ children, tone = "paper" }: { children: ReactNode; tone?: string }) {
  return (
    <div className={styles.page} style={{ background: `var(--${tone})` }}>
      <div className={styles.pi}>{children}</div>
    </div>
  );
}

export default function UiPreview() {
  return (
    <main className={styles.main}>
      <header className={styles.intro}>
        <h1>UI 元件</h1>
        <p>
          #2 的 design tokens 和共用元件。tokens 在 <code>app/globals.css</code>，元件在{" "}
          <code>components/ui/</code>，用{" "}
          <code>import {"{ Panel, Tag }"} from &quot;@/components/ui&quot;</code>{" "}
          引入。下面的白框都是 16:9 的書頁，縮放視窗時字和線條會跟著書頁一起縮放。
        </p>
      </header>

      <section className={styles.section}>
        <h2>組合範例：章節頁</h2>
        <BookPage>
          <div className={styles.side}>
            <Tag no={6} tone="blue">
              卓越工程師
            </Tag>
            <h3 className={styles.title}>第一次月會</h3>
            <Stamp label="Port of call">2026.07.26</Stamp>
            <p className={styles.body}>
              分組、定目標、認識彼此的專長。白板寫滿了，便利貼也用完了兩包。
            </p>
            <div className={styles.stats}>
              {[
                ["112", "報名人數", "yellow"],
                ["24", "錄取水手", "mint"],
                ["2", "天面試", "pink"],
              ].map(([n, label, tone]) => (
                <Panel key={label} tone={tone as "yellow"} shadow="sm" className={styles.stat}>
                  <b>{n}</b>
                  {label}
                </Panel>
              ))}
            </div>
          </div>
          <div className={styles.mainCol}>
            <PhotoGrid layout="mosaic" photos={PHOTOS} />
          </div>
        </BookPage>
      </section>

      <section className={styles.section}>
        <h2>色彩</h2>
        <div className={styles.swatches}>
          {COLORS.map(([token, hex, use]) => (
            <div key={token} className={styles.swatch}>
              <span style={{ background: `var(${token})` }} />
              <code>{token}</code>
              <small>
                {hex} · {use}
              </small>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>字級</h2>
        <p className={styles.note}>
          用法：<code>font: var(--type-title);</code>。這些字級只適用於書頁內；手機頁面（例如{" "}
          <code>/danmaku</code>）請用一般的 px 或 rem。
        </p>
        <BookPage>
          <dl className={styles.types}>
            {TYPES.map(([token, use, sample]) => (
              <div key={token}>
                <dt>
                  <code>{token}</code> {use}
                </dt>
                <dd style={{ font: `var(${token})` } as CSSProperties}>{sample}</dd>
              </div>
            ))}
          </dl>
        </BookPage>
      </section>

      <section className={styles.section}>
        <h2>元件</h2>
        <BookPage>
          <div className={styles.specimens}>
            <div className={styles.row}>
              <span className={styles.caption}>Tag</span>
              <Tag no={6}>卓越工程師</Tag>
              <Tag no={7} tone="mint">
                SSD 開發流程
              </Tag>
              <Tag no={8} tone="pink">
                PM x ENG
              </Tag>
              <Tag no={9} tone="blue">
                FINAL
              </Tag>
              <Tag tone="ink">LOGBOOK · VOYAGE 2026</Tag>
            </div>
            <div className={styles.row}>
              <span className={styles.caption}>Stamp</span>
              <Stamp>2026.07.26</Stamp>
              <Stamp label="Port of call" tilt={4}>
                Keelung
              </Stamp>
              <Stamp shape="round" label="Customs" tilt={-12}>
                11/07
              </Stamp>
            </div>
            <div className={styles.row}>
              <span className={styles.caption}>Panel</span>
              <Panel shadow="sm">shadow sm</Panel>
              <Panel>shadow md（預設）</Panel>
              <Panel shadow="lg" tone="yellow">
                shadow lg · yellow
              </Panel>
              <Panel shadow="none" tone="mint">
                none · mint
              </Panel>
            </div>
            <div className={styles.row}>
              <span className={styles.caption}>Button</span>
              <span className={styles.buttons}>
                <Button>送出</Button>
                <Button variant="secondary">取消</Button>
                <Button disabled>停用</Button>
              </span>
            </div>
            <div className={styles.row}>
              <span className={styles.caption}>Modal</span>
              <span className={styles.buttons}>
                <ModalDemo />
              </span>
            </div>
          </div>
        </BookPage>
      </section>

      <section className={styles.section}>
        <h2>PhotoGrid</h2>
        <p className={styles.note}>
          照片用 <code>next/image</code>，會填滿父元素，所以父元素要有高度。
        </p>
        <div className={styles.layouts}>
          {LAYOUTS.map(({ layout, count, note }) => (
            <figure key={layout} className={styles.layout}>
              <BookPage>
                <PhotoGrid layout={layout} photos={PHOTOS.slice(0, count)} />
              </BookPage>
              <figcaption>
                <code>{layout}</code> · {note}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
