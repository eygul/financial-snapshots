import { financeDataService, type SnapshotDetail } from '../data'
import { formatCurrency, formatSigned } from '../utils/currency'
import { AssetsColumn } from './AssetsColumn'
import { ColumnSection } from './ColumnSection'

interface Props {
  detail: SnapshotDetail
  loading: boolean
  onChanged: () => void
}

export function SnapshotView({ detail, loading, onChanged }: Props) {
  const { totals } = detail

  return (
    <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      <header className="flex flex-wrap items-start justify-between gap-6 px-10 pt-10 pb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">{detail.name}</h1>
          <p className="mt-1 text-sm text-muted">{detail.date}</p>
        </div>
        <div className="flex gap-10 text-right">
          <div>
            <div className="text-xs tracking-[0.2em] text-muted">NET WORTH</div>
            <div
              className={`text-3xl font-bold ${totals.netWorth >= 0 ? 'text-accent-green' : 'text-accent-red'}`}
            >
              {formatCurrency(totals.netWorth)}
            </div>
          </div>
          <div>
            <div className="text-xs tracking-[0.2em] text-muted">CASH FLOW</div>
            <div
              className={`text-3xl font-bold ${totals.cashFlow >= 0 ? 'text-accent-green' : 'text-accent-red'}`}
            >
              {formatSigned(totals.cashFlow)}
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 divide-y divide-border-soft border-t border-border-soft md:grid-cols-3 md:divide-x md:divide-y-0">
        <AssetsColumn
          total={totals.totalAssets}
          assets={detail.assets}
          onAddAccount={async ({ label, accountType, amount }) => {
            await financeDataService.addAsset({
              snapshotId: detail.id,
              label,
              accountType,
              amount,
            })
            onChanged()
          }}
          onDeleteAccount={async (id) => {
            await financeDataService.deleteAsset(id)
            onChanged()
          }}
          onAddHolding={async (accountId, payload) => {
            await financeDataService.addHolding({
              accountId,
              assetName: payload.assetName,
              currentValue: payload.currentValue,
              quantity: payload.quantity ?? null,
              avgCost: payload.avgCost ?? null,
              isCash: payload.isCash,
            })
            onChanged()
          }}
          onDeleteHolding={async (id) => {
            await financeDataService.deleteHolding(id)
            onChanged()
          }}
        />
        <ColumnSection
          title="EXPENSES"
          accent="red"
          total={totals.totalExpenses}
          items={detail.expenses.map((e) => ({ id: e.id, label: e.label, amount: e.amount }))}
          onAdd={async ({ label, amount }) => {
            await financeDataService.addExpense({ snapshotId: detail.id, label, amount })
            onChanged()
          }}
          onDelete={async (id) => {
            await financeDataService.deleteExpense(id)
            onChanged()
          }}
        />
        <ColumnSection
          title="INCOMES"
          accent="green"
          total={totals.totalIncome}
          items={detail.incomes.map((i) => ({ id: i.id, label: i.label, amount: i.amount }))}
          onAdd={async ({ label, amount }) => {
            await financeDataService.addIncome({ snapshotId: detail.id, label, amount })
            onChanged()
          }}
          onDelete={async (id) => {
            await financeDataService.deleteIncome(id)
            onChanged()
          }}
        />
      </div>
    </div>
  )
}
