import './App.css'
import { mockVenue } from './data/mockVenue'

function App() {
  return (
    <main className="venue-page">
      <section className="venue-card">
        <div className="venue-logo" aria-hidden="true">
          BC
        </div>

        <h1 className="venue-title">{mockVenue.name}</h1>
        <p className="venue-description">{mockVenue.description}</p>

        <nav className="venue-actions" aria-label="Collegamenti del locale">
          {mockVenue.links.map((link) => (
            <a
              className="venue-link"
              href={link.url}
              key={link.id}
              rel="noreferrer"
              target="_blank"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </section>
    </main>
  )
}

export default App