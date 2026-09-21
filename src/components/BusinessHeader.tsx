import { useState } from 'react'
import type { Business } from '../types/business'
import { imageUrl } from '../utils/businessLinks'

export function BusinessHeader({ business }: { business: Business }) {
  const [failedCover, setFailedCover] = useState<string>()
  const [failedLogo, setFailedLogo] = useState<string>()
  const cover = imageUrl(business.coverUrl)
  const logo = imageUrl(business.logoUrl)
  const initials = business.name.trim().split(/\s+/u).slice(0, 2).map((part) => Array.from(part)[0]).join('').toUpperCase()
  return (
    <header className="business-header">
      <div className={cover && failedCover !== cover ? 'business-cover has-image' : 'business-cover'}>
        {cover && failedCover !== cover && <img src={cover} alt="" onError={() => setFailedCover(cover)} />}
        <svg className="cover-wave" viewBox="0 0 765 85" preserveAspectRatio="none" aria-hidden="true"><path d="M0 48C180-65 425 155 765 46V85H0Z" fill="currentColor" /></svg>
      </div>
      <div className="business-identity">
        <div className="business-logo" aria-hidden="true">
          {logo && failedLogo !== logo ? <img src={logo} alt="" onError={() => setFailedLogo(logo)} /> : initials}
        </div>
        <h1>{business.name}</h1>
        {business.description?.trim() && <p className="business-description">{business.description}</p>}
      </div>
    </header>
  )
}
