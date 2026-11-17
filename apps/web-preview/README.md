# RevYne owner web app (React)

The owner app for computer users: same features as the Android app
(`apps/mobile`), against the same Supabase project and edge functions.

```bash
cd apps/web-preview
cp .env.example .env.local   # fill in the dev values (publishable key is client-safe)
npm install
npm run dev                  # http://localhost:5175
```

- Sign-in: Google through Supabase Auth (PKCE). The origin must be in the
  Supabase Auth redirect URLs.
- Connect Google Business Profile: Google Identity Services popup code flow
  (`business.manage`), exchanged by `gbp-connect` with `redirectUri: "postmessage"`.
  The origin must be in the Google OAuth web client's Authorized JavaScript origins.
- Wide windows get a left sidebar; narrow windows the phone bottom bar.
- Poster and monthly report download as PDF (jsPDF).
