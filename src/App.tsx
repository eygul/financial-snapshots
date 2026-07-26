import { AuthGate } from './auth/AuthGate'
import { Dashboard } from './components/Dashboard'

export default function App() {
  return (
    <AuthGate>
      <Dashboard />
    </AuthGate>
  )
}
