import type { ResolvedAction } from '../utils/businessLinks'
import { Chevron } from './Chevron'
import { ActionIcon } from './ActionIcon'

export function ActionCard({ action, trackedHref }: { action: ResolvedAction; trackedHref?: () => string }) {
  return (
    <a className="action-card" href={trackedHref ? trackedHref() : action.href} onClick={event => { if (trackedHref) event.currentTarget.href = trackedHref() }} onAuxClick={event => { if (trackedHref) event.currentTarget.href = trackedHref() }} target={action.external ? '_blank' : undefined} rel={action.external ? 'noopener noreferrer' : undefined}>
      <span className="action-icon"><ActionIcon type={action.type} /></span>
      <span className="action-copy"><strong>{action.title}</strong>{action.subtitle && <span className="action-subtitle">{action.subtitle}</span>}</span>
      {action.external && <span className="sr-only"> (si apre in una nuova scheda)</span>}
      <Chevron />
    </a>
  )
}
