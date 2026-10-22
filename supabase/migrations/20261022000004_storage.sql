-- Bucket for the final group photo (#5, used by #20).
-- Public, so the projector can show it by URL. There are no storage policies for anon: uploads go
-- through a signed upload URL that the admin API (#20) creates with the service role.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'final-photo',
  'final-photo',
  true,
  -- #20 shrinks the photo to 2400px on the long side first, so 10 MB leaves plenty of room.
  10 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp']
);
