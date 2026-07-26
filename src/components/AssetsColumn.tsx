import { useState, type FormEvent } from 'react'
import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react'
import { Constants } from '../types/database.types'
import { accountUsesHoldings, type AccountType, type AssetItem, type Holding } from '../data'
import { formatCurrency } from '../utils/currency'
import { getErrorMessage } from '../utils/errors'

const ACCOUNT_TYPES = Constants.public.Enums.asset_account_type

interface AddAccountPayload {
  label: string
  accountType: AccountType
  amount?: number
}

interface AddHoldingPayload {
  assetName: string
  currentValue: number
  quantity?: number
  avgCost?: number
  isCash: boolean
}

interface Props {
  total: number
  assets: AssetItem[]
  onAddAccount: (payload: AddAccountPayload) => Promise<void>
  onDeleteAccount: (id: string) => Promise<void>
  onAddHolding: (accountId: string, payload: AddHoldingPayload) => Promise<void>
  onDeleteHolding: (id: string) => Promise<void>
}

export function AssetsColumn({
  total,
  assets,
  onAddAccount,
  onDeleteAccount,
  onAddHolding,
  onDeleteHolding,
}: Props) {
  const [addingAccount, setAddingAccount] = useState(false)
  const [label, setLabel] = useState('')
  const [accountType, setAccountType] = useState<AccountType>(ACCOUNT_TYPES[0])
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const needsAmount = !accountUsesHoldings(accountType)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!label.trim()) return
    const parsedAmount = Number(amount)
    if (needsAmount && Number.isNaN(parsedAmount)) return
    setSaving(true)
    setFormError(null)
    try {
      await onAddAccount({
        label: label.trim(),
        accountType,
        amount: needsAmount ? parsedAmount : undefined,
      })
      setLabel('')
      setAmount('')
      setAddingAccount(false)
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not save that account.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="flex min-h-[60vh] flex-col px-8 py-6">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="text-sm font-bold tracking-[0.2em] text-accent-blue">ASSETS</h2>
        <span className="text-2xl font-bold text-accent-blue">{formatCurrency(total)}</span>
      </div>

      <ul className="flex-1 space-y-6">
        {assets.map((account) => (
          <AccountRow
            key={account.id}
            account={account}
            onDeleteAccount={onDeleteAccount}
            onAddHolding={onAddHolding}
            onDeleteHolding={onDeleteHolding}
          />
        ))}
        {assets.length === 0 && <li className="text-sm text-muted">Nothing here yet.</li>}
      </ul>

      <div className="mt-6 border-t border-border-soft pt-4">
        {addingAccount ? (
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Institution / account name"
              className="w-full rounded border border-border-soft bg-paper px-3 py-2 text-sm outline-none focus:border-accent-blue"
            />
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as AccountType)}
              className="w-full rounded border border-border-soft bg-paper px-3 py-2 text-sm outline-none"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {needsAmount ? (
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="Amount"
                className="w-full rounded border border-border-soft bg-paper px-3 py-2 text-sm outline-none focus:border-accent-blue"
              />
            ) : (
              <p className="text-xs text-muted">
                You'll add specific holdings (tickers, cash, etc) once this account is created.
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded border border-accent-blue py-1.5 text-xs font-semibold text-accent-blue transition hover:opacity-80 disabled:opacity-50"
              >
                {saving ? 'SAVING…' : 'SAVE'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingAccount(false)
                  setFormError(null)
                }}
                className="flex-1 rounded border border-border-soft py-1.5 text-xs font-semibold text-muted transition hover:text-ink"
              >
                CANCEL
              </button>
            </div>
            {formError && <p className="text-xs text-accent-red">{formError}</p>}
          </form>
        ) : (
          <button
            onClick={() => setAddingAccount(true)}
            className="flex items-center gap-1.5 text-sm text-muted transition hover:text-ink"
          >
            <Plus size={14} /> ADD ITEM
          </button>
        )}
      </div>
    </section>
  )
}

function AccountRow({
  account,
  onDeleteAccount,
  onAddHolding,
  onDeleteHolding,
}: {
  account: AssetItem
  onDeleteAccount: (id: string) => Promise<void>
  onAddHolding: (accountId: string, payload: AddHoldingPayload) => Promise<void>
  onDeleteHolding: (id: string) => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [rowError, setRowError] = useState<string | null>(null)
  const holdingsBased = accountUsesHoldings(account.accountType)

  async function handleDeleteAccount() {
    setDeleting(true)
    setRowError(null)
    try {
      await onDeleteAccount(account.id)
    } catch (err) {
      setRowError(getErrorMessage(err, 'Could not remove that account.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <li>
      <div className="group flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          {holdingsBased ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 truncate text-sm transition hover:text-accent-blue"
            >
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span className="truncate">{account.label}</span>
            </button>
          ) : (
            <div className="truncate text-sm">{account.label}</div>
          )}
          <div className="mt-1 flex items-center gap-2">
            <div className="w-10 border-b-2 border-accent-blue opacity-40" />
            <span className="text-[10px] uppercase tracking-wide text-muted">
              {account.accountType}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-lg font-bold">{formatCurrency(account.value)}</span>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            aria-label={`Remove ${account.label}`}
            className="text-muted opacity-0 transition hover:text-accent-red group-hover:opacity-100 disabled:opacity-50"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {rowError && <p className="mt-1 text-xs text-accent-red">{rowError}</p>}

      {holdingsBased && expanded && (
        <div className="mt-3 ml-4 space-y-3 border-l border-border-soft pl-4">
          {account.holdings.map((h) => (
            <HoldingRow key={h.id} holding={h} onDelete={onDeleteHolding} />
          ))}
          {account.holdings.length === 0 && <p className="text-xs text-muted">No holdings yet.</p>}
          <AddHoldingForm accountId={account.id} onAdd={onAddHolding} />
        </div>
      )}
    </li>
  )
}

function HoldingRow({
  holding,
  onDelete,
}: {
  holding: Holding
  onDelete: (id: string) => Promise<void>
}) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await onDelete(holding.id)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not remove that holding.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="group flex items-baseline justify-between gap-4 text-sm">
        <div className="min-w-0 truncate">
          {holding.assetName}
          {!holding.isCash && holding.quantity != null && (
            <span className="ml-2 text-xs text-muted">
              {holding.quantity} @ {formatCurrency(holding.avgCost ?? 0)} avg
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-semibold">{formatCurrency(holding.currentValue)}</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            aria-label={`Remove ${holding.assetName}`}
            className="text-muted opacity-0 transition hover:text-accent-red group-hover:opacity-100 disabled:opacity-50"
          >
            <X size={12} />
          </button>
        </div>
      </div>
      {error && <p className="mt-0.5 text-xs text-accent-red">{error}</p>}
    </div>
  )
}

function AddHoldingForm({
  accountId,
  onAdd,
}: {
  accountId: string
  onAdd: (accountId: string, payload: AddHoldingPayload) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [isCash, setIsCash] = useState(false)
  const [assetName, setAssetName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [avgCost, setAvgCost] = useState('')
  const [currentValue, setCurrentValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setAssetName('')
    setQuantity('')
    setAvgCost('')
    setCurrentValue('')
    setIsCash(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = Number(currentValue)
    if (Number.isNaN(value)) return
    if (!isCash && !assetName.trim()) return
    setSaving(true)
    setError(null)
    try {
      await onAdd(accountId, {
        assetName: isCash ? 'Cash' : assetName.trim(),
        currentValue: value,
        quantity: !isCash && quantity ? Number(quantity) : undefined,
        avgCost: !isCash && avgCost ? Number(avgCost) : undefined,
        isCash,
      })
      reset()
      setOpen(false)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not save that holding.'))
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-muted transition hover:text-ink"
      >
        <Plus size={12} /> ADD HOLDING
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded border border-border-soft p-3">
      <label className="flex items-center gap-2 text-xs text-muted">
        <input
          type="checkbox"
          checked={isCash}
          onChange={(e) => setIsCash(e.target.checked)}
          className="accent-accent-blue"
        />
        This is cash
      </label>
      {!isCash && (
        <input
          autoFocus
          value={assetName}
          onChange={(e) => setAssetName(e.target.value)}
          placeholder="Ticker / asset name (e.g. VOO)"
          className="w-full rounded border border-border-soft bg-paper px-3 py-2 text-sm outline-none focus:border-accent-blue"
        />
      )}
      {!isCash && (
        <div className="flex gap-2">
          <input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputMode="decimal"
            placeholder="Quantity"
            className="w-full rounded border border-border-soft bg-paper px-3 py-2 text-sm outline-none focus:border-accent-blue"
          />
          <input
            value={avgCost}
            onChange={(e) => setAvgCost(e.target.value)}
            inputMode="decimal"
            placeholder="Avg cost"
            className="w-full rounded border border-border-soft bg-paper px-3 py-2 text-sm outline-none focus:border-accent-blue"
          />
        </div>
      )}
      <input
        value={currentValue}
        onChange={(e) => setCurrentValue(e.target.value)}
        inputMode="decimal"
        placeholder="Current value"
        className="w-full rounded border border-border-soft bg-paper px-3 py-2 text-sm outline-none focus:border-accent-blue"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded border border-accent-blue py-1 text-xs font-semibold text-accent-blue transition hover:opacity-80 disabled:opacity-50"
        >
          {saving ? 'SAVING…' : 'SAVE'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setError(null)
          }}
          className="flex-1 rounded border border-border-soft py-1 text-xs font-semibold text-muted transition hover:text-ink"
        >
          CANCEL
        </button>
      </div>
      {error && <p className="text-xs text-accent-red">{error}</p>}
    </form>
  )
}
