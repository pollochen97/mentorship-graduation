-- Guestbook notes need a Google sign-in on the whitelist, while the admin has them open (#55).
-- POST /api/notes checks the sign-in and the whitelist; Postgres keeps the switch and records who
-- wrote each note, so notes written from now on can be traced to an account.

-- The ENG members who may write notes. Kept here, not in the repo (the repo is public); edited in the
-- Supabase dashboard. Lower case, so the API can look an address up exactly.
create table public.allowed_emails (
  email text primary key check (email <> '' and email = lower(btrim(email))),
  -- Who the address belongs to, for whoever keeps the list.
  note text,
  created_at timestamptz not null default now()
);

alter table public.allowed_emails enable row level security;
revoke all on public.allowed_emails from anon, authenticated;

-- notes.user_id was reserved for this (20261022000001); a deleted account keeps its notes.
alter table public.notes
  add constraint notes_user_id_fkey foreign key (user_id) references auth.users (id) on delete set null;

-- The guestbook switch. Closed until the admin opens it.
alter table public.settings drop constraint settings_key_check;
alter table public.settings
  add constraint settings_key_check
  check (key in ('danmaku_enabled', 'final_photo_url', 'notes_enabled'));
insert into public.settings (key, value) values ('notes_enabled', 'false');

-- post_note gains the writer's account and answers { "error": "notes_closed" } while the switch is off.
-- A new signature, so the old function goes and the grants are set again.
drop function public.post_note(text, text, text, text, smallint);

create function public.post_note(
  p_client_id text,
  p_section text,
  p_name text,
  p_body text,
  p_color smallint,
  p_user_id uuid default null
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

  if not coalesce((select value::boolean from public.settings where key = 'notes_enabled'), false) then
    return jsonb_build_object('error', 'notes_closed');
  end if;

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

  insert into public.notes (section, name, body, color, client_id, user_id, created_at)
  values (p_section, p_name, p_body, p_color, p_client_id, p_user_id, now_at)
  returning * into inserted;

  return jsonb_build_object('note', to_jsonb(inserted) - 'client_id' - 'user_id');
end;
$$;

revoke execute on function public.post_note(text, text, text, text, smallint, uuid)
from public, anon, authenticated;
grant execute on function public.post_note(text, text, text, text, smallint, uuid) to service_role;
