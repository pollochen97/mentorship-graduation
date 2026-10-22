-- Rate-limited inserts for danmaku and notes (spec 6.2, #5). Serverless functions can't keep counters
-- in memory, so the limits are checked in Postgres: lock the client's id, look at its recent rows,
-- and insert only if they pass, all in one transaction, so a double-click can't sneak in twice.
--
-- Both return jsonb, which lib/supabase/posts.ts turns into API results:
--   { "danmaku": {...row} } / { "note": {...row} }        on success (client_id / ip_hash left out)
--   { "error": "rate_limited", "retry_after": <seconds> }  too fast; retry_after is at least 1
--   { "error": "danmaku_paused" }                          the admin turned danmaku off
-- Lengths are enforced by the tables' check constraints, which raise 23514 if the API let one through.

-- Seconds until a limit of `max_count` rows per `period` frees up, given the client's rows in that
-- period, newest first; 0 when there is still room.
create function public.rate_limit_wait(recent timestamptz[], max_count int, period interval, now_at timestamptz)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select case
    when coalesce(array_length(recent, 1), 0) < max_count then 0
    -- The oldest row that still counts has to leave the period first.
    else greatest(extract(epoch from recent[max_count] + period - now_at), 0)
  end;
$$;

create function public.post_danmaku(
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

  insert into public.danmaku (name, body, client_id, ip_hash, created_at)
  values (p_name, p_body, p_client_id, p_ip_hash, now_at)
  returning * into inserted;

  return jsonb_build_object('danmaku', to_jsonb(inserted) - 'client_id' - 'ip_hash');
end;
$$;

create function public.post_note(
  p_client_id text,
  p_section text,
  p_name text,
  p_body text,
  p_color smallint
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  now_at timestamptz;
  wait numeric;
  inserted public.notes;
begin
  perform pg_advisory_xact_lock(hashtext('note:' || p_client_id));
  now_at := clock_timestamp();

  select greatest(
    -- 1 per 30 seconds per client
    public.rate_limit_wait(array(
      select created_at from public.notes
      where client_id = p_client_id and created_at > now_at - interval '30 seconds'
      order by created_at desc limit 1
    ), 1, interval '30 seconds', now_at),
    -- 10 per hour per client
    public.rate_limit_wait(array(
      select created_at from public.notes
      where client_id = p_client_id and created_at > now_at - interval '1 hour'
      order by created_at desc limit 10
    ), 10, interval '1 hour', now_at)
  ) into wait;

  if wait > 0 then
    return jsonb_build_object('error', 'rate_limited', 'retry_after', greatest(ceil(wait), 1));
  end if;

  insert into public.notes (section, name, body, color, client_id, created_at)
  values (p_section, p_name, p_body, p_color, p_client_id, now_at)
  returning * into inserted;

  return jsonb_build_object('note', to_jsonb(inserted) - 'client_id' - 'user_id');
end;
$$;

-- Supabase lets anon call public functions through the REST API by default; only our server may.
revoke execute on function
  public.rate_limit_wait(timestamptz[], int, interval, timestamptz),
  public.post_danmaku(text, text, text, text, int),
  public.post_note(text, text, text, text, smallint)
from public, anon, authenticated;

grant execute on function
  public.rate_limit_wait(timestamptz[], int, interval, timestamptz),
  public.post_danmaku(text, text, text, text, int),
  public.post_note(text, text, text, text, smallint)
to service_role;
