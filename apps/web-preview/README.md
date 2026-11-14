# RevYne web preview (React)

A **design preview** of the RevYne owner app for computer users, copied from the
Flutter app in `apps/mobile`. Sample data only (Sharma Sweets, Pune) — no
backend, no sign-in, nothing is posted anywhere.

```bash
cd apps/web-preview
npm install
npm run dev   # http://localhost:5175
```

Wide windows get a left sidebar; narrow windows get the phone bottom bar.
Account → App colour switches all five palettes from `lib/core/theme/palettes.dart`.
