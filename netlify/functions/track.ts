import { eventInput, record, response, serverDb } from '../lib/shared'

export default async (request: Request) => {
  if (request.method !== 'POST') return response(405, 'Method not allowed')
  if (request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) return response(403, 'Origin denied')
  if (!request.headers.get('content-type')?.startsWith('application/json')) return response(415, 'JSON required')
  if (Number(request.headers.get('content-length') || 0) > 1024) return response(413, 'Payload too large')
  let input: ReturnType<typeof eventInput>
  try {
    // Read a bounded stream, including requests without Content-Length.
    const reader = request.body?.getReader()
    if (!reader) return response(400, 'Missing body')
    let body = ''; let bytes = 0
    const decoder = new TextDecoder()
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > 1024) { await reader.cancel(); return response(413, 'Payload too large') }
      body += decoder.decode(value, { stream: true })
    }
    body += decoder.decode()
    input = eventInput(JSON.parse(body))
  } catch { return response(400, 'Invalid event') }
  try { return await record(serverDb(), input, 'open', 'page') ? response(204, '') : response(429, 'Event unavailable or rate limited') }
  catch (error) { console.error('analytics_open_failed', error instanceof Error ? error.message : 'database error'); return response(503, 'Tracking unavailable') }
}
