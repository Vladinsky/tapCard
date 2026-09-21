import type { Venue } from '../types/Venue'

export const mockVenue: Venue = {
    id : '1',
    slug: 'bar-centrale',
    name: 'Bar Centrale',
    description : 'Scopri il nostro menu e seguici sui social per rimanere aggiornato sulle nostre novità!',
    primaryColor: '#2563eb',
    links: [
        {
            id: 'instagram',
            type: 'instagram',
            label: 'Seguici su Instagram',
            url: 'https://www.instagram.com'
        },
    {
        id: 'menu',
        type: 'menu',
        label: 'Visualizza il nostro menu',
        url: 'https://www.example.com/menu'
    },
    {
        id: 'review',
        type: 'review',
        label: 'Lascia una recensione',
        url: 'https://www.example.com/review'
    },
    ],
}
