import { destination, eventInput, record, response, serverDb, uuid } from '../lib/shared'

export default async (request: Request) => {
  if (request.method !== 'GET') return response(405, 'Method not allowed')
  if (request.url.length > 1024) return response(414, 'URL too long')
  const params = new URL(request.url).searchParams
  let input: ReturnType<typeof eventInput>
  const action = params.get('action') || ''
  try { input = eventInput(Object.fromEntries(params)); if (action !== 'review' && !uuid.test(action)) throw new Error('Invalid action') }
  catch { return response(400, 'Invalid identifiers') }
  try {
    const client = serverDb()
    const { data: business, error } = await client.from('businesses').select('id,google_review_url').eq('id', input.business).eq('status', 'published').maybeSingle()
    if (error) throw error
    if (!business) return response(404, 'Business unavailable')
    let target: string | undefined
    if (action === 'review') target = destination({ type: 'review', url: business.google_review_url })
    else {
      const result = await client.from('business_actions').select('type,url,phone_number,message').eq('id', action).eq('business_id', business.id).eq('enabled', true).maybeSingle()
      if (result.error) throw result.error
      if (result.data) target = destination(result.data)
    }
    if (!target) return response(404, 'Action unavailable')
    try { if (!await record(client, input, 'click', action)) console.warn('analytics_click_rate_limited') }
    catch (error) { console.error('analytics_click_failed', error instanceof Error ? error.message : 'database error') }
    return new Response(null, { status: 302, headers: { Location: target, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } })
  } catch (error) {console.error('redirect_resolution_failed', {
                     code:
                       typeof error === 'object' && error !== null && 'code' in error
                         ? String(error.code)
                         : 'unknown',
                     message:
                       typeof error === 'object' && error !== null && 'message' in error
                         ? String(error.message)
                         : 'Unknown error',
                   }) }
}

