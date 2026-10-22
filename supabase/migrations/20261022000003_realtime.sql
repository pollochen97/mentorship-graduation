-- Who may use the private Broadcast channel `live` (spec 5.1, #5).
-- Browsers may receive on it; nobody but the server may send. The server sends with the service
-- role, which bypasses RLS, so there is deliberately no insert policy: without it, someone holding the
-- public anon key still can't push messages onto the projector.

create policy "anyone can receive live broadcasts"
on realtime.messages
for select
to anon, authenticated
using (
  realtime.topic() = 'live'
  and realtime.messages.extension = 'broadcast'
);
