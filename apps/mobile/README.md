# RevYne — Android app (Flutter)

Owner app: Home · Reviews · Get Reviews · Google Profile · Account. Plan: `../../IMPLEMENTATION_PLAN.md`.

## Run

Toolchain on this PC: Flutter at `E:\dev\flutter`, Android SDK at `E:\dev\android-sdk`.

```bash
cp env/example.json env/dev.json   # fill in values (env/*.json is gitignored)
flutter run --dart-define-from-file=env/dev.json
```

`env/dev.json` points at the `revyne-dev` Supabase project and the Google Web OAuth client
(`revyne-513306`). Google sign-in only works on builds signed with a key whose SHA-1 is registered
as an Android OAuth client for package `com.revyne.revyne_app`.

## Layout

```
lib/
  app/        MaterialApp + router (auth → onboarding → 5-tab shell gate)
  core/       config (Env), theme tokens, shared widgets, Supabase providers
  features/   one folder per area: auth, business, onboarding, shell, home,
              reviews, get_reviews, google_profile, account
```
