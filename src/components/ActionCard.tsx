import type { ResolvedAction } from '../utils/businessLinks'
import { Chevron } from './Chevron'
import { ActionIcon } from './ActionIcon'

export function ActionCard({ action }: { action: ResolvedAction }) {
  return (
    <a className="action-card" href={action.href} target={action.external ? '_blank' : undefined} rel={action.external ? 'noopener noreferrer' : undefined}>
      <span className="action-icon"><ActionIcon type={action.type} /></span>
      <span className="action-copy"><strong>{action.title}</strong>{action.subtitle && <span className="action-subtitle">{action.subtitle}</span>}</span>
      {action.external && <span className="sr-only"> (si apre in una nuova scheda)</span>}
      <Chevron />
    </a>
  )
}
