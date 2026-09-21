import type { BusinessAction, BusinessActionType } from '../types/business'

export const actionLabels: Record<BusinessActionType, string> = {
  website: 'Sito web', menu: 'Menu', catalog: 'Catalogo', instagram: 'Instagram',
  facebook: 'Facebook', whatsapp: 'WhatsApp', phone: 'Telefono', directions: 'Indicazioni stradali',
}

export function webUrl(value?: string): string | undefined {
  if (!value || value.length > 2048 || /[\s\\]/.test(value) || !/^https?:\/\//i.test(value)) return
  if ([...value].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return
  try {
    const url = new URL(value)
    if (!url.hostname || url.username || url.password) return
    return url.href
  } catch { return }
}

// Explicit supported Google review hosts. Path validation excludes generic homepages.
export function reviewUrl(value?: string): string | undefined {
  const valid = webUrl(value)
  if (!valid) return
  const url = new URL(valid)
  if (url.port || url.protocol !== 'https:') return
  if (url.hostname === 'g.page' && /^\/r\/[^/]+\/review\/?$/.test(url.pathname)) return valid
  if (url.hostname === 'search.google.com' && url.pathname === '/local/writereview' && url.searchParams.get('placeid')?.trim()) return valid
}

export function normalizePhone(value: string, international = false): string | undefined {
  if (typeof value !== 'string' || !/^[+\d\s().-]+$/.test(value)) return
  let number = value.replace(/[\s().-]/g, '')
  if (number.startsWith('00')) number = '+' + number.slice(2)
  if (!/^\+?\d{7,15}$/.test(number)) return
  if (international && !/^\+[1-9]\d{6,14}$/.test(number)) return
  return number
}

export interface ResolvedAction {
  id: string
  type: BusinessActionType
  title: string
  subtitle?: string
  href: string
  external: boolean
}

export function resolveActions(actions: BusinessAction[]): ResolvedAction[] {
  const ids = new Set<string>()
  return actions.flatMap((action) => {
    if (action.enabled === false || !action.id || ids.has(action.id) || !(action.type in actionLabels)) return []
    let href: string | undefined
    if (action.type === 'phone' || action.type === 'whatsapp') {
      const number = normalizePhone(action.phoneNumber, action.type === 'whatsapp')
      if (number) href = action.type === 'phone' ? 'tel:' + number :
        'https://wa.me/' + number.slice(1) + (action.message ? '?text=' + encodeURIComponent(action.message) : '')
    } else href = webUrl(action.url)
    if (!href) return []
    ids.add(action.id)
    return [{
      id: action.id, type: action.type, title: action.title?.trim() || actionLabels[action.type],
      subtitle: action.subtitle?.trim(), href, external: action.type !== 'phone',
    }]
  })
}

export function imageUrl(value?: string): string | undefined {
  // Local public assets are allowed for images, never for outbound actions.
  if (value && /^\/(?!\/)/.test(value) && !/[\\\s]/.test(value)) return value
  return webUrl(value)
}
