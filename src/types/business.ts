export type WebUrl = string
export type HexColor = string
export type BusinessActionType = 'website' | 'menu' | 'catalog' | 'instagram' | 'facebook' | 'whatsapp' | 'phone' | 'directions'

export interface BusinessActionBase {
  id: string
  title?: string
  subtitle?: string
  enabled?: boolean
}
export type BusinessAction = BusinessActionBase & (
  | { type: Exclude<BusinessActionType, 'phone' | 'whatsapp'>; url: WebUrl }
  | { type: 'phone'; phoneNumber: string }
  | { type: 'whatsapp'; phoneNumber: string; message?: string }
)
export interface Business {
  id: string
  slug: string
  name: string
  description?: string
  coverUrl?: WebUrl
  logoUrl?: WebUrl
  primaryColor?: HexColor
  googleReviewUrl?: WebUrl
  actions: BusinessAction[]
}
