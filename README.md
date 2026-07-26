# Snapshots — net worth tracker

A monthly net-worth / cash-flow tracker: React + TypeScript + Vite + Tailwind CSS on the
front end, Supabase (Postgres) on the back end, built from your generated
`database.types.ts`.

## Architecture: the data layer

The point of this layer is that **components never talk to Supabase**. They talk to a
plain interface, and one file decides what actually implements it.

```
src/data/
  domain.ts                          <- Backend-agnostic types (SnapshotDetail, AssetItem, ...)
  FinanceDataService.ts              <- The interface every backend must implement
  index.ts                           <- financeDataService = new SupabaseFinanceDataService(...)
  supabase/
    client.ts                        <- createClient<Database>(...) using your generated types
    mappers.ts                       <- Supabase row -> domain model
    SupabaseFinanceDataService.ts    <- implements FinanceDataService with real queries
```

Everything under `src/hooks` and `src/components` imports from `src/data` (the
`financeDataService` instance and the domain types) — never from
`@supabase/supabase-js` or `database.types.ts` directly.

**To swap backends later:** write a new class (e.g. `RestFinanceDataService implements
FinanceDataService`) and change one line in `src/data/index.ts`. No hook or component
needs to change, because they were never coupled to Supabase in the first place.

## How the schema maps to the UI

- **Assets column** (`AssetsColumn.tsx`) queries `accounts` with its `holdings` embedded
  in one request (`accounts.select('*, holdings!holdings_account_id_fkey(*)')`), and
  branches on account type:
  - **checking / savings** are simple: institution name + a flat dollar `amount` on the
    account row. No holdings.
  - **brokerage / 401k / ira / hsa / other_equity** carry their value through one or more
    `holdings` rows instead — each with an asset name, quantity, avg cost, and current
    value — or a "this is cash" holding that only asks for a dollar amount
    (`is_cash = true`, `asset_name = 'Cash'`, quantity/avg_cost left null). An account's
    displayed value is the sum of its holdings' `current_value`.
  - Click an account name to expand it and add/remove individual holdings.
  - `financeDataService.addAsset()` only ever sends `amount` for checking/savings — for
    everything else it's omitted so the account is created with holdings still empty.
- **Expenses / Incomes columns** read and write the `expenses` / `income` tables directly.
- **Totals** (`total_assets`, `total_expenses`, `total_income`) come from the
  `snapshot_totals` view, so they always reflect the current state of the underlying
  tables — no client-side summing to keep in sync.
- **Net worth and cash flow** are derived client-side in
  `SupabaseFinanceDataService.getSnapshotDetail`:
  - `netWorth = totalAssets - totalExpenses`
  - `cashFlow = totalIncome - totalExpenses`

  The net worth formula is an assumption based on matching the numbers in your mockup
  exactly ($276,250 assets − $3,302 expenses = $272,948). If you actually want net worth
  to just be total assets (or assets minus real liabilities once you have a liabilities
  table), it's a one-line change in that one function.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure Supabase**

   ```bash
   cp .env.example .env
   ```

   Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project
   settings (Project Settings → API).

3. **Row-level security**: `snapshots.user_id` implies your tables are (or should be)
   scoped with RLS so a user only sees their own rows, something like:

   ```sql
   create policy "Users manage their own snapshots"
     on snapshots for all
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);
   ```

   with similar policies (via a join back to `snapshots.user_id`) on `accounts`,
   `holdings`, `expenses`, and `income`. Without this, either everyone sees everyone's
   data, or authenticated requests return nothing — check your Supabase dashboard.

4. **Run it**

   ```bash
   npm run dev
   ```

The app gates itself behind a minimal Supabase email-magic-link sign-in
(`src/auth/AuthGate.tsx`), since `user_id` is required to create a snapshot. Swap that
component for whatever auth flow the rest of your product uses — it only needs to leave
behind an active Supabase session.

## What's included vs. left as an extension point

- ✅ List / create snapshots, view assets / expenses / income, add and remove accounts,
  holdings, and line items, live totals.
- 🧩 Not wired into the UI, but supported by the schema and already on
  `FinanceDataService` if you want to add it: editing an existing account, holding, or
  line item in place (`updateAsset` / `updateHolding` / `updateExpense` / `updateIncome`
  all exist — the UI currently only adds and deletes).
