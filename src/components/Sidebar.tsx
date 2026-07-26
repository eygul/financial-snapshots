import { useState, type FormEvent } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { financeDataService, type SnapshotSummary } from '../data'
import { getErrorMessage } from '../utils/errors'

interface SidebarProps {
  snapshots: SnapshotSummary[]
  loading: boolean
  error: string | null
  selectedId: string | null
  onSelect: (id: string) => void
  onCreated: (id: string) => void
}

export function Sidebar({ snapshots, loading, error, selectedId, onSelect, onCreated }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setFormError(null)
    try {
      const created = await financeDataService.createSnapshot({ name: name.trim() })
      setName('')
      setCreating(false)
      onCreated(created.id)
    } catch (err) {
      setFormError(getErrorMessage(err, 'Could not create that snapshot.'))
    } finally {
      setSaving(false)
    }
  }

  if (collapsed) {
    return (
      <div className="flex w-12 flex-col items-center border-r border-border-soft bg-panel py-6">
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand sidebar"
          className="text-muted transition hover:text-ink"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    )
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-border-soft bg-panel">
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <h2 className="text-xs font-semibold tracking-[0.2em] text-muted">SNAPSHOTS</h2>
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse sidebar"
          className="text-muted transition hover:text-ink"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="px-6">
        {creating ? (
          <form onSubmit={handleCreate} className="mb-4 space-y-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. July 2025"
              className="w-full rounded border border-accent-green bg-paper px-3 py-2 text-sm outline-none"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded border border-accent-green py-1.5 text-xs font-semibold text-accent-green transition hover:bg-accent-green hover:text-paper disabled:opacity-50"
              >
                {saving ? 'SAVING…' : 'SAVE'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreating(false)
                  setName('')
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
            onClick={() => setCreating(true)}
            className="mb-4 flex w-full items-center justify-center gap-1.5 rounded border border-accent-green py-2 text-xs font-semibold tracking-wide text-accent-green transition hover:bg-accent-green hover:text-paper"
          >
            <Plus size={14} /> NEW SNAPSHOT
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <p className="px-6 text-sm text-muted">Loading…</p>}
        {error && <p className="px-6 text-sm text-accent-red">{error}</p>}
        {snapshots.map((snap) => {
          const active = snap.id === selectedId
          return (
            <button
              key={snap.id}
              onClick={() => onSelect(snap.id)}
              className={`block w-full border-t border-border-soft px-6 py-4 text-left transition ${
                active
                  ? 'border-l-4 border-l-accent-green bg-paper'
                  : 'border-l-4 border-l-transparent hover:bg-paper/60'
              }`}
            >
              <div className={`text-sm font-bold ${active ? 'text-accent-green' : 'text-ink'}`}>
                {snap.name}
              </div>
              <div className="text-xs text-muted">{snap.date}</div>
            </button>
          )
        })}
        {!loading && snapshots.length === 0 && (
          <p className="px-6 text-sm text-muted">No snapshots yet — create your first one above.</p>
        )}
      </div>
    </aside>
  )
}
