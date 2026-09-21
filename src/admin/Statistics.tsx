import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { db } from '../lib/supabase'
import { useBusiness } from './data'

interface Stats { opens: number; sources: Record<string, number>; clicks: Record<string, number>; daily: { day: string; opens: number; clicks: number }[] }
function romeDate(offset = 0) { const date = new Date(); date.setDate(date.getDate() + offset); return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Rome' }).format(date) }
export function Statistics() {
  const { id } = useParams()
  const { row, error: rowError } = useBusiness(id)
  const [from, setFrom] = useState(romeDate(-6))
  const [to, setTo] = useState(romeDate())
  const key = `${id}:${from}:${to}`
  const valid = !!from && !!to && from <= to
  const [result, setResult] = useState<{ key: string; stats: Stats | null; error: string }>({ key: '', stats: null, error: '' })
  const stats = result.key === key ? result.stats : null
  const error = !valid ? 'Seleziona un intervallo valido.' : result.key === key ? result.error : ''
  useEffect(() => {
    let active = true
    if (!valid) return
    void db().rpc('business_statistics', { p_business: id, p_from: from, p_to: to }).then(({ data, error }) => { if (active) setResult({ key, stats: error ? null : data, error: error?.message || '' }) })
    return () => { active = false }
  }, [id, from, to, key, valid])
  return <><h1>Statistiche · {row?.name}</h1><p>Fuso orario Europe/Rome. Aperture e click, non persone uniche, scansioni fisiche certe, recensioni pubblicate o follower acquisiti.</p><div className="toolbar">{[7, 30].map(n => <button key={n} onClick={() => { setFrom(romeDate(1 - n)); setTo(romeDate()) }}>Ultimi {n} giorni</button>)}</div><div className="form-grid"><label>Dal<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label>Al (incluso, massimo 366 giorni)<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label></div><p role="alert">{error || rowError}</p>{!stats && !error && <p>Caricamento…</p>}{stats && <><h2>Aperture: {stats.opens}</h2><div className="toolbar">{['qr', 'nfc', 'direct'].map(source => <p key={source}>{source.toUpperCase()}: <strong>{stats.sources[source] || 0}</strong></p>)}</div><h2>Click per azione</h2><table><thead><tr><th>Azione</th><th>Click</th></tr></thead><tbody>{Object.entries(stats.clicks).map(([key, count]) => <tr key={key}><td>{key === 'review' ? 'Click su recensione Google' : row?.business_actions.find(a => a.id === key)?.title || row?.business_actions.find(a => a.id === key)?.type || `Azione rimossa (${key})`}</td><td>{count}</td></tr>)}</tbody></table><p>Un click su recensione non dimostra che sia stata pubblicata una recensione.</p><h2>Andamento giornaliero</h2><table><thead><tr><th>Giorno</th><th>Aperture</th><th>Click</th></tr></thead><tbody>{stats.daily.map(d => <tr key={d.day}><td>{d.day}</td><td>{d.opens}</td><td>{d.clicks}</td></tr>)}</tbody></table>{!stats.daily.length && <p>Nessun evento nell’intervallo.</p>}</>}</>
}
