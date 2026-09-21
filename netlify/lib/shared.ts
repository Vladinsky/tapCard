import { createClient } from '@supabase/supabase-js'
import { normalizeSource } from '../../src/lib/links'
import { reviewUrl, webUrl } from '../../src/utils/businessLinks'

export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export function serverDb() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Server Supabase environment missing')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}
export function eventInput(input: Record<string, unknown>) {
  if (typeof input.business !== 'string' || !uuid.test(input.business) || typeof input.event !== 'string' || !uuid.test(input.event)) throw new Error('Invalid identifiers')
  return { business: input.business, event: input.event, source: normalizeSource(typeof input.source === 'string' ? input.source : null) }
}
export function destination(action: { type: string; url?: string | null; phone_number?: string | null; message?: string | null }) {
  if (action.type === 'review') return reviewUrl(action.url || '')
  if (action.type === 'phone' || action.type === 'whatsapp') {
    if (!/^\+[1-9]\d{6,14}$/.test(action.phone_number || '')) return
    return action.type === 'phone' ? `tel:${action.phone_number}` : `https://wa.me/${action.phone_number!.slice(1)}${action.message ? '?text=' + encodeURIComponent(action.message) : ''}`
  }
  if (!['website', 'menu', 'catalog', 'instagram', 'facebook', 'directions'].includes(action.type)) return
  return webUrl(action.url || '')
}
export async function record(client: ReturnType<typeof serverDb>, input: ReturnType<typeof eventInput>, kind: string, action: string) {
  const { data, error } = await client.rpc('record_event', { p_event: input.event, p_business: input.business, p_kind: kind, p_action: action, p_source: input.source }).abortSignal(AbortSignal.timeout(1500))
  if (error) throw error
  return data === true
}
export function response(status: number, message: string) {
  return new Response(status === 204 ? null : message, { status, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' } })
}
