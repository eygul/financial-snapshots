import { useState, type FormEvent } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus } from 'lucide-react'
import { financeDataService, type SnapshotSummary } from '../data'
import { getErrorMessage } from '../utils/errors'
import { useTheme } from '../hooks/useTheme'
import { Moon, Sun, X } from 'lucide-react'

interface SidebarProps {
  snapshots: SnapshotSummary[]
  loading: boolean
  error: string | null
  selectedId: string | null
  onSelect: (id: string) => void
  onCreated: (id: string) => void
  onDeleted: (id: string) => void
}

export function Sidebar({ snapshots, loading, error, selectedId, onSelect, onCreated, onDeleted }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const { theme, toggleTheme } = useTheme()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
  if (!window.confirm('Delete this snapshot? This removes all its assets, expenses, and income.')) return
  setDeletingId(id)
  try {
    await financeDataService.deleteSnapshot(id)
    onDeleted(id)
  } catch (err) {
    alert(getErrorMessage(err, 'Could not delete that snapshot.'))
  } finally {
    setDeletingId(null)
  }
}

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
      <div className="flex h-12 w-full shrink-0 items-center justify-center border-b border-border-soft bg-panel py-2 md:h-auto md:w-12 md:flex-col md:border-b-0 md:border-r md:py-6">
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand sidebar"
          className="text-muted transition hover:text-ink"
        >
          <ChevronDown size={18} className="md:hidden" />
          <ChevronRight size={18} className="hidden md:block" />
        </button>
      </div>
    )
  }

  return (
    <aside className="flex max-h-[50vh] w-full shrink-0 flex-col border-b border-border-soft bg-panel md:h-full md:max-h-none md:w-72 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <h2 className="text-xs font-semibold tracking-[0.2em] text-muted">SNAPSHOTS</h2>
        <button onClick={toggleTheme} aria-label="Toggle theme" className="...">
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse sidebar"
          className="text-muted transition hover:text-ink"
        >
          <ChevronUp size={16} className="md:hidden" />
          <ChevronLeft size={16} className="hidden md:block" />
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
    <div
      key={snap.id}
      className={`group flex items-center border-t border-border-soft transition ${
        active
          ? 'border-l-4 border-l-accent-green bg-paper'
          : 'border-l-4 border-l-transparent hover:bg-paper/60'
      }`}
    >
      <button onClick={() => onSelect(snap.id)} className="flex-1 px-6 py-4 text-left">
        <div className={`text-sm font-bold ${active ? 'text-accent-green' : 'text-ink'}`}>
          {snap.name}
        </div>
        <div className="text-xs text-muted">{snap.date}</div>
      </button>
      <button
        onClick={() => handleDelete(snap.id)}
        disabled={deletingId === snap.id}
        aria-label={`Delete ${snap.name}`}
        className="mr-4 text-muted opacity-0 transition hover:text-accent-red group-hover:opacity-100 disabled:opacity-50"
      >
        <X size={14} />
      </button>
    </div>
  )
})}
        {!loading && snapshots.length === 0 && (
          <p className="px-6 text-sm text-muted">No snapshots yet — create your first one above.</p>
        )}
      </div>
    </aside>
  )
}
