import { useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { formatCurrency } from '../utils/currency'
import { getErrorMessage } from '../utils/errors'

/**
 * Generic flat-list column, used for Expenses and Incomes. The Assets
 * column has its own component (`AssetsColumn`) since accounts have real
 * structure (holdings) that a flat name/amount row can't represent.
 */

type Accent = 'red' | 'green'

const ACCENT_TEXT: Record<Accent, string> = {
  red: 'text-accent-red',
  green: 'text-accent-green',
}

const ACCENT_BORDER: Record<Accent, string> = {
  red: 'border-accent-red',
  green: 'border-accent-green',
}

export interface ColumnItem {
  id: string
  label: string
  amount: number
}

interface AddPayload {
  label: string
  amount: number
}

interface Props {
  title: string
  accent: Accent
  total: number
  items: ColumnItem[]
  onAdd: (payload: AddPayload) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function ColumnSection({ title, accent, total, items, onAdd, onDelete }: Props) {
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = Number(amount)
    if (!label.trim() || Number.isNaN(parsed)) return
    setSaving(true)
    setFormError(null)
    try {
      await onAdd({ label: label.trim(), amount: parsed })
      setLabel('')
      setAmount('')
      setAdding(false)
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not save that item.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setPendingDelete(id)
    setListError(null)
    try {
      await onDelete(id)
    } catch (err) {
      setListError(getErrorMessage(err, 'Could not remove that item.'))
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <section className="flex min-h-[60vh] flex-col px-8 py-6">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className={`text-sm font-bold tracking-[0.2em] ${ACCENT_TEXT[accent]}`}>{title}</h2>
        <span className={`text-2xl font-bold ${ACCENT_TEXT[accent]}`}>{formatCurrency(total)}</span>
      </div>

      {listError && <p className="mb-3 text-xs text-accent-red">{listError}</p>}

      <ul className="flex-1 space-y-5">
        {items.map((item) => (
          <li key={item.id} className="group flex items-baseline justify-between gap-4">
            <div className="min-w-0">
              <div className="truncate text-sm">{item.label}</div>
              <div className={`mt-1 w-10 border-b-2 ${ACCENT_BORDER[accent]} opacity-40`} />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-lg font-bold">{formatCurrency(item.amount)}</span>
              <button
                onClick={() => handleDelete(item.id)}
                disabled={pendingDelete === item.id}
                aria-label={`Remove ${item.label}`}
                className="text-muted opacity-0 transition hover:text-accent-red group-hover:opacity-100 disabled:opacity-50"
              >
                <X size={14} />
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="text-sm text-muted">Nothing here yet.</li>}
      </ul>

      <div className="mt-6 border-t border-border-soft pt-4">
        {adding ? (
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Name"
              className="w-full rounded border border-border-soft bg-paper px-3 py-2 text-sm outline-none focus:border-current"
            />
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="Amount"
              className="w-full rounded border border-border-soft bg-paper px-3 py-2 text-sm outline-none focus:border-current"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className={`flex-1 rounded border py-1.5 text-xs font-semibold ${ACCENT_BORDER[accent]} ${ACCENT_TEXT[accent]} transition hover:opacity-80 disabled:opacity-50`}
              >
                {saving ? 'SAVING…' : 'SAVE'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false)
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
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-sm text-muted transition hover:text-ink"
          >
            <Plus size={14} /> ADD ITEM
          </button>
        )}
      </div>
    </section>
  )
}
