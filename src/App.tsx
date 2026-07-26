import { AuthGate } from './auth/AuthGate'
import { Dashboard } from './components/Dashboard'
import { useTheme } from './hooks/useTheme'

export default function App() {
  useTheme() // applies the stored/system theme and keeps it in sync
  
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  )
}
