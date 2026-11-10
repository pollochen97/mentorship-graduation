-- 11/07 結業活動的彈幕與留言統計，給作品集和 case study 用。
--
-- 在 Supabase Dashboard → SQL Editor 執行。SQL Editor 一次只顯示「最後一個」查詢的結果，
-- 所以請一次選取一段（反白後按 Run），不要整份一起跑。三段都只有 SELECT，不會改到資料。
--
-- 隱私：A、B 只輸出統計數字和時間，不輸出 name、client_id、ip_hash、email。
-- C 會輸出彈幕內容，公開前請自己看過。


-- ============================================================================================
-- A. 先看資料分布在哪些時段，用來決定 B 的活動時間範圍（台北時間，每小時一列）
--    如果活動前有測試資料，或壓測資料沒刪乾淨，這裡會看得出來。
-- ============================================================================================
select
  to_char(date_trunc('hour', created_at at time zone 'Asia/Taipei'), 'YYYY-MM-DD HH24:00') as hour_taipei,
  count(*) as danmaku,
  count(*) filter (where name like '壓測%') as loadtest_rows,
  count(distinct client_id) as senders
from public.danmaku
group by 1
order by 1;


-- ============================================================================================
-- B. 活動統計，輸出一格 JSON（點開那一格 → 複製，整段貼回來即可）
--    先依 A 的結果修改下面 params 的 t0 / t1（台北時間）。
-- ============================================================================================
with params as (
  select
    '2026-11-07 13:00 Asia/Taipei'::timestamptz as t0,  -- 活動開始（含）
    '2026-11-07 14:00 Asia/Taipei'::timestamptz as t1   -- 活動結束（不含）
),
-- 活動時段內的彈幕，排除壓測資料。流量統計包含被隱藏的彈幕（它們一樣有送進系統）。
d as (
  select dm.*
  from public.danmaku dm, params p
  where dm.created_at >= p.t0 and dm.created_at < p.t1
    and dm.name not like '壓測%'
),
per_sender as (
  select client_id, count(*) as n from d group by client_id
),
per_minute as (
  select date_trunc('minute', created_at) as m, count(*) as n, count(distinct client_id) as senders
  from d group by 1
),
minutes as (
  select generate_series(
    (select date_trunc('minute', min(created_at)) from d),
    (select date_trunc('minute', max(created_at)) from d),
    interval '1 minute'
  ) as m
),
timeline as (
  select
    mi.m,
    coalesce(pm.n, 0) as n,
    coalesce(pm.senders, 0) as senders,
    sum(coalesce(pm.n, 0)) over (order by mi.m) as cumulative
  from minutes mi left join per_minute pm using (m)
),
-- 同一人連續兩則的間隔。限流沒有記錄被擋下的請求，只能從「剛好等滿 5 秒就再送」間接推估。
gaps as (
  select created_at - lag(created_at) over (partition by client_id order by created_at) as gap
  from d
),
-- 每則彈幕送出時，同一人過去 10 分鐘內（含這則）共送了幾則。達到 20 表示碰到「10 分鐘 20 則」上限。
sender_window as (
  select client_id,
    count(*) over (partition by client_id order by created_at
                   range between interval '10 minutes' preceding and current row) as c
  from d
),
-- 每則彈幕送出時，同一個 IP 過去 1 分鐘內共送了幾則。對照每 IP 每分鐘 120 則的上限（現場大家共用 Wi-Fi）。
ip_window as (
  select ip_hash,
    count(*) over (partition by ip_hash order by created_at
                   range between interval '1 minute' preceding and current row) as c
  from d
),
per_ip as (
  select ip_hash, count(*) as n from d group by ip_hash
),
v as (
  select * from d where hidden_at is null
)
select jsonb_build_object(
  'window_taipei', (select jsonb_build_object(
      't0', to_char(t0 at time zone 'Asia/Taipei', 'YYYY-MM-DD HH24:MI'),
      't1', to_char(t1 at time zone 'Asia/Taipei', 'YYYY-MM-DD HH24:MI')) from params),

  'overview', (select jsonb_build_object(
      'total', count(*),
      'visible', count(*) filter (where hidden_at is null),
      'hidden', count(*) filter (where hidden_at is not null),
      'senders', count(distinct client_id),
      'distinct_ips', count(distinct ip_hash),
      'first_at', to_char(min(created_at) at time zone 'Asia/Taipei', 'HH24:MI:SS'),
      'last_at', to_char(max(created_at) at time zone 'Asia/Taipei', 'HH24:MI:SS'),
      'active_minutes', (select count(*) from per_minute)
    ) from d),

  'per_sender', (select jsonb_build_object(
      'avg', round(avg(n), 2),
      'median', percentile_cont(0.5) within group (order by n),
      'p90', percentile_cont(0.9) within group (order by n),
      'max', max(n)
    ) from per_sender),

  'sender_buckets', (select jsonb_agg(jsonb_build_object('bucket', bucket, 'senders', senders) order by sort)
    from (
      select
        case when n = 1 then '1' when n <= 3 then '2-3' when n <= 5 then '4-5'
             when n <= 10 then '6-10' when n <= 20 then '11-20' else '21+' end as bucket,
        min(n) as sort,
        count(*) as senders
      from per_sender group by 1
    ) b),

  'peaks', jsonb_build_object(
    'busiest_minute', (select jsonb_build_object(
        'at', to_char(m at time zone 'Asia/Taipei', 'HH24:MI'), 'danmaku', n, 'senders', senders)
      from per_minute order by n desc, m limit 1),
    'busiest_10s', (select jsonb_build_object(
        'at', to_char(b at time zone 'Asia/Taipei', 'HH24:MI:SS'), 'danmaku', n)
      from (select date_bin('10 seconds', created_at, '2000-01-01'::timestamptz) as b, count(*) as n
            from d group by 1) x
      order by n desc, b limit 1),
    'busiest_second', (select jsonb_build_object(
        'at', to_char(s at time zone 'Asia/Taipei', 'HH24:MI:SS'), 'danmaku', n)
      from (select date_trunc('second', created_at) as s, count(*) as n from d group by 1) x
      order by n desc, s limit 1)
  ),

  'rate_limit_signals', jsonb_build_object(
    -- 間隔 5–6 秒：限流是每人每 5 秒 1 則，這些多半是等倒數結束立刻再送。
    'gaps_total', (select count(gap) from gaps),
    'gaps_5_to_6s', (select count(*) from gaps where gap >= interval '5 seconds' and gap < interval '6 seconds'),
    'median_gap_seconds', (select round(extract(epoch from percentile_cont(0.5) within group (order by gap))::numeric, 1) from gaps),
    'senders_hit_20_per_10min', (select count(distinct client_id) from sender_window where c >= 20),
    'max_per_ip_per_minute', (select max(c) from ip_window),
    'top_ip_share', (select round(max(n)::numeric / nullif(sum(n), 0), 3) from per_ip)
  ),

  'content', (select jsonb_build_object(
      'avg_body_chars', round(avg(char_length(body)), 1),
      'bodies_at_20_char_limit', count(*) filter (where char_length(body) = 20),
      'distinct_bodies', count(distinct body)
    ) from v),

  'timeline_per_minute', (select jsonb_agg(jsonb_build_object(
      't', to_char(m at time zone 'Asia/Taipei', 'HH24:MI'),
      'n', n, 'senders', senders, 'cum', cumulative) order by m)
    from timeline),

  -- 留言板不限活動時段（可能活動前就開放），一起列出時間範圍。
  'notes', (select jsonb_build_object(
      'total', count(*),
      'visible', count(*) filter (where hidden_at is null),
      'writers', count(distinct coalesce(user_id::text, client_id)),
      'by_section', (select jsonb_object_agg(section, n)
                     from (select section, count(*) as n from public.notes
                           where hidden_at is null group by section) s),
      'first_at', to_char(min(created_at) at time zone 'Asia/Taipei', 'YYYY-MM-DD HH24:MI'),
      'last_at', to_char(max(created_at) at time zone 'Asia/Taipei', 'YYYY-MM-DD HH24:MI')
    ) from public.notes)
) as stats;


-- ============================================================================================
-- C.（選用）重複最多次的彈幕內容，只看沒被隱藏的。會輸出內容，公開前請自己過濾。
--    時間範圍和 B 一樣，請一起修改。
-- ============================================================================================
select body, count(*) as times, count(distinct client_id) as senders
from public.danmaku
where created_at >= '2026-11-07 13:00 Asia/Taipei'::timestamptz
  and created_at <  '2026-11-07 14:00 Asia/Taipei'::timestamptz
  and name not like '壓測%'
  and hidden_at is null
group by body
having count(*) >= 2
order by times desc, body
limit 30;
