-- Tables for the guestbook, danmaku and site settings (spec 5.2, #5).
-- Every write goes through our API routes with the service role, so RLS is on and anon gets no
-- policies at all: browsers can't read client_id / ip_hash or hidden rows, and can't write.
-- char_length() counts Unicode code points, the same as charCount() in lib/schemas.ts.

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('m1', 'm2', 'm3', 'm4')),
  name text not null check (btrim(name) <> '' and char_length(name) <= 20),
  body text not null check (btrim(body) <> '' and char_length(body) <= 50),
  -- Index into ACCENTS on the frontend.
  color smallint not null check (color between 0 and 3),
  -- The anonymous id from the signed cid cookie (spec 6.1), used for rate limiting.
  client_id text not null,
  -- Reserved for Google sign-in later; nullable so linking accounts needs no schema change.
  user_id uuid,
  created_at timestamptz not null default now(),
  hidden_at timestamptz
);

-- GET /api/notes?section= lists the visible notes of one guestbook, oldest first.
create index notes_section_created_at on public.notes (section, created_at) where hidden_at is null;
-- post_note() looks up one client's recent notes.
create index notes_client_created_at on public.notes (client_id, created_at);

create table public.danmaku (
  -- Always increasing, so the frontend can use it as the `since` cursor for polling.
  id bigint generated always as identity primary key,
  name text not null check (btrim(name) <> '' and char_length(name) <= 10),
  body text not null check (btrim(body) <> '' and char_length(body) <= 20),
  client_id text not null,
  -- Hash of the sender's IP, for the looser per-IP limit (spec 6.2). Not in the spec's table:
  -- the limit has to count recent danmaku per IP, so it is stored with each row.
  ip_hash text not null,
  created_at timestamptz not null default now(),
  hidden_at timestamptz
);

-- post_danmaku() looks up one client's and one IP's recent danmaku.
create index danmaku_client_created_at on public.danmaku (client_id, created_at);
create index danmaku_ip_created_at on public.danmaku (ip_hash, created_at);

create table public.settings (
  key text primary key check (key in ('danmaku_enabled', 'final_photo_url')),
  value jsonb not null
);

insert into public.settings (key, value) values
  ('danmaku_enabled', 'true'),
  ('final_photo_url', 'null');

alter table public.notes enable row level security;
alter table public.danmaku enable row level security;
alter table public.settings enable row level security;

-- RLS already blocks anon; revoking the table grants too means a policy added by mistake later
-- still can't open them up.
revoke all on public.notes, public.danmaku, public.settings from anon, authenticated;
