/**
 * Supabase/PostgREST errors are plain objects with a `message` field - they
 * don't extend `Error` - so `e instanceof Error` misses them and callers
 * fall back to a generic message (or, if nothing catches the rejection at
 * all, the browser logs a bare "[object Object]"). This checks for a
 * `message` string on anything thrown, Error or not.
 */
export function getErrorMessage(e: unknown, fallback = 'Something went wrong.'): string {
  if (e && typeof e === 'object' && 'message' in e) {
    const message = (e as { message: unknown }).message
    if (typeof message === 'string' && message.length > 0) return message
  }
  if (e instanceof Error) return e.message
  return fallback
}
