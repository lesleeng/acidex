# Simulate app-to-Supabase sync

This script simulates the same history upsert your app does, but from your laptop.

1. Get a real user access token from a signed-in session.
2. Run:

```bash
node scripts/simulate-history-sync.js
```

3. Optional overrides:

```bash
HISTORY_ID=test-123 COFFEE_TYPE="Sample 9" PH=5.4 NOTE="desktop test" node scripts/simulate-history-sync.js
```

Required environment variables:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_EMAIL`
- `SUPABASE_PASSWORD`

Note: the `EXPO_PUBLIC_SUPABASE_*` values identify your project connection. They are not the signed-in user token used by RLS.