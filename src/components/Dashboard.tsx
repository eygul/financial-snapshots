import { useEffect, useState } from 'react'
import { Sidebar } from './Sidebar'
import { SnapshotView } from './SnapshotView'
import { HelpButton } from './HelpButton'
import { useSnapshots } from '../hooks/useSnapshots'
import { useSnapshotDetail } from '../hooks/useSnapshotDetail'


export function Dashboard() {
  const { snapshots, loading, error, refresh } = useSnapshots()
  const [selectedId, setSelectedId] = useState<string | null>(null)


  // Default to the most recent snapshot once the list loads.
  useEffect(() => {
    if (!selectedId && snapshots.length > 0) {
      setSelectedId(snapshots[0].id)
    }
  }, [snapshots, selectedId])

  const {
    detail,
    loading: detailLoading,
    error: detailError,
    refresh: refreshDetail,
  } = useSnapshotDetail(selectedId)

  async function handleDeleted(id: string) {
  await refresh()
  if (selectedId === id) setSelectedId(null)
}

  async function handleCreated(id: string) {
    await refresh()
    setSelectedId(id)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-paper text-ink">
      <Sidebar
        snapshots={snapshots}
        loading={loading}
        error={error}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCreated={handleCreated}
        onDeleted={handleDeleted}
      />
      <main className="flex-1 overflow-y-auto">
        {detailError && <p className="p-10 text-sm text-accent-red">{detailError}</p>}
        {!detailError && detail && (
          <SnapshotView detail={detail} loading={detailLoading} onChanged={refreshDetail} />
        )}
        {!detail && !detailError && !detailLoading && !loading && (
          <p className="p-10 text-sm text-muted">Select or create a snapshot to get started.</p>
        )}
      </main>
      <HelpButton />
    </div>
  )
}
