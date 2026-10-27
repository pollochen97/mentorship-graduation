#!/usr/bin/env node
// Load test for danmaku (#21): simulates the guests at the event, each a phone with its own `cid`.
// Every virtual guest opens /danmaku (which hands out the signed cookie, as proxy.ts does for a real
// phone), then sends danmaku at a human pace, waiting out 429s the way the form's countdown makes
// people do. A listener subscribed to the `live` channel plays the projector, to measure how long a
// danmaku takes to reach the screen and whether every accepted one arrives.
//
//   node --env-file=.env.local scripts/loadtest/danmaku.mjs --url http://localhost:3000
//
// See README.md next to this file for the options, the preview run and the cleanup afterwards.
import { createClient } from "@supabase/supabase-js";
import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    url: { type: "string" },
    users: { type: "string", default: "300" },
    duration: { type: "string", default: "300" },
    ramp: { type: "string", default: "60" },
    think: { type: "string", default: "40" },
    "burst-at": { type: "string" },
    ips: { type: "string", default: "0" },
    screens: { type: "string", default: "2" },
    "no-listen": { type: "boolean", default: false },
    out: { type: "string" },
  },
});

if (!args.url) {
  console.error("用法：node scripts/loadtest/danmaku.mjs --url <網站網址> [選項]（見 README.md）");
  process.exit(2);
}
/**
 * A numeric option, checked before anything connects: "5m" or "" would become NaN or 0, and a NaN
 * duration never ends the run.
 */
function option(name, { min, max = Infinity, integer = false }) {
  const value = Number(args[name]);
  const ok =
    args[name].trim() !== "" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max &&
    (!integer || Number.isInteger(value));
  if (!ok) {
    const range = max === Infinity ? ` ${min} 以上` : ` ${min}–${max} 之間`;
    // The non-integer options are all seconds.
    const kind = integer ? "整數" : "秒數（不要加單位）";
    console.error(`--${name} 要是${range}的${kind}，收到「${args[name]}」`);
    process.exit(2);
  }
  return value;
}

const BASE = args.url.replace(/\/$/, "");
const USERS = option("users", { min: 1, integer: true });
const DURATION_S = option("duration", { min: 1 });
const RAMP_S = option("ramp", { min: 0 });
const THINK_S = option("think", { min: 0 });
const BURST_AT_S =
  args["burst-at"] === undefined ? null : option("burst-at", { min: 0, max: DURATION_S });
/** Everyone in the burst sends within this many seconds of it. */
const BURST_SPREAD_S = 10;
// The fake addresses are 10.0.x.y, so at most 256 × 256 of them.
const IPS = option("ips", { min: 0, max: 65_536, integer: true });
/** Projectors subscribed to `live` at the event, for the Realtime estimate. */
const SCREENS = option("screens", { min: 0, integer: true });
/** Supabase's free-plan Realtime limit, in events (sends + receives) per second. */
const REALTIME_EVENTS_PER_S = 100;
const TIMEOUT_MS = 15_000;
/** The form's limits (spec 6.2), used only to tell which limit a 429 came from. */
const CID_GAP_MS = 5_000;
const CID_PER_10_MIN = 20;

/** Name prefix of every test danmaku, so they are easy to find and delete afterwards. */
const NAME_PREFIX = "壓測";
const BODIES = [
  "恭喜結業！",
  "航程順利⛵",
  "大家辛苦了",
  "ENG 最棒",
  "下次見！",
  "感謝導師們",
  "太感動了",
  "好期待成果",
  "Bravo!",
  "一路順風",
];

// Vercel previews behind Deployment Protection let scripts in with this header.
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const baseHeaders = bypass ? { "x-vercel-protection-bypass": bypass } : {};

const start = performance.now();
const elapsed = () => performance.now() - start;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
const pick = (list) => list[Math.floor(Math.random() * list.length)];
/** Exponential think time with mean `THINK_S`, but nobody types a danmaku in under 5 seconds. */
const thinkMs = () => Math.max(5, -Math.log(1 - Math.random()) * THINK_S) * 1000;

const pageLoads = []; // { ms, ok }
const posts = []; // { at, ms, status, kind, id? }
const sentAt = new Map(); // danmaku id → elapsed ms when its POST started
const receivedAt = new Map(); // danmaku id → elapsed ms when the listener got it
const liveStatus = []; // { at, status }

/** One request with a timeout; network failures come back as status 0. */
async function request(path, init = {}) {
  const t0 = elapsed();
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { ...baseHeaders, ...init.headers },
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = await res.text();
    return { t0, ms: elapsed() - t0, status: res.status, headers: res.headers, body };
  } catch (error) {
    return { t0, ms: elapsed() - t0, status: 0, error: error.name ?? String(error) };
  }
}

async function guest(n) {
  // Locally, a fake x-forwarded-for spreads the guests over `IPS` addresses. Vercel replaces the
  // header with the real one, so on a preview everyone is one IP, like a venue behind one Wi-Fi.
  const ipHeader =
    IPS > 0 ? { "x-forwarded-for": `10.0.${(n % IPS) >> 8}.${(n % IPS) & 255}` } : {};
  await sleep((n / USERS) * RAMP_S * 1000);

  const page = await request("/danmaku", { headers: ipHeader });
  const cookie = page.headers
    ?.getSetCookie()
    .find((c) => c.startsWith("cid="))
    ?.split(";")[0];
  pageLoads.push({ ms: page.ms, ok: page.status === 200 && Boolean(cookie) });
  if (!cookie) return;

  const name = `${NAME_PREFIX}${n}`;
  const accepted = []; // elapsed ms of this guest's accepted danmaku
  // When this guest joins the burst ("everyone send a cheer now!"), if there is one.
  const burstAt =
    BURST_AT_S === null ? Infinity : (BURST_AT_S + Math.random() * BURST_SPREAD_S) * 1000;
  let next = elapsed() + 5_000 + Math.random() * 15_000; // reading the page, typing the first one
  let body = pick(BODIES);

  while (true) {
    if (burstAt <= next && burstAt > elapsed()) next = burstAt;
    if (next > DURATION_S * 1000) return;
    await sleep(next - elapsed());

    const r = await request("/api/danmaku", {
      method: "POST",
      headers: { ...ipHeader, cookie, "content-type": "application/json" },
      body: JSON.stringify({ name, body }),
    });
    const entry = { at: r.t0, ms: r.ms, status: r.status, kind: kindOf(r.status) };
    posts.push(entry);

    if (r.status === 201) {
      const id = JSON.parse(r.body).danmaku.id;
      entry.id = id;
      sentAt.set(id, r.t0);
      accepted.push(r.t0);
      body = pick(BODIES);
      next = elapsed() + thinkMs();
    } else if (r.status === 429) {
      // Which limit: this guest's own (5 s, 20 per 10 min) or the shared per-IP one.
      const recent = accepted.filter((t) => t > r.t0 - 600_000);
      const own = r.t0 - (accepted.at(-1) ?? -Infinity) < CID_GAP_MS;
      entry.kind = own || recent.length >= CID_PER_10_MIN ? "429-cid" : "429-ip";
      // The form counts down `retryAfter`; then the guest taps send again, a moment later.
      const wait = Number(r.headers.get("retry-after") ?? 5);
      next = elapsed() + wait * 1000 + 500 + Math.random() * 2500;
    } else {
      next = elapsed() + thinkMs();
    }
  }
}

function kindOf(status) {
  if (status === 201) return "ok";
  if (status === 429) return "429";
  if (status === 0) return "network";
  return String(status);
}

/** Subscribes like the projector does (lib/realtime.ts). Resolves once subscribed, or null. */
async function listen() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("⚠️  沒有 NEXT_PUBLIC_SUPABASE_URL／ANON_KEY，不量投影端收到的延遲");
    return null;
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  await supabase.realtime.setAuth();
  let stopped = false;
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), 15_000);
    const channel = supabase
      .channel("live", { config: { private: true } })
      .on("broadcast", { event: "danmaku:new" }, ({ payload }) => {
        if (!receivedAt.has(payload.id)) receivedAt.set(payload.id, elapsed());
      })
      .subscribe((status) => {
        if (stopped) return; // closing the channel ourselves at the end isn't a dropout
        liveStatus.push({ at: elapsed(), status });
        if (status === "SUBSCRIBED") {
          clearTimeout(timer);
          resolve(() => {
            stopped = true;
            supabase.removeChannel(channel);
          });
        }
      });
  });
}

function percentile(values, p) {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

const ms = (v) => (Number.isNaN(v) ? "—" : `${Math.round(v)} ms`);
const pct = (part, whole) => (whole === 0 ? "—" : `${((part / whole) * 100).toFixed(1)}%`);

function summarize() {
  const count = (kind) => posts.filter((p) => p.kind === kind).length;
  const ok = posts.filter((p) => p.kind === "ok");
  const limitedCid = count("429-cid");
  const limitedIp = count("429-ip");
  const errors = posts.filter((p) => !["ok", "429-cid", "429-ip"].includes(p.kind));
  const errorKinds = Object.groupBy(errors, (p) => p.kind);

  // The busiest second, two ways. Requests that start in different seconds can broadcast in the same
  // one (each waits for the database first), so the request count can understate the Realtime peak;
  // the listener's arrival times show when the broadcasts actually went out.
  const busiestSecond = (times) => {
    const perSecond = new Map();
    for (const t of times)
      perSecond.set(Math.floor(t / 1000), (perSecond.get(Math.floor(t / 1000)) ?? 0) + 1);
    return Math.max(0, ...perSecond.values());
  };
  const peakRequestsPerSecond = busiestSecond(ok.map((p) => p.at));

  const delivered = [...sentAt].filter(([id]) => receivedAt.has(id));
  const delays = delivered.map(([id, t]) => receivedAt.get(id) - t);
  const listened = liveStatus.length > 0;
  // Only this test's danmaku: anything else on `live` (a real guest) isn't load we generated.
  const peakBroadcastsPerSecond = listened
    ? busiestSecond(delivered.map(([id]) => receivedAt.get(id)))
    : null;
  // Without the listener, the request count is the best estimate there is.
  const peakForRealtime = Math.max(peakRequestsPerSecond, peakBroadcastsPerSecond ?? 0);

  return {
    target: BASE,
    options: {
      users: USERS,
      durationS: DURATION_S,
      rampS: RAMP_S,
      thinkS: THINK_S,
      burstAtS: BURST_AT_S,
      ips: IPS,
      screens: SCREENS,
    },
    pageLoads: {
      total: pageLoads.length,
      failed: pageLoads.filter((p) => !p.ok).length,
      p95Ms: percentile(
        pageLoads.map((p) => p.ms),
        95,
      ),
    },
    posts: {
      total: posts.length,
      ok: ok.length,
      limitedCid,
      limitedIp,
      errors: errors.length,
      errorKinds: Object.fromEntries(Object.entries(errorKinds).map(([k, v]) => [k, v.length])),
      p50Ms: percentile(
        posts.map((p) => p.ms),
        50,
      ),
      p95Ms: percentile(
        posts.map((p) => p.ms),
        95,
      ),
      p99Ms: percentile(
        posts.map((p) => p.ms),
        99,
      ),
      okP95Ms: percentile(
        ok.map((p) => p.ms),
        95,
      ),
      okPerMinute: ok.length / (DURATION_S / 60),
      peakOkPerSecond: peakRequestsPerSecond,
      perHalfMinute: Array.from({ length: Math.ceil(DURATION_S / 30) }, (_, i) => {
        const inSlot = posts.filter((p) => Math.floor(p.at / 30_000) === i);
        return {
          fromS: i * 30,
          ok: inSlot.filter((p) => p.kind === "ok").length,
          total: inSlot.length,
        };
      }),
    },
    live: {
      listened,
      received: delays.length,
      missing: listened ? ok.length - delays.length : null,
      p50Ms: percentile(delays, 50),
      p95Ms: percentile(delays, 95),
      peakPerSecond: peakBroadcastsPerSecond,
      statusChanges: liveStatus,
    },
    // Supabase counts each broadcast once as it is sent and once more per subscriber receiving it.
    realtime: {
      screens: SCREENS,
      peakBroadcastsPerSecond: peakForRealtime,
      measured: listened,
      peakEventsPerSecond: peakForRealtime * (1 + SCREENS),
      peakEventsPerSecondInTest: peakForRealtime * (1 + SCREENS + (listened ? 1 : 0)),
      limitPerSecond: REALTIME_EVENTS_PER_S,
    },
  };
}

function report(s) {
  const p = s.posts;
  const lines = [
    "",
    "══════ 彈幕壓力測試結果 ══════",
    `目標：${s.target}`,
    `模擬：${USERS} 人、${DURATION_S} 秒、${RAMP_S} 秒內陸續進場、平均每 ${THINK_S} 秒送一則` +
      (BURST_AT_S === null ? "" : `、第 ${BURST_AT_S} 秒全場一起送`) +
      (IPS > 0 ? `、分散在 ${IPS} 個假 IP（只在本機有效）` : "、全部同一個 IP"),
    "",
    `開啟 /danmaku：${s.pageLoads.total} 次，失敗 ${s.pageLoads.failed}，p95 ${ms(s.pageLoads.p95Ms)}`,
    "",
    `送出彈幕：${p.total} 次`,
    `  成功 201        ${p.ok}（${pct(p.ok, p.total)}）`,
    `  429 個人限流    ${p.limitedCid}（${pct(p.limitedCid, p.total)}）`,
    `  429 IP 限流     ${p.limitedIp}（${pct(p.limitedIp, p.total)}）`,
    `  其他錯誤        ${p.errors}（${pct(p.errors, p.total)}）${p.errors ? " " + JSON.stringify(p.errorKinds) : ""}`,
    `  延遲 p50 ${ms(p.p50Ms)}、p95 ${ms(p.p95Ms)}、p99 ${ms(p.p99Ms)}（成功的 p95 ${ms(p.okP95Ms)}）`,
    `  上牆量：平均每分鐘 ${p.okPerMinute.toFixed(0)} 則，最忙的一秒（依送出時間）${p.peakOkPerSecond} 則`,
    "",
    "  每 30 秒（成功／送出）：",
    ...p.perHalfMinute.map(
      (b) => `    ${String(b.fromS).padStart(4)}s  ${String(b.ok).padStart(4)} / ${b.total}`,
    ),
    "",
  ];
  if (s.live.listened) {
    const drops = s.live.statusChanges.filter((c) => c.status !== "SUBSCRIBED");
    lines.push(
      `投影端（Realtime）：收到 ${s.live.received} / ${p.ok} 則，漏掉 ${s.live.missing}`,
      `  送出到收到 p50 ${ms(s.live.p50Ms)}、p95 ${ms(s.live.p95Ms)}`,
      `  最忙的一秒（依收到時間）${s.live.peakPerSecond} 則`,
      `  斷線 ${drops.length} 次${drops.length ? "：" + drops.map((d) => `${(d.at / 1000).toFixed(0)}s ${d.status}`).join("、") : ""}`,
      "",
    );
  }
  const rt = s.realtime;
  lines.push(
    `估計 Realtime 事件量（每則 = 送出 1 + 每個訂閱者各收 1）：`,
    ...(rt.measured ? [] : ["  ⚠️ 沒有監聽投影端，最忙的一秒只能用送出時間估計，可能偏低"]),
    `  活動當天：最忙的一秒 ${rt.peakBroadcastsPerSecond} × (1 + ${rt.screens} 台投影機) = ${rt.peakEventsPerSecond} 個/秒` +
      (rt.peakEventsPerSecond > rt.limitPerSecond ? " ⚠️ 超過" : "") +
      `；免費方案上限每秒 ${rt.limitPerSecond} 個`,
    `  這次測試（多算這支監聽）：${rt.peakEventsPerSecondInTest} 個/秒`,
  );
  console.log(lines.join("\n"));
}

const stopListening = args["no-listen"] ? null : await listen();
if (!args["no-listen"] && !stopListening) console.warn("⚠️  訂閱 live 頻道失敗，不量投影端延遲");
console.log(`開始：${USERS} 人，${DURATION_S} 秒 → ${BASE}`);

const progress = setInterval(() => {
  const ok = posts.filter((p) => p.kind === "ok").length;
  const limited = posts.filter((p) => p.kind.startsWith("429")).length;
  console.log(
    `  ${(elapsed() / 1000).toFixed(0).padStart(4)}s  送出 ${posts.length}、成功 ${ok}、429 ${limited}、投影端收到 ${receivedAt.size}`,
  );
}, 30_000);

await Promise.all(Array.from({ length: USERS }, (_, i) => guest(i + 1)));
clearInterval(progress);
// Give the last broadcasts a moment to arrive.
await sleep(5_000);
stopListening?.();

const summary = summarize();
report(summary);
if (args.out) {
  await writeFile(args.out, JSON.stringify(summary, null, 2));
  console.log(`\n詳細結果寫到 ${args.out}`);
}
process.exit(0);
