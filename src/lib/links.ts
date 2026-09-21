export function normalizeSource(value: string | null): 'qr' | 'nfc' | 'direct' {
  return value === 'qr' || value === 'nfc' ? value : 'direct'
}
export function cardLinks(base: string | undefined, slug: string) {
  if (!base) throw new Error('Configura VITE_PUBLIC_BASE_URL con il dominio canonico di produzione.')
  const url = new URL(base)
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash ||
      !url.hostname.includes('.') || /localhost|127\.0\.0\.1|\[::1\]|--.*\.netlify\.app$/i.test(url.hostname)) {
    throw new Error('Serve un dominio HTTPS canonico, senza percorsi, localhost o deploy preview.')
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error('Slug non valido')
  return { qr: `${url.origin}/b/${slug}?source=qr`, nfc: `${url.origin}/b/${slug}?source=nfc` }
}
export function redirectLink(business: string, action: string, source: string, event = crypto.randomUUID()) {
  return '/api/redirect?' + new URLSearchParams({ business, action, source, event })
}
