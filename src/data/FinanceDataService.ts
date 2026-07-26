import type {
  SnapshotSummary,
  SnapshotDetail,
  AssetItem,
  LineItem,
  Holding,
  NewSnapshotInput,
  NewAssetInput,
  UpdateAssetInput,
  NewHoldingInput,
  UpdateHoldingInput,
  NewLineItemInput,
  UpdateLineItemInput,
} from './domain'

/**
 * Contract for all snapshot / net-worth data access.
 *
 * The rest of the app only ever talks to an object shaped like this - never
 * to Supabase (or any other backend) directly. To move to a different
 * backend one day, write a new class that implements this interface and
 * point `src/data/index.ts` at it. No component or hook has to change.
 */
export interface FinanceDataService {
  listSnapshots(): Promise<SnapshotSummary[]>
  getSnapshotDetail(snapshotId: string): Promise<SnapshotDetail>
  createSnapshot(input: NewSnapshotInput): Promise<SnapshotSummary>
  deleteSnapshot(snapshotId: string): Promise<void>

  addAsset(input: NewAssetInput): Promise<AssetItem>
  updateAsset(assetId: string, patch: UpdateAssetInput): Promise<AssetItem>
  /** Deletes the account and any holdings under it. */
  deleteAsset(assetId: string): Promise<void>

  addHolding(input: NewHoldingInput): Promise<Holding>
  updateHolding(holdingId: string, patch: UpdateHoldingInput): Promise<Holding>
  deleteHolding(holdingId: string): Promise<void>

  addExpense(input: NewLineItemInput): Promise<LineItem>
  updateExpense(id: string, patch: UpdateLineItemInput): Promise<LineItem>
  deleteExpense(id: string): Promise<void>

  addIncome(input: NewLineItemInput): Promise<LineItem>
  updateIncome(id: string, patch: UpdateLineItemInput): Promise<LineItem>
  deleteIncome(id: string): Promise<void>
}
