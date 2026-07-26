import type { Enums } from '../types/database.types'

/**
 * Domain models for the app.
 *
 * Nothing outside `src/data` should ever import from
 * `src/types/database.types` or `@supabase/supabase-js` directly - components
 * and hooks only ever see the shapes defined here. That's what lets the
 * backend be swapped later without touching UI code.
 */

export type AccountType = Enums<'asset_account_type'>

/**
 * checking/savings just carry a flat dollar amount on the account itself.
 * Everything else (brokerage, 401k, ira, hsa, other_equity) carries its
 * value through one or more `holdings` rows instead - this is the account
 * type distinction the whole Assets UI branches on.
 */
export const SIMPLE_ACCOUNT_TYPES: AccountType[] = ['checking', 'savings']
export const HOLDINGS_ACCOUNT_TYPES: AccountType[] = [
  'brokerage',
  '401k',
  'ira',
  'hsa',
  'other_equity',
]

export function accountUsesHoldings(type: AccountType): boolean {
  return HOLDINGS_ACCOUNT_TYPES.includes(type)
}

export interface SnapshotSummary {
  id: string
  name: string
  /** ISO date (YYYY-MM-DD) the snapshot represents, derived from creation time. */
  date: string
}

export interface LineItem {
  id: string
  label: string
  amount: number
  date: string
}

/** One position inside a brokerage/401k/ira/hsa/other_equity account. */
export interface Holding {
  id: string
  assetName: string
  quantity: number | null
  avgCost: number | null
  currentValue: number
  isCash: boolean
}

export interface AssetItem {
  id: string
  label: string
  accountType: AccountType
  /** Flat amount for simple accounts, or the sum of holdings for the rest. */
  value: number
  /** Always [] for checking/savings accounts. */
  holdings: Holding[]
}

export interface SnapshotTotals {
  totalAssets: number
  totalExpenses: number
  totalIncome: number
  /** totalAssets - totalExpenses, matching the reference design. */
  netWorth: number
  /** totalIncome - totalExpenses. */
  cashFlow: number
}

export interface SnapshotDetail extends SnapshotSummary {
  assets: AssetItem[]
  expenses: LineItem[]
  incomes: LineItem[]
  totals: SnapshotTotals
}

export interface NewSnapshotInput {
  name: string
}

export interface NewAssetInput {
  snapshotId: string
  label: string
  accountType: AccountType
  /** Only meaningful for checking/savings - omit for holdings-based account types. */
  amount?: number
}

export interface UpdateAssetInput {
  label?: string
  accountType?: AccountType
  amount?: number
}

export interface NewHoldingInput {
  accountId: string
  assetName: string
  currentValue: number
  quantity?: number | null
  avgCost?: number | null
  isCash?: boolean
}

export interface UpdateHoldingInput {
  assetName?: string
  currentValue?: number
  quantity?: number | null
  avgCost?: number | null
  isCash?: boolean
}

export interface NewLineItemInput {
  snapshotId: string
  label: string
  amount: number
  /** ISO date (YYYY-MM-DD). Defaults to today when omitted. */
  date?: string
}

export interface UpdateLineItemInput {
  label?: string
  amount?: number
  date?: string
}
