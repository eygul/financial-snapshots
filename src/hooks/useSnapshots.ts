import { useCallback, useEffect, useState } from 'react'
import { financeDataService, type SnapshotSummary } from '../data'
import { getErrorMessage } from '../utils/errors'

export function useSnapshots() {
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await financeDataService.listSnapshots()
      setSnapshots(data)
      setError(null)
      return data
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load snapshots.'))
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { snapshots, loading, error, refresh }
}
