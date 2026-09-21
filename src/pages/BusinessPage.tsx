import { useEffect, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { BusinessLandingPage } from '../components/BusinessLandingPage'
import { getBusiness } from '../services/businesses'
import { demoMode } from '../lib/supabase'
import { normalizeSource } from '../lib/links'
import type { Business } from '../types/business'

export function BusinessPage() {
  const { slug = '' } = useParams()
  const location = useLocation()
  const requestKey = `${slug}:${location.key}:${location.search}`
  const [result, setResult] = useState<{ key?: string; business?: Business | null; error?: string }>({})
  const state = result.key === requestKey ? result : {}
  const events = useRef(new Map<string, string>())
  const source = normalizeSource(new URLSearchParams(location.search).get('source'))
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    getBusiness(slug, controller.signal).then(business => {
      if (!active) return
      setResult({ key: requestKey, business })
      document.title = `${business?.name || 'Attività non trovata'} | TapCard`
      if (business && !demoMode) {
        const key = `${location.key}:${business.id}:${source}`
        if (!events.current.has(key)) events.current.set(key, crypto.randomUUID())
        void fetch('/api/track', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
          body: JSON.stringify({ business: business.id, event: events.current.get(key), source }),
        }).then(r => { if (!r.ok) console.error('Tracking apertura non riuscito:', r.status) })
          .catch(error => console.error('Tracking apertura non disponibile', error))
      }
    }).catch(error => { if (active) setResult({ key: requestKey, error: error.message || 'Errore di rete' }) })
    return () => { active = false; controller.abort() }
  }, [slug, location.key, source, requestKey])
  if (state.business) return <BusinessLandingPage business={state.business} demo={demoMode} trackingSource={demoMode ? undefined : source} />
  return <main className="business-page"><section className="business-state" role="status"><h1>{state.error ? 'Impossibile caricare l’attività' : state.business === null ? 'Attività non trovata' : 'Caricamento…'}</h1><p>{state.error || (state.business === null ? 'Controlla il link o chiedi all’attività un nuovo codice QR.' : '')}</p>{state.error && <button onClick={() => window.location.reload()}>Riprova</button>}</section></main>
}
