import { businesses } from '../data/businesses'
import type { Business } from '../types/business'

export type BusinessResult =
  | { status: 'ready'; business: Business; demo: boolean }
  | { status: 'not-found' }
  | { status: 'error' }

// Replace this synchronous adapter with the real data source when available.
export function getBusiness(slug: string): BusinessResult {
  const business = businesses.find((entry) => entry.slug === slug)
  if (!business) return { status: 'not-found' }
  if (!business.name?.trim() || !Array.isArray(business.actions)) return { status: 'error' }
  return { status: 'ready', business, demo: true }
}
