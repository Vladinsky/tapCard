import { useId } from 'react'
import type { BusinessActionType } from '../types/business'

const paths: Record<BusinessActionType | 'review', string> = {
  website: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c4 5 4 13 0 18-4-5-4-13 0-18Z',
  menu: 'M5 3h14v18H5zM8 7h8M8 11h8M8 15h5',
  catalog: 'M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3zM12 6v15',
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM17 7h.01',
  facebook: 'M14 21v-8h3l1-4h-4V7c0-1 1-2 2-2h2V2h-3c-3 0-5 2-5 5v2H7v4h3v8',
  whatsapp: 'M21 11.5a9 9 0 0 1-13 8L3 21l1.5-5A9 9 0 1 1 21 11.5ZM8 7c0 5 4 9 9 9l-2-3-2 1-3-3 1-2-3-2Z',
  phone: 'm7 3 3 5-2 2a13 13 0 0 0 6 6l2-2 5 3c0 3-2 4-4 4C10 20 4 14 3 7c0-2 1-4 4-4Z',
  directions: 'M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0ZM14 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z',
  review: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z',
}

export function ActionIcon({ type }: { type: BusinessActionType | 'review' }) {
  const gradientId = useId()
  if (type === 'review') return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285f4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z" /><path fill="#34a853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.58-4.12H3.08v2.59A10 10 0 0 0 12 22Z" /><path fill="#fbbc05" d="M6.42 13.92A6 6 0 0 1 6.1 12c0-.67.12-1.31.32-1.92V7.49H3.08A10 10 0 0 0 2 12c0 1.61.38 3.14 1.08 4.51Z" /><path fill="#ea4335" d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.92 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z" /></svg>
  if (type === 'instagram') return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><defs><linearGradient id={gradientId} x1="0" y1="1" x2=".7" y2="0"><stop stopColor="#ffbf00" /><stop offset=".45" stopColor="#ff1464" /><stop offset="1" stopColor="#9200c9" /></linearGradient></defs><rect x="5" y="5" width="38" height="38" rx="11" stroke={`url(#${gradientId})`} strokeWidth="4" /><circle cx="24" cy="24" r="9" stroke={`url(#${gradientId})`} strokeWidth="4" /><circle cx="35" cy="13" r="2.5" fill="#bb08aa" /></svg>
  if (type === 'facebook') return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="#0866ff" /><path fill="#fff" d="M27 47V28h6l1-7h-7v-4c0-2 1-3 4-3h3V8l-5-.5c-6 0-10 3.5-10 10V21h-5v7h5v19Z" /></svg>
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[type]} /></svg>
}
