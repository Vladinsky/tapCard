import { db, demoMode } from '../lib/supabase'
import { toBusiness } from '../lib/businessAdapter'

export async function getBusiness(slug: string, signal: AbortSignal) {
  if (demoMode) {
    const { businesses } = await import('../data/businesses')
    return businesses.find(b => b.slug === slug) || null
  }
  const { data, error } = await db().from('businesses').select('*,business_actions(*)')
    .eq('slug', slug).eq('status', 'published').abortSignal(signal).maybeSingle()
  if (error) throw error
  return data ? toBusiness(data) : null
}
