import { chromium, expect } from '@playwright/test'
import { createServer } from 'vite'
import { mkdir } from 'node:fs/promises'
import { PNG } from 'pngjs'
import jsQR from 'jsqr'

// Contract fixtures, not a claim of a live Supabase integration test.
const id = '11111111-1111-4111-8111-111111111111'
const user = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'admin@example.test', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() }
let business = { id, name: 'Bar Centrale', slug: 'bar-centrale', description: 'Un punto di incontro, ogni giorno. Caffè, aperitivi e piccoli momenti da condividere.', primary_color: '#0862ff', logo_url: null, cover_url: null, google_review_url: 'https://g.page/r/test/review', status: 'published', first_published_at: '2026-09-21T10:00:00Z', business_actions: [
  { id: '33333333-3333-4333-8333-333333333333', type: 'menu', title: 'Il nostro menu', subtitle: 'Scopri prodotti e servizi', url: 'https://example.com/menu', phone_number: null, message: '', enabled: true, position: 0 },
  { id: '44444444-4444-4444-8444-444444444444', type: 'phone', title: 'Chiamaci', subtitle: '', url: null, phone_number: '+390212345678', message: '', enabled: true, position: 1 },
] }
let saves = 0
let opens = 0
const server = await createServer({ server: { host: '127.0.0.1', port: 5174, strictPort: true }, define: {
  'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://supabase.test'),
  'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('test-public-key'),
  'import.meta.env.VITE_PUBLIC_BASE_URL': JSON.stringify('https://tapcard.example'),
  'import.meta.env.VITE_DEMO_MODE': JSON.stringify('false'),
} })
await server.listen()
const browser = await chromium.launch({ channel: 'chrome', headless: true })
await mkdir('artifacts/ui', { recursive: true })
try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 950 } })
    const page = await context.newPage()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.route('https://supabase.test/**', async route => {
      const request = route.request()
      const url = new URL(request.url())
      let data: unknown = null
      if (url.pathname.includes('/auth/v1/token')) data = { access_token: `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.test`, refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer', user }
      else if (url.pathname.includes('/auth/v1/user')) data = user
      else if (url.pathname.includes('/rpc/is_admin')) data = true
      else if (url.pathname.includes('/rpc/save_business')) { saves++; const body = request.postDataJSON(); business = { ...business, ...body.p_business, business_actions: body.p_actions }; data = id }
      else if (url.pathname.includes('/rpc/business_statistics')) data = { opens: 14, sources: { qr: 9, nfc: 3, direct: 2 }, clicks: { review: 5, '33333333-3333-4333-8333-333333333333': 8 }, daily: [{ day: '2026-09-21', opens: 14, clicks: 13 }] }
      else if (url.pathname.includes('/storage/')) data = []
      else if (url.pathname.includes('/rest/v1/businesses')) data = url.searchParams.has('id') || url.searchParams.has('slug') ? business : [business]
      else if (url.pathname.includes('/auth/v1/logout')) data = {}
      else throw new Error(`Unhandled fixture request: ${request.url()}`)
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) })
    })
    await page.route('**/api/track', async route => { opens++; await route.fulfill({ status: 204 }) })
    const check = async (name: string) => {
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      await page.screenshot({ path: `artifacts/ui/${width}-${name}.png`, fullPage: true })
    }
    const before = opens
    await page.goto('http://127.0.0.1:5174/b/bar-centrale?source=qr')
    await expect(page.getByRole('heading', { name: 'Bar Centrale' })).toBeVisible()
    await expect.poll(() => opens - before).toBe(1)
    await expect(page.getByRole('link', { name: /Il nostro menu/ })).toHaveAttribute('href', /\/api\/redirect\?.*source=qr/)
    await check('public-light')
    await page.emulateMedia({ colorScheme: 'dark' }); await check('public-dark'); await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('http://127.0.0.1:5174/admin')
    await expect(page).toHaveURL(/\/admin\/login$/)
    await check('login')
    await page.getByLabel('Email').fill('admin@example.test')
    await page.getByLabel('Password').fill('synthetic-fixture-password')
    await page.getByRole('button', { name: 'Accedi', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Le tue attività' })).toBeVisible()
    await check('admin-list')
    await page.getByRole('link', { name: 'Modifica / anteprima' }).click()
    await expect(page.getByLabel('Nome', { exact: true })).toHaveValue('Bar Centrale')
    await expect(page.getByLabel('Slug', { exact: false })).toBeDisabled()
    await check('editor')
    const savedBefore = saves
    await page.getByRole('button', { name: 'Salva attività' }).click()
    await expect.poll(() => saves - savedBefore).toBe(1)
    await expect(page.getByRole('status')).toContainText('salvate')
    await page.getByRole('button', { name: 'Anteprima anche della bozza' }).click()
    await expect(page.getByLabel('Anteprima', { exact: true })).toBeVisible()
    await check('preview')
    await page.goto(`http://127.0.0.1:5174/admin/businesses/${id}/qr`)
    await expect(page.getByRole('link', { name: 'Scarica PNG 2048 px' })).toBeVisible()
    const pngUrl = await page.getByRole('link', { name: 'Scarica PNG 2048 px' }).getAttribute('href')
    const png = PNG.sync.read(Buffer.from(pngUrl!.split(',')[1], 'base64'))
    expect(jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data).toBe('https://tapcard.example/b/bar-centrale?source=qr')
    await check('qr')
    await page.goto(`http://127.0.0.1:5174/admin/businesses/${id}/statistics`)
    await expect(page.getByRole('heading', { name: 'Aperture: 14' })).toBeVisible()
    await check('statistics')
    await page.goto('http://127.0.0.1:5174/admin/businesses/new')
    await expect(page.getByRole('heading', { name: 'Nuova attività' })).toBeVisible()
    await expect(page.getByLabel('Slug', { exact: false })).toBeEnabled()
    await check('new')
    expect(errors).toEqual([])
    await context.close()
    console.log(`UI ${width}px: public light/dark, login, list, editor/save/preview, QR decode, statistics, new; no horizontal overflow or browser exceptions.`)
  }
} finally { await browser.close(); await server.close() }
