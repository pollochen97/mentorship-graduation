-- Run with `npx supabase test db` (local Supabase must be running).
-- Rows older than "now" are inserted by hand to stand in for earlier requests.
begin;
select plan(31);

-- ---- schema and access ----

select ok((select relrowsecurity from pg_class where oid = 'public.notes'::regclass), 'notes has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.danmaku'::regclass), 'danmaku has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.settings'::regclass), 'settings has RLS');
select is(
  (select value from public.settings where key = 'danmaku_enabled'), 'true'::jsonb,
  'danmaku starts enabled'
);
select is(
  (select value from public.settings where key = 'final_photo_url'), 'null'::jsonb,
  'no final photo yet'
);
select ok(
  (select public from storage.buckets where id = 'final-photo'), 'final-photo bucket is public'
);

set local role anon;
select throws_ok('select * from public.notes', '42501', null, 'anon cannot read notes');
select throws_ok('select * from public.danmaku', '42501', null, 'anon cannot read danmaku');
select throws_ok(
  $$insert into public.danmaku (name, body, client_id, ip_hash) values ('a', 'b', 'c', 'd')$$,
  '42501', null, 'anon cannot insert danmaku'
);
select throws_ok(
  $$select public.post_danmaku('c', 'ip', 'a', 'b')$$, '42501', null, 'anon cannot call post_danmaku'
);
select throws_ok(
  $$select public.post_note('c', 'm1', 'a', 'b', 0::smallint)$$, '42501', null,
  'anon cannot call post_note'
);
reset role;

-- ---- post_danmaku ----

set local role service_role;

select ok(
  public.post_danmaku('d1', 'ip1', '小明', '恭喜結業！') ? 'danmaku', 'first danmaku goes in'
);
-- Held until commit, so ids become visible in order (20261022000005). A bigint advisory key shows
-- up in pg_locks split into classid (high 32 bits) and objid (low 32 bits).
select ok(
  exists(
    select 1 from pg_locks
    where locktype = 'advisory' and pid = pg_backend_pid() and objsubid = 1
      and objid::bigint = (hashtext('danmaku:insert')::bigint & 4294967295)
  ),
  'an accepted danmaku holds the insert lock until commit'
);
select is(
  (select array(select jsonb_object_keys(public.post_danmaku('d0', 'ip0', 'a', 'b') -> 'danmaku') order by 1)),
  array['body', 'created_at', 'hidden_at', 'id', 'name'],
  'the answer leaves out client_id and ip_hash'
);

select is(
  public.post_danmaku('d1', 'ip1', '小明', '再一則') ->> 'error', 'rate_limited',
  'second danmaku within 5 s is refused'
);
select ok(
  (public.post_danmaku('d1', 'ip1', '小明', '再一則') ->> 'retry_after')::int between 1 and 5,
  'retry_after counts down from 5 s'
);

insert into public.danmaku (name, body, client_id, ip_hash, created_at)
values ('a', 'b', 'd2', 'ip2', now() - interval '6 seconds');
select ok(
  public.post_danmaku('d2', 'ip2', 'a', 'b') ? 'danmaku', 'allowed again after 5 s'
);

-- 20 in the last 10 minutes, the oldest 9 minutes ago: blocked for about another minute.
insert into public.danmaku (name, body, client_id, ip_hash, created_at)
select 'a', 'b', 'd3', 'ip3', now() - interval '9 minutes' + n * interval '20 seconds'
from generate_series(0, 19) n;
select ok(
  (public.post_danmaku('d3', 'ip3', 'a', 'b') ->> 'retry_after')::int between 55 and 65,
  'the 21st danmaku in 10 minutes waits for the oldest one to drop out'
);

-- Per-IP limit, lowered to 3 a minute for the test: different clients, same Wi-Fi.
insert into public.danmaku (name, body, client_id, ip_hash, created_at)
select 'a', 'b', 'other' || n, 'ip4', now() - interval '30 seconds'
from generate_series(1, 3) n;
select is(
  public.post_danmaku('d4', 'ip4', 'a', 'b', 3) ->> 'error', 'rate_limited',
  'a busy IP is limited across clients'
);
select ok(
  public.post_danmaku('d4', 'ip4', 'a', 'b', 4) ? 'danmaku', 'the IP limit is a parameter'
);

update public.settings set value = 'false' where key = 'danmaku_enabled';
select is(
  public.post_danmaku('d5', 'ip5', 'a', 'b') ->> 'error', 'danmaku_paused',
  'refused while danmaku is paused'
);
update public.settings set value = 'true' where key = 'danmaku_enabled';

select ok(
  public.post_danmaku('d6', 'ip6', '1234567890', '😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀') ? 'danmaku',
  'an emoji counts as 1 character (10-character name, 20-emoji body)'
);
select throws_ok(
  $$select public.post_danmaku('d7', 'ip7', '12345678901', 'b')$$, '23514', null,
  'name over 10 characters is rejected'
);
select throws_ok(
  $$select public.post_danmaku('d8', 'ip8', '   ', 'b')$$, '23514', null, 'blank name is rejected'
);

-- ---- post_note ----

select ok(
  public.post_note('n1', 'm1', '小美', '謝謝大家！', 2::smallint) ? 'note', 'first note goes in'
);
select is(
  (select array(select jsonb_object_keys(public.post_note('n0', 'm2', 'a', 'b', 0::smallint) -> 'note') order by 1)),
  array['body', 'color', 'created_at', 'hidden_at', 'id', 'name', 'section'],
  'the answer leaves out client_id and user_id'
);
select ok(
  (public.post_note('n1', 'm1', '小美', '再一則', 0::smallint) ->> 'retry_after')::int between 25 and 30,
  'second note within 30 s waits about 30 s'
);

insert into public.notes (section, name, body, color, client_id, created_at)
select 'm1', 'a', 'b', 0, 'n2', now() - interval '50 minutes' + n * interval '1 minute'
from generate_series(0, 9) n;
select ok(
  (public.post_note('n2', 'm1', 'a', 'b', 0::smallint) ->> 'retry_after')::int between 595 and 605,
  'the 11th note in an hour waits for the oldest one to drop out (about 10 minutes)'
);

select throws_ok(
  $$select public.post_note('n3', 'm5', 'a', 'b', 0::smallint)$$, '23514', null,
  'unknown section is rejected'
);
select throws_ok(
  $$select public.post_note('n4', 'm1', 'a', 'b', 4::smallint)$$, '23514', null,
  'colour outside 0–3 is rejected'
);
select throws_ok(
  $$select public.post_note('n5', 'm1', 'a', repeat('字', 51), 0::smallint)$$, '23514', null,
  'body over 50 characters is rejected'
);

reset role;

select * from finish();
rollback;
