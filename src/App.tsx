import { useSyncExternalStore } from 'react'
import './App.css'
import { BusinessPage } from './pages/BusinessPage'

function subscribe(callback: () => void) {
  window.addEventListener('popstate', callback)
  return () => window.removeEventListener('popstate', callback)
}

function App() {
  const pathname = useSyncExternalStore(subscribe, () => window.location.pathname)
  const match = /^\/b\/([^/]+)\/?$/.exec(pathname)
  let slug = pathname === '/' ? 'bar-centrale' : ''
  try { if (match) slug = decodeURIComponent(match[1]) } catch { /* Invalid paths resolve to not found. */ }
  return <BusinessPage key={slug} slug={slug} />
}

export default App
