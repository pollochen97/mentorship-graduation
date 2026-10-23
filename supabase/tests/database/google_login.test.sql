-- Run with `npx supabase test db` (local Supabase must be running). See 20261023000001_google_login.sql.
begin;
select plan(10);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.allowed_emails'::regclass),
  'allowed_emails has RLS'
);
select is(
  (select value from public.settings where key = 'notes_enabled'), 'false'::jsonb,
  'the guestbook starts closed'
);

set local role anon;
select throws_ok('select * from public.allowed_emails', '42501', null, 'anon cannot read the whitelist');
reset role;
set local role authenticated;
select throws_ok(
  'select * from public.allowed_emails', '42501', null, 'signed-in users cannot read the whitelist'
);
reset role;

set local role service_role;

select throws_ok(
  $$insert into public.allowed_emails (email) values ('Someone@Gmail.com')$$, '23514', null,
  'addresses must be lower case'
);
select lives_ok(
  $$insert into public.allowed_emails (email, note) values ('someone@gmail.com', 'test')$$,
  'a lower-case address goes in'
);

select is(
  public.post_note('g1', 'm1', 'a', 'b', 0::smallint, null), '{"error": "notes_closed"}'::jsonb,
  'no notes while the guestbook is closed'
);

update public.settings set value = 'true' where key = 'notes_enabled';

reset role;
insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000a1', 'someone@gmail.com');
set local role service_role;

select ok(
  public.post_note('g1', 'm1', 'a', 'b', 0::smallint, '00000000-0000-0000-0000-0000000000a1') ? 'note',
  'an open guestbook takes a note'
);
select is(
  (select user_id from public.notes where client_id = 'g1'), '00000000-0000-0000-0000-0000000000a1'::uuid,
  'the note records its writer'
);
select throws_ok(
  $$select public.post_note('g2', 'm1', 'a', 'b', 0::smallint, '00000000-0000-0000-0000-0000000000ff')$$,
  '23503', null, 'the writer must be an existing account'
);

reset role;

select * from finish();
rollback;
