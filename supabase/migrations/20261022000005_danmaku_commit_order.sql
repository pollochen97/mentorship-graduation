-- Make danmaku ids become visible in increasing order (review of #37).
-- Identity ids are handed out at insert time, but transactions can commit in another order: if A gets
-- id 67, B gets 68 and commits first, a poller sees 68, moves its `since` cursor past 67, and never
-- fetches A's danmaku once it commits. post_danmaku now takes a global lock right before inserting
-- and holds it until commit, so ids are handed out in commit order. Only accepted danmaku take it
-- (rate-limited requests return earlier), and it is held for a single insert.
-- Same signature as before, so `create or replace` keeps the execute grants from 20261022000002.

create or replace function public.post_danmaku(
  p_client_id text,
  p_ip_hash text,
  p_name text,
  p_body text,
  -- The loose per-IP limit (spec 6.2). A parameter so #17 can tune it without a migration: everyone
  -- at the venue shares one Wi-Fi, so one IP can be hundreds of people.
  p_ip_per_minute int default 120
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  now_at timestamptz;
  wait numeric;
  inserted public.danmaku;
begin
  perform pg_advisory_xact_lock(hashtext('danmaku:' || p_client_id));
  -- Read the clock after the lock: waiting for another request of the same client takes time.
  now_at := clock_timestamp();

  if not coalesce((select value::boolean from public.settings where key = 'danmaku_enabled'), true) then
    return jsonb_build_object('error', 'danmaku_paused');
  end if;

  select greatest(
    -- 1 per 5 seconds per client
    public.rate_limit_wait(array(
      select created_at from public.danmaku
      where client_id = p_client_id and created_at > now_at - interval '5 seconds'
      order by created_at desc limit 1
    ), 1, interval '5 seconds', now_at),
    -- 20 per 10 minutes per client
    public.rate_limit_wait(array(
      select created_at from public.danmaku
      where client_id = p_client_id and created_at > now_at - interval '10 minutes'
      order by created_at desc limit 20
    ), 20, interval '10 minutes', now_at),
    -- p_ip_per_minute per minute per IP
    public.rate_limit_wait(array(
      select created_at from public.danmaku
      where ip_hash = p_ip_hash and created_at > now_at - interval '1 minute'
      order by created_at desc limit p_ip_per_minute
    ), p_ip_per_minute, interval '1 minute', now_at)
  ) into wait;

  if wait > 0 then
    return jsonb_build_object('error', 'rate_limited', 'retry_after', greatest(ceil(wait), 1));
  end if;

  -- One insert at a time across all clients, held until commit: the next danmaku can only get its id
  -- after this one is visible, so ids become visible in order and a poller's cursor never skips one.
  perform pg_advisory_xact_lock(hashtext('danmaku:insert'));

  insert into public.danmaku (name, body, client_id, ip_hash, created_at)
  values (p_name, p_body, p_client_id, p_ip_hash, now_at)
  returning * into inserted;

  return jsonb_build_object('danmaku', to_jsonb(inserted) - 'client_id' - 'ip_hash');
end;
$$;
