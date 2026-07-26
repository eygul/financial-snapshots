import type { Tables } from '../../types/database.types'
import type { SnapshotSummary, AssetItem, Holding, LineItem } from '../domain'

const toDateOnly = (iso: string): string => iso.slice(0, 10)

export function mapSnapshot(
  row: Pick<Tables<'snapshots'>, 'id' | 'name' | 'created_at'>,
): SnapshotSummary {
  return {
    id: row.id,
    name: row.name,
    date: toDateOnly(row.created_at),
  }
}

export function mapHolding(row: Tables<'holdings'>): Holding {
  return {
    id: row.id,
    assetName: row.asset_name,
    quantity: row.quantity,
    avgCost: row.avg_cost,
    currentValue: row.current_value,
    isCash: row.is_cash,
  }
}

/**
 * An `accounts` row with its `holdings` embedded via a Supabase/PostgREST
 * nested select (`accounts.select('*, holdings!holdings_account_id_fkey(*)')`).
 * The foreign key name disambiguates it from the `holdings -> account_values`
 * relationship also present in the schema.
 */
export type AccountWithHoldings = Tables<'accounts'> & { holdings: Tables<'holdings'>[] }

export function mapAccountWithHoldings(row: AccountWithHoldings): AssetItem {
  const holdings = (row.holdings ?? []).map(mapHolding)
  const value =
    holdings.length > 0
      ? holdings.reduce((sum, h) => sum + h.currentValue, 0)
      : (row.amount ?? 0)

  return {
    id: row.id,
    label: row.institution_name,
    accountType: row.account_type,
    value,
    holdings,
  }
}

/** Used right after inserting a fresh account row, which never has holdings yet. */
export function mapAccountRow(row: Tables<'accounts'>): AssetItem {
  return {
    id: row.id,
    label: row.institution_name,
    accountType: row.account_type,
    value: row.amount ?? 0,
    holdings: [],
  }
}

export function mapLineItem(row: Tables<'expenses'> | Tables<'income'>): LineItem {
  return {
    id: row.id,
    label: row.name,
    amount: row.amount,
    date: toDateOnly(row.date),
  }
}
