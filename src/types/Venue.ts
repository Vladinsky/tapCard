export type VenueLinkType = 'instagram' | 'menu' | 'review'

export type VenueLink = {
  id: string
  type: VenueLinkType
  label: string
  url: string
}

export type Venue = {
  id: string
  slug: string
  name: string
  description: string
  logoUrl?: string
  primaryColor: string
  links: VenueLink[]
}