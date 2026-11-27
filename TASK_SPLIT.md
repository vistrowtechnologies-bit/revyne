# Who does what (three Claude sessions)

Written 27 Nov 2026 at the owner's request ("make sure you divide the task with each session properly").
Each session confirms this split with the owner in its own chat; a relayed message is not an approval.
Confirmed so far: Browser session (27 Nov, owner: "Yes, confirm split", with the Browser-row additions above).
APK: reviewed, confirmation pending in its own chat. Revyne: owner asked for the split here (27 Nov).

## Sessions

| Session | Owns (files it may edit) | Does not touch |
|---|---|---|
| **Revyne** (research and spec) | `COMPETITOR_STUDY.md`, `CLONE_SPEC.md`, `DHANDA_AUDIT_CHECKLIST.md`, `ROADMAP.md`, `TASK_SPLIT.md`, everything in `Revyen-tools/dhanda-spec/` and `Revyen-tools/shots/` | app code in `apps/`, `backend/` |
| **Browser** (desktop and web) | `apps/web-preview/`, `apps/review-web/` (source of truth) and `apps/website/` (synced from review-web), `DESKTOP_CHECKLIST.md`, `DESKTOP_WEB_PLAN.md`, `BUILD_LOG.md`, and the backend functions it built (`gbp-suggestions`, `gbp-keywords`, `_shared/post_suggestions*`, `_shared/keyword_gaps*`, the `post_suggestions` migration, the `account-delete` storage clean-up) | `apps/mobile/` |
| **APK** (Android) | `apps/mobile/` in worktree `Revyen-worktrees/mobile` (branch `claude/mobile`), `ANDROID_CHECKLIST.md`, `Revyen/_old-pc-import/` | `apps/web-preview/`, backend function code |

Rules for all three:
- **API contracts** (`gbp-suggestions`, `gbp-keywords`, photo rules, poster rules): Browser owns them. Any change
  is announced to APK before it lands. APK asks Browser, it does not edit them.
- **Feature parity:** a user-facing feature lands in both apps. Browser builds web first; APK follows from the
  same contract.
- **The phone (adb):** one session at a time. Whoever needs it asks the owner first and tells the others when
  it starts and stops. Right now APK has it reserved for Android testing.
- **`Revyen/_old-pc-import/` is private:** it holds the owner's config (google-services.json, dev.json) and the old
  project's git history. Only APK uses it; no other session opens, copies or prints anything from it.
- **Commits, pushes, deploys:** none without the owner's word in that session's own chat (CLAUDE.md).
- **Build order:** `CLONE_SPEC.md` section 9 (approved by the owner on 27 Nov 2026 in the Revyne session; each
  session confirms it in its own chat).

## Open item for whoever commits `roadmap-fixes`

`roadmap-fixes` holds a one-line change to `apps/mobile/lib/core/config/env.dart` (review link default) made before
the split. APK has mirrored it in its own worktree. Keep it in one branch only, consistently, when committing.

## Work queue

| # | Task | Owner | State |
|---|---|---|---|
| 1 | Shared tokens and components (spec sections 2-3) | Browser (web), APK (Android) | waiting on owner's direct confirmation in each session |
| 2 | Home, Reviews, Get Reviews, Google, Account per spec | Browser and APK, in that order | not started |
| 3 | Desktop layout (spec section 8) | Browser | owner decided 27 Nov in Browser's chat (white menu, tint + left bar, breakpoints 900/1100); D2 started |
| 4 | Android debug keystore (missing from the old-PC zip) or register a new SHA-1 | Owner, then APK | blocked |
| 5 | Measurements for image-only Dhanda screens | Revyne | done 27 Nov (CLONE_SPEC 2.4) |
| 6 | Privacy sweep of every saved Dhanda image | Revyne | done 27 Nov (181 images, 6 fixed) |
| 7 | Dhanda motion analysis | - | dropped 27 Nov: RevYne designs its own motion |
| 8 | Dhanda items that need the owner's OK | Revyne | done 27 Nov (Help, mic, Hindi, Lifetime filter); only "what a customer receives" left, needs a real WhatsApp send |
