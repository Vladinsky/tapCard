import { ActionIcon } from './ActionIcon'
import { Chevron } from './Chevron'

export function ReviewCTA({ href }: { href: string }) {
  return (
    <a className="review-cta" href={href} target="_blank" rel="noopener noreferrer">
      <span className="review-icon"><ActionIcon type="review" /></span>
      <span className="review-copy"><strong>Lascia una recensione</strong><span className="review-support">Aiutaci a crescere!</span><span className="sr-only"> su Google</span></span>
      <span className="sr-only"> (si apre in una nuova scheda)</span>
      <Chevron />
    </a>
  )
}
