# RevYne — backend (Supabase)

Schema lives only in `supabase/migrations/` — never change tables by hand in the dashboard.

Projects: `revyne-dev` (ref `qokgcupkabyzdqmgtgdp`, Mumbai). `revyne-prod` is created before the Play launch.

## Apply migrations to revyne-dev

```bash
npx supabase login
npx supabase link --project-ref qokgcupkabyzdqmgtgdp
npx supabase db push
```

`link` asks for the database password (held by the owner).

## Security rules for every migration

- Enable RLS on every table and write explicit policies using `(select auth.uid())`.
- The project does not auto-expose tables: grant only the columns clients need.
- Billing/plan data is client read-only; only the service role writes it.
- Anonymous access goes through `security definer` functions that return public fields only.
