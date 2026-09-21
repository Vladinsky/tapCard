import type { Business } from '../types/business'
import { mockVenue } from './mockVenue'

// Preserve the existing venue and its configured links through a small adapter.
export const businesses: Business[] = [
  {
    id: mockVenue.id,
    slug: mockVenue.slug,
    name: mockVenue.name,
    description: mockVenue.description,
    primaryColor: '#0862ff',
    coverUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=960&q=80',
    logoUrl: mockVenue.logoUrl || '/business-demo-logo.svg',
    // Demo placeholder: replace with the real Google review URL before publishing.
    googleReviewUrl: 'https://search.google.com/local/writereview?placeid=DEMO_BAR_CENTRALE',
    actions: mockVenue.links.flatMap((link) => link.type === 'review' ? [] : [{
      id: link.id, type: link.type, title: link.label, url: link.url,
      subtitle: link.type === 'instagram' ? 'Novità, eventi e contenuti esclusivi' : 'Scopri i nostri prodotti e servizi',
    }]),
  },
  {
    id: 'studio-demo',
    slug: 'studio-esempio',
    name: 'Studio Forma',
    description: 'Uno spazio per le idee. Architettura e design, dalle prime bozze ai piccoli dettagli.',
    primaryColor: '#e8d9bc',
    coverUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=960&q=80',
    actions: [
      { id: 'website', type: 'website', subtitle: 'Destinazione dimostrativa: example.com', url: 'https://example.com' },
      { id: 'catalog', type: 'catalog', title: 'Esplora i nostri progetti', subtitle: 'Destinazione dimostrativa: example.com', url: 'https://example.com' },
    ],
  },
]
