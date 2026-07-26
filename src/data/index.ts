import { supabase } from './supabase/client'
import { SupabaseFinanceDataService } from './supabase/SupabaseFinanceDataService'
import type { FinanceDataService } from './FinanceDataService'

/**
 * This is the one seam that knows about Supabase. Everything else in the
 * app - hooks, components - imports `financeDataService` from here and
 * only ever sees the `FinanceDataService` interface.
 *
 * To move to a different backend later: write `SomethingElseDataService
 * implements FinanceDataService` and swap the line below. No other file
 * needs to change.
 */
export const financeDataService: FinanceDataService = new SupabaseFinanceDataService(supabase)

export type { FinanceDataService } from './FinanceDataService'
export * from './domain'
