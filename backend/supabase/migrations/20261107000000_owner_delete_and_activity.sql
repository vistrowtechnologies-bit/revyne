-- Owners can delete private messages sent to their business, and read their
-- own activity log (replies, edits, posts, photos made through RevYne).

create policy "private_feedback: owner deletes own business"
  on public.private_feedback for delete to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = private_feedback.business_id and b.owner_id = (select auth.uid())
  ));

grant delete on public.private_feedback to authenticated;

create policy "owner_actions: owner reads own business"
  on public.owner_actions for select to authenticated
  using (exists (
    select 1 from public.businesses b
    where b.id = owner_actions.business_id and b.owner_id = (select auth.uid())
  ));

grant select on public.owner_actions to authenticated;
