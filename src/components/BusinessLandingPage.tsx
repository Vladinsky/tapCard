import type { CSSProperties } from 'react'
import type { Business } from '../types/business'
import { resolveActions, reviewUrl } from '../utils/businessLinks'
import { businessTheme } from '../utils/businessTheme'
import { ActionCard } from './ActionCard'
import { BusinessHeader } from './BusinessHeader'
import { ReviewCTA } from './ReviewCTA'
import { redirectLink } from '../lib/links'

export function BusinessLandingPage({ business, demo = false, trackingSource }: { business: Business; demo?: boolean; trackingSource?: string }) {
  const actions = resolveActions(business.actions)
  const review = reviewUrl(business.googleReviewUrl)
  const theme = businessTheme(business.primaryColor)
  const style = { '--business-primary': theme.primary, '--business-on-primary': theme.foreground } as CSSProperties
  return (
    <main className="business-page" style={style}>
      <div className="business-shell">
        <article className="business-card">
          <BusinessHeader key={business.id} business={business} />
          <div className="business-content">
            {review ? <ReviewCTA href={review} trackedHref={trackingSource ? () => redirectLink(business.id, 'review', trackingSource) : undefined} /> : <p className="business-notice">{actions.length ? 'Le recensioni non sono al momento disponibili' : 'I collegamenti di questa attività non sono al momento disponibili'}</p>}
            {actions.length > 0 && <nav className="business-actions" aria-label="Collegamenti dell’attività">{actions.map((action) => <ActionCard key={action.id} action={action} trackedHref={trackingSource ? () => redirectLink(business.id, action.id, trackingSource) : undefined} />)}</nav>}
            <footer className="business-footer"><div className="footer-ornament" aria-hidden="true"><span /><svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 24 4 14C-3 6 7-2 14 6c7-8 17 0 10 8Z" /></svg><span /></div>Grazie per il tuo supporto!</footer>
          </div>
        </article>
        {demo && <p className="demo-notice">Pagina dimostrativa · Attività e collegamenti di esempio{review && '. Il link recensione è un esempio e non è associato a una vera attività.'}</p>}
      </div>
    </main>
  )
}
