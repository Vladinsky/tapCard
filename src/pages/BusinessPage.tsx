import { useEffect } from 'react'
import { BusinessLandingPage } from '../components/BusinessLandingPage'
import { getBusiness } from '../services/businesses'

export function BusinessPage({ slug }: { slug: string }) {
  const result = getBusiness(slug)
  const title = result.status === 'ready' ? result.business.name : result.status === 'not-found' ? 'Attività non trovata' : 'Dati dell’attività non validi'
  useEffect(() => { document.title = title + ' | Tapcard' }, [title])
  if (result.status === 'ready') return <BusinessLandingPage business={result.business} demo={result.demo} />
  return (
    <main className="business-page">
      <section className="business-state">
        <p className="tapcard-wordmark">tapcard</p>
        <h1>{title}</h1>
        <p>{result.status === 'not-found' ? 'Controlla il link o chiedi all’attività un nuovo codice QR.' : 'Non è possibile mostrare questa attività. Contatta l’attività per segnalare il problema.'}</p>
      </section>
    </main>
  )
}
