import { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'

export function HelpButton() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-10">
      {open && (
        <div className="mb-3 w-64 rounded border border-border-soft bg-panel p-4 text-sm shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-bold">Quick tips</span>
            <button onClick={() => setOpen(false)} className="text-muted hover:text-ink" aria-label="Close">
              <X size={14} />
            </button>
          </div>
          <ul className="list-inside list-disc space-y-1 text-muted">
            <li>+ NEW SNAPSHOT starts a new month.</li>
            <li>+ ADD ITEM adds an asset, expense, or income line.</li>
            <li>Hover a row to remove it.</li>
          </ul>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Help"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-paper shadow-lg transition hover:opacity-90"
      >
        <HelpCircle size={18} />
      </button>
    </div>
  )
}
