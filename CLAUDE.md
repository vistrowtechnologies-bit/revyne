# RevYne: working rules for Claude

Start with `HANDOFF.md`: project map, accounts, commands and the open checklist.
Work on branch `rebuild`. `main` and `master` hold the old app.

## Owner's rules (always)

- **Secrets:** never read, print, copy or commit secrets, keys, tokens or the
  Firebase key file. The owner pastes secret values into consoles themselves.
  Use scripts like `backend/scripts/set-fcm-secret.ps1` that never echo values.
- **Google:** nothing goes public on Google without the owner's explicit OK in
  chat, each time. That covers review replies, posts, photos and profile edits.
  The linked test profile is a real business. Never invent post text and
  publish it.
- **Policy:** no review gating, never ask for 5 stars, and AI output is always
  an editable draft. Owner approval comes before anything is sent.
- **Git:**
  - Commit only when asked. Push only when the owner says so.
  - No destructive git commands (`reset --hard`, `checkout --`, force push).
    Use a stash or backup instead.
  - Never commit `.well-known/`.
- **Ask first:** ask before downloads, before accepting terms, before changing
  console or account settings, and before overwriting an edge-function secret.
- **Encoding:** never rewrite files with PowerShell `Get-Content`/`Set-Content`.
  It turns `· – — ★ ₹` into mojibake.
- **Phone testing:** check that RevYne is the app in front before tapping.
  Don't keep or describe screenshots of other apps or notifications.
- **Honesty:** report what was verified versus only built. Say so plainly when
  something wasn't tested on a real device or against real Google data.

## Conventions

- **Schema:** change it only via new files in `backend/supabase/migrations/`.
  Follow the RLS and grant rules in `backend/README.md`.
- **Android app:** keep `flutter analyze` clean and `flutter test` passing.
  Riverpod providers use `retry: (_, _) => null`.
  flutter_local_notifications stays on 22.
- **Feature parity:** the React web app (`apps/web-preview`) and the Android
  app (`apps/mobile`) are kept at feature parity. A user-facing feature usually
  lands in both.
- **Review page:** `apps/review-web` is the source of truth; re-sync it into
  `apps/website` with `tools/sync-review-web.mjs`.
