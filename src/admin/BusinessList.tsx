import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../lib/supabase'
import type { BusinessRow } from '../lib/businessAdapter'
import { ImageLibrary } from './ImageLibrary'

export function BusinessList() {
  const [rows, setRows] = useState<BusinessRow[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loadedRevision, setLoadedRevision] = useState(-1)
  const [revision, setRevision] = useState(0)
  const loading = loadedRevision !== revision
  useEffect(() => {
    let active = true
    void db().from('businesses').select('*').order('name').then(({ data, error }) => {
      if (active) { setRows(data || []); setError(error?.message || ''); setLoadedRevision(revision) }
    })
    return () => { active = false }
  }, [revision])
  return <><div className="admin-header"><h1>Le tue attività</h1><Link className="button" to="/admin/businesses/new">Nuova attività</Link></div><label>Cerca per nome o slug<input type="search" value={search} onChange={e => setSearch(e.target.value)} /></label><p role="alert">{error}</p>{loading && <p>Caricamento…</p>}<div className="business-list">{rows.filter(r => `${r.name} ${r.slug}`.toLowerCase().includes(search.toLowerCase())).map(r => <article key={r.id}><h2>{r.name}</h2><p>{r.slug} · {r.status}</p><nav><Link to={`/admin/businesses/${r.id}/edit`}>Modifica / anteprima</Link><Link to={`/admin/businesses/${r.id}/qr`}>QR e NFC</Link><Link to={`/admin/businesses/${r.id}/statistics`}>Statistiche</Link><button className="danger" onClick={async () => {
    if (!confirm(`Eliminare definitivamente ${r.name}, azioni e statistiche? I QR stampati smetteranno di funzionare.`)) return
    const { error } = await db().from('businesses').delete().eq('id', r.id)
    if (error) setError(error.message); else setRevision(v => v + 1)
  }}>Elimina</button></nav></article>)}</div>{!loading && !rows.length && <p>Nessuna attività. Crea la prima card.</p>}<ImageLibrary /></>
}
