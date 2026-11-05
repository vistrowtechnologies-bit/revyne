-- Profile edits and AI description drafts join the owner activity log.
-- `detail` names the edited field (e.g. "regularHours"); no profile content is stored.
alter table public.owner_actions drop constraint owner_actions_kind_check;
alter table public.owner_actions add constraint owner_actions_kind_check
  check (kind in ('reply_draft', 'reply_posted', 'reply_deleted', 'profile_edit', 'description_draft'));
alter table public.owner_actions add column detail text;
