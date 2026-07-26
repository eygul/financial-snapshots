import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database.types'
import type { FinanceDataService } from '../FinanceDataService'
import type {
  SnapshotSummary,
  SnapshotDetail,
  AssetItem,
  Holding,
  LineItem,
  NewSnapshotInput,
  NewAssetInput,
  UpdateAssetInput,
  NewHoldingInput,
  UpdateHoldingInput,
  NewLineItemInput,
  UpdateLineItemInput,
} from '../domain'
import {
  mapSnapshot,
  mapAccountWithHoldings,
  mapAccountRow,
  mapHolding,
  mapLineItem,
  type AccountWithHoldings,
} from './mappers'

const today = () => new Date().toISOString().slice(0, 10)

export class SupabaseFinanceDataService implements FinanceDataService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  private async currentUserId(): Promise<string> {
    const { data, error } = await this.client.auth.getUser()
    if (error || !data.user) {
      throw new Error('You need to be signed in to do that.')
    }
    return data.user.id
  }

  async listSnapshots(): Promise<SnapshotSummary[]> {
    const { data, error } = await this.client
      .from('snapshots')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapSnapshot)
  }

  async getSnapshotDetail(snapshotId: string): Promise<SnapshotDetail> {
    const [snapshotRes, accountsRes, expensesRes, incomeRes, totalsRes] = await Promise.all([
      this.client.from('snapshots').select('id, name, created_at').eq('id', snapshotId).single(),
      // Pull each account together with its holdings in one round trip. The
      // explicit `!holdings_account_id_fkey` hint disambiguates from the
      // other relationship holdings has (to the account_values view).
      this.client
        .from('accounts')
        .select('*, holdings!holdings_account_id_fkey(*)')
        .eq('snapshot_id', snapshotId)
        .order('created_at', { ascending: true }),
      this.client
        .from('expenses')
        .select('*')
        .eq('snapshot_id', snapshotId)
        .order('date', { ascending: true }),
      this.client
        .from('income')
        .select('*')
        .eq('snapshot_id', snapshotId)
        .order('date', { ascending: true }),
      this.client.from('snapshot_totals').select('*').eq('snapshot_id', snapshotId).maybeSingle(),
    ])

    if (snapshotRes.error) throw snapshotRes.error
    if (accountsRes.error) throw accountsRes.error
    if (expensesRes.error) throw expensesRes.error
    if (incomeRes.error) throw incomeRes.error
    if (totalsRes.error) throw totalsRes.error

    const summary = mapSnapshot(snapshotRes.data)
    const assets = ((accountsRes.data ?? []) as unknown as AccountWithHoldings[]).map(
      mapAccountWithHoldings,
    )
    const expenses = (expensesRes.data ?? []).map(mapLineItem)
    const incomes = (incomeRes.data ?? []).map(mapLineItem)

    const totalAssets = totalsRes.data?.total_assets ?? 0
    const totalExpenses = totalsRes.data?.total_expenses ?? 0
    const totalIncome = totalsRes.data?.total_income ?? 0

    return {
      ...summary,
      assets,
      expenses,
      incomes,
      totals: {
        totalAssets,
        totalExpenses,
        totalIncome,
        // Matches the reference design: net worth is what's left of your
        // assets after this period's expenses. Change this in one place if
        // you'd rather define it differently (e.g. assets only, or assets
        // minus liabilities once a liabilities table exists).
        netWorth: totalAssets - totalExpenses,
        cashFlow: totalIncome - totalExpenses,
      },
    }
  }

  async createSnapshot(input: NewSnapshotInput): Promise<SnapshotSummary> {
    const userId = await this.currentUserId()
    const { data, error } = await this.client
      .from('snapshots')
      .insert({ name: input.name, user_id: userId })
      .select('id, name, created_at')
      .single()

    if (error) throw error
    return mapSnapshot(data)
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    const { error } = await this.client.from('snapshots').delete().eq('id', snapshotId)
    if (error) throw error
  }

  async addAsset(input: NewAssetInput): Promise<AssetItem> {
    const { data, error } = await this.client
      .from('accounts')
      .insert({
        snapshot_id: input.snapshotId,
        institution_name: input.label,
        account_type: input.accountType,
        // Only checking/savings carry a flat amount - everything else gets
        // its value from holdings, added afterwards. Omitting the key
        // entirely (rather than sending `undefined`/0) leaves it at the
        // column's real default/null.
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
      })
      .select('*')
      .single()

    if (error) throw error
    return mapAccountRow(data)
  }

  async updateAsset(assetId: string, patch: UpdateAssetInput): Promise<AssetItem> {
    const { data, error } = await this.client
      .from('accounts')
      .update({
        ...(patch.label !== undefined ? { institution_name: patch.label } : {}),
        ...(patch.accountType !== undefined ? { account_type: patch.accountType } : {}),
        ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
      })
      .eq('id', assetId)
      .select('*')
      .single()

    if (error) throw error
    return mapAccountRow(data)
  }

  async deleteAsset(assetId: string): Promise<void> {
    // Delete holdings first in case the database doesn't cascade for you.
    const { error: holdingsError } = await this.client
      .from('holdings')
      .delete()
      .eq('account_id', assetId)
    if (holdingsError) throw holdingsError

    const { error } = await this.client.from('accounts').delete().eq('id', assetId)
    if (error) throw error
  }

  async addHolding(input: NewHoldingInput): Promise<Holding> {
    const isCash = input.isCash ?? false
    const { data, error } = await this.client
      .from('holdings')
      .insert({
        account_id: input.accountId,
        asset_name: isCash ? 'Cash' : input.assetName,
        current_value: input.currentValue,
        quantity: isCash ? null : (input.quantity ?? null),
        avg_cost: isCash ? null : (input.avgCost ?? null),
        is_cash: isCash,
      })
      .select('*')
      .single()

    if (error) throw error
    return mapHolding(data)
  }

  async updateHolding(holdingId: string, patch: UpdateHoldingInput): Promise<Holding> {
    const { data, error } = await this.client
      .from('holdings')
      .update({
        ...(patch.assetName !== undefined ? { asset_name: patch.assetName } : {}),
        ...(patch.currentValue !== undefined ? { current_value: patch.currentValue } : {}),
        ...(patch.quantity !== undefined ? { quantity: patch.quantity } : {}),
        ...(patch.avgCost !== undefined ? { avg_cost: patch.avgCost } : {}),
        ...(patch.isCash !== undefined ? { is_cash: patch.isCash } : {}),
      })
      .eq('id', holdingId)
      .select('*')
      .single()

    if (error) throw error
    return mapHolding(data)
  }

  async deleteHolding(holdingId: string): Promise<void> {
    const { error } = await this.client.from('holdings').delete().eq('id', holdingId)
    if (error) throw error
  }

  async addExpense(input: NewLineItemInput): Promise<LineItem> {
    const { data, error } = await this.client
      .from('expenses')
      .insert({
        snapshot_id: input.snapshotId,
        name: input.label,
        amount: input.amount,
        date: input.date ?? today(),
      })
      .select('*')
      .single()

    if (error) throw error
    return mapLineItem(data)
  }

  async updateExpense(id: string, patch: UpdateLineItemInput): Promise<LineItem> {
    const { data, error } = await this.client
      .from('expenses')
      .update({
        ...(patch.label !== undefined ? { name: patch.label } : {}),
        ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
        ...(patch.date !== undefined ? { date: patch.date } : {}),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return mapLineItem(data)
  }

  async deleteExpense(id: string): Promise<void> {
    const { error } = await this.client.from('expenses').delete().eq('id', id)
    if (error) throw error
  }

  async addIncome(input: NewLineItemInput): Promise<LineItem> {
    const { data, error } = await this.client
      .from('income')
      .insert({
        snapshot_id: input.snapshotId,
        name: input.label,
        amount: input.amount,
        date: input.date ?? today(),
      })
      .select('*')
      .single()

    if (error) throw error
    return mapLineItem(data)
  }

  async updateIncome(id: string, patch: UpdateLineItemInput): Promise<LineItem> {
    const { data, error } = await this.client
      .from('income')
      .update({
        ...(patch.label !== undefined ? { name: patch.label } : {}),
        ...(patch.amount !== undefined ? { amount: patch.amount } : {}),
        ...(patch.date !== undefined ? { date: patch.date } : {}),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return mapLineItem(data)
  }

  async deleteIncome(id: string): Promise<void> {
    const { error } = await this.client.from('income').delete().eq('id', id)
    if (error) throw error
  }
}
