import type { Business, BusinessActionType } from '../types/business'
export interface ActionRow {
  id: string
  type: BusinessActionType
  title: string
  subtitle: string
  url: string | null
  phone_number: string | null
  message: string
  enabled: boolean
  position: number
}
export interface BusinessRow {
  id: string
  name: string
  slug: string
  description: string
  primary_color: string
  logo_url: string | null
  cover_url: string | null
  google_review_url: string | null
  status: 'draft' | 'published' | 'inactive'
  first_published_at: string | null
  business_actions: ActionRow[]
}
export function toBusiness(row: BusinessRow): Business {
  return {
    id: row.id, name: row.name, slug: row.slug, description: row.description,
    primaryColor: row.primary_color, logoUrl: row.logo_url || undefined,
    coverUrl: row.cover_url || undefined, googleReviewUrl: row.google_review_url || undefined,
    actions: [...row.business_actions].sort((a, b) => a.position - b.position).map(a => ({
      id: a.id, type: a.type, title: a.title, subtitle: a.subtitle, enabled: a.enabled,
      ...(a.type === 'phone' || a.type === 'whatsapp' ? { phoneNumber: a.phone_number || '', message: a.message } : { url: a.url || '' }),
    } as Business['actions'][number])),
  }
}
