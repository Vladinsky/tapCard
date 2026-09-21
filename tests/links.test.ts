import test from 'node:test'
import assert from 'node:assert/strict'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { PNG } from 'pngjs'
import { qrOptions } from '../src/lib/qr'
import { mkdir, writeFile } from 'node:fs/promises'
import { cardLinks, normalizeSource, redirectLink } from '../src/lib/links'
import { destination, eventInput } from '../netlify/lib/shared'

test('QR and NFC use canonical stable URLs, reject local and preview domains', () => {
  assert.deepEqual(cardLinks('https://tapcard.example', 'bar-centrale'), { qr: 'https://tapcard.example/b/bar-centrale?source=qr', nfc: 'https://tapcard.example/b/bar-centrale?source=nfc' })
  for (const base of [undefined, 'http://localhost:8888', 'https://localhost', 'https://127.0.0.1', 'https://deploy-preview-1--tapcard.netlify.app', 'https://branch--tapcard.netlify.app', 'https://user:password@tapcard.example', 'https://tapcard.example/path']) assert.throws(() => cardLinks(base, 'bar'))
  assert.throws(() => cardLinks('https://tapcard.example', '../admin'))
})
test('source normalization, identifiers and redirect parameters', () => {
  assert.equal(normalizeSource('garbage'), 'direct')
  assert.equal(normalizeSource('qr'), 'qr')
  assert.equal(normalizeSource('nfc'), 'nfc')
  assert.throws(() => eventInput({ business: 'anything', event: 'anything' }))
  const url = new URL(redirectLink('id', 'review', 'qr'), 'https://tapcard.example')
  assert.equal(url.pathname, '/api/redirect')
  assert.equal(url.searchParams.has('url'), false)
})
test('destinations allow only known action types and safe protocols', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,hi', '//evil.example', 'https://user:password@example.com', 'https://example.com\n']) assert.equal(destination({ type: 'website', url }), undefined)
  assert.equal(destination({ type: 'unknown', url: 'https://example.com' }), undefined)
  assert.equal(destination({ type: 'phone', phone_number: '+390212345678' }), 'tel:+390212345678')
  assert.equal(destination({ type: 'whatsapp', phone_number: '+393331234567', message: 'Ciao a tutti' }), 'https://wa.me/393331234567?text=Ciao%20a%20tutti')
  assert.equal(destination({ type: 'review', url: 'https://evil.example/review' }), undefined)
  assert.equal(destination({ type: 'review', url: 'https://g.page/r/test/review' }), 'https://g.page/r/test/review')
})
test('exported high resolution PNG decodes to the expected QR URL', async () => {
  const expected = cardLinks('https://tapcard.example', 'bar-centrale').qr
  const options = qrOptions
  const png = await QRCode.toBuffer(expected, options)
  const parsed = PNG.sync.read(png)
  const decoded = jsQR(new Uint8ClampedArray(parsed.data), parsed.width, parsed.height)
  assert.equal(decoded?.data, expected)
  const svg = await QRCode.toString(expected, { ...options, type: 'svg' })
  assert.match(svg, /viewBox=/)
  await mkdir('artifacts', { recursive: true })
  await writeFile('artifacts/verified-qr.png', png)
  await writeFile('artifacts/verified-qr.svg', svg)
})
