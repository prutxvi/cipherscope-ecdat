
import { useEffect, useState } from 'react'
import Landing from './pages/Landing.tsx'
import Dashboard from './pages/Dashboard.jsx'

export default function App() {
  const [view, setView] = useState<'landing' | 'report'>(() =>
    window.location.hash === '#report' ? 'report' : 'landing',
  )

  useEffect(() => {
    const sync = () => setView(window.location.hash === '#report' ? 'report' : 'landing')
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const go = (v: 'landing' | 'report') => {
    window.location.hash = v === 'report' ? '#report' : '/'
    setView(v)
    window.scrollTo(0, 0)
  }

  if (view === 'report') return <Dashboard onBack={() => go('landing')} />
  return <Landing onLaunch={() => go('report')} />
}
