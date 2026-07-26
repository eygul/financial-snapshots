import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../data/supabase/client'

/**
 * Gates the app behind a signed-in Supabase session. `snapshots.user_id`
 * is required (and almost certainly protected by row-level security), so
 * there needs to be a real auth.uid() before any query will return rows.
 *
 * This is intentionally minimal (email magic link only). Swap it for
 * whatever auth flow your product already has - it only needs to result in
 * an active Supabase session.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setSending(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-paper text-sm text-muted">
        Loading…
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-paper">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded border border-border-soft bg-panel p-8"
        >
          <h1 className="mb-1 text-sm font-bold tracking-[0.2em] text-muted">SNAPSHOTS</h1>
          <p className="mb-6 text-sm text-muted">
            Sign in with a magic link to see your net worth history.
          </p>
          {sent ? (
            <p className="text-sm text-accent-green">Check {email} for a sign-in link.</p>
          ) : (
            <>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mb-3 w-full rounded border border-border-soft bg-paper px-3 py-2 text-sm outline-none focus:border-accent-blue"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded border border-accent-green py-2 text-xs font-semibold tracking-wide text-accent-green transition hover:bg-accent-green hover:text-paper disabled:opacity-50"
              >
                {sending ? 'SENDING…' : '+ SEND MAGIC LINK'}
              </button>
              {error && <p className="mt-3 text-sm text-accent-red">{error}</p>}
            </>
          )}
        </form>
      </div>
    )
  }

  return <>{children}</>
}
