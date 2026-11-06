-- Private bucket for photos owners send to Google (profile photos and post
-- images). The app uploads to "<business_id>/<file>"; the gbp-content function
-- gives Google a short-lived signed URL to fetch it. Never public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gbp-media', 'gbp-media', false, 5242880, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Owners may upload into, and read, only their own business's folder.
create policy "gbp-media owner upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'gbp-media'
    and (storage.foldername(name))[1] in (select id::text from public.businesses where owner_id = auth.uid())
  );

create policy "gbp-media owner read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'gbp-media'
    and (storage.foldername(name))[1] in (select id::text from public.businesses where owner_id = auth.uid())
  );

-- Owner actions also log posts and photos.
alter table public.owner_actions drop constraint owner_actions_kind_check;
alter table public.owner_actions add constraint owner_actions_kind_check
  check (kind in ('reply_draft', 'reply_posted', 'reply_deleted', 'profile_edit', 'description_draft',
                  'post_draft', 'post_created', 'post_deleted', 'photo_added', 'photo_deleted'));
