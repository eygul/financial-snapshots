import { useCallback, useEffect, useState } from 'react'
import { financeDataService, type SnapshotDetail } from '../data'
import { getErrorMessage } from '../utils/errors'

export function useSnapshotDetail(snapshotId: string | null) {
  const [detail, setDetail] = useState<SnapshotDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!snapshotId) {
      setDetail(null)
      return
    }
    setLoading(true)
    try {
      const data = await financeDataService.getSnapshotDetail(snapshotId)
      setDetail(data)
      setError(null)
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load this snapshot.'))
    } finally {
      setLoading(false)
    }
  }, [snapshotId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { detail, loading, error, refresh }
}
