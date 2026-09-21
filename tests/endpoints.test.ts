import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import track from '../netlify/functions/track'
import redirect from '../netlify/functions/redirect'

test('HTTP boundaries, database-resolved redirect, analytics failure and disabled actions', async () => {
  const business = '11111111-1111-4111-8111-111111111111'
  const action = '33333333-3333-4333-8333-333333333333'
  const event = '55555555-5555-4555-8555-555555555555'
  let published = true
  let enabled = true
  let analyticsFail = false
  let analyticsCalls = 0
  const server = createServer((request, response) => {
    const url = new URL(request.url!, 'http://localhost')
    response.setHeader('Content-Type', 'application/json')
    if (url.pathname.endsWith('/businesses')) {
      assert.equal(url.searchParams.get('status'), 'eq.published')
      assert.equal(url.searchParams.get('id'), `eq.${business}`)
      response.end(JSON.stringify(published ? { id: business, google_review_url: 'https://g.page/r/test/review' } : null))
    } else if (url.pathname.endsWith('/business_actions')) {
      assert.equal(url.searchParams.get('business_id'), `eq.${business}`)
      assert.equal(url.searchParams.get('enabled'), 'eq.true')
      response.end(JSON.stringify(enabled ? { type: 'phone', phone_number: '+390212345678' } : null))
    } else if (url.pathname.endsWith('/rpc/record_event')) {
      analyticsCalls++
      response.statusCode = analyticsFail ? 500 : 200
      response.end(JSON.stringify(analyticsFail ? { message: 'synthetic analytics failure' } : true))
    } else { response.statusCode = 404; response.end('{}') }
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const address = server.address() as { port: number }
  process.env.SUPABASE_URL = `http://127.0.0.1:${address.port}`
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-server-key'
  try {
    const query = new URLSearchParams({ business, action, event, source: 'qr', url: 'https://attacker.example' })
    const request = () => new Request(`https://tapcard.example/api/redirect?${query}`)
    let response = await redirect(request())
    assert.equal(response.status, 302)
    assert.equal(response.headers.get('Location'), 'tel:+390212345678', 'client URL ignored')
    analyticsFail = true
    response = await redirect(request())
    assert.equal(response.status, 302, 'analytics write failure must not block valid redirect')
    analyticsFail = false
    enabled = false
    const callsBefore = analyticsCalls
    assert.equal((await redirect(request())).status, 404)
    assert.equal(analyticsCalls, callsBefore)
    published = false
    assert.equal((await redirect(request())).status, 404)
    assert.equal((await redirect(new Request('https://tapcard.example/api/redirect?url=https://attacker.example'))).status, 400)
    assert.equal((await redirect(new Request('https://tapcard.example/api/redirect', { method: 'POST' }))).status, 405)
    assert.equal((await track(new Request('https://tapcard.example/api/track'))).status, 405)
    const post = (body: string, headers = {}) => new Request('https://tapcard.example/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body })
    assert.equal((await track(post('x'.repeat(1025)))).status, 413)
    assert.equal((await track(post('null'))).status, 400)
    assert.equal((await track(post('{}', { Origin: 'https://attacker.example' }))).status, 403)
    assert.equal((await track(post(JSON.stringify({ business, event, source: 'unknown' })))).status, 204)
  } finally { await new Promise<void>(resolve => server.close(() => resolve())); delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY }
})
