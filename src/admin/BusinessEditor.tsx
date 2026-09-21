import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { db } from '../lib/supabase'
import { toBusiness } from '../lib/businessAdapter'
import type { ActionRow, BusinessRow } from '../lib/businessAdapter'
import { actionLabels, reviewUrl, webUrl } from '../utils/businessLinks'
import { BusinessLandingPage } from '../components/BusinessLandingPage'
import { ImageUpload } from './ImageUpload'
import { useBusiness } from './data'

export function BusinessEditor() {
  const { id } = useParams()
  const { row, error } = useBusiness(id)
  if (id && !row) return <p role="status">{error || 'Caricamento…'}</p>
  return <Editor key={id || 'new'} initial={row || { id: crypto.randomUUID(), name: '', slug: '', description: '', primary_color: '#245b47', logo_url: null, cover_url: null, google_review_url: null, status: 'draft', first_published_at: null, business_actions: [] }} />
}
function Editor({ initial }: { initial: BusinessRow }) {
  const [row, setRow] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [uploads, setUploads] = useState(0)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(false)
  const navigate = useNavigate()
  const change = <K extends keyof BusinessRow>(key: K, value: BusinessRow[K]) => setRow(r => ({ ...r, [key]: value }))
  const actions = [...row.business_actions].sort((a, b) => a.position - b.position)
  const setActions = (next: ActionRow[]) => change('business_actions', next.map((a, position) => ({ ...a, position })))
  const updateAction = (id: string, patch: Partial<ActionRow>) => setActions(actions.map(a => a.id === id ? { ...a, ...patch } : a))
  const uploadBusy = (value: boolean) => setUploads(n => n + (value ? 1 : -1))
  return <><h1>{initial.name ? 'Modifica attività' : 'Nuova attività'}</h1><form onSubmit={async e => {
    e.preventDefault(); setBusy(true); setMessage('')
    try {
      if (row.google_review_url && !reviewUrl(row.google_review_url)) throw new Error('Inserisci un link Google g.page/r/…/review oppure search.google.com/local/writereview?placeid=…')
      for (const a of actions) {
        if (a.type === 'phone' || a.type === 'whatsapp') { if (!/^\+[1-9]\d{6,14}$/.test(a.phone_number || '')) throw new Error('Numeri in formato internazionale, esempio +390212345678.') }
        else if (!webUrl(a.url || '')) throw new Error('Ogni azione web richiede un URL HTTP/HTTPS senza credenziali.')
      }
      const { business_actions: ignored, ...business } = row
      void ignored
      const { error } = await db().rpc('save_business', { p_business: business, p_actions: actions })
      if (error) throw error
      setRow(r => ({ ...r, first_published_at: r.first_published_at || (r.status === 'published' ? new Date().toISOString() : null) }))
      setMessage('Attività e azioni salvate.')
      navigate(`/admin/businesses/${row.id}/edit`, { replace: true })
    } catch (err) { setMessage(err instanceof Error ? err.message : (err as { message?: string }).message || 'Salvataggio fallito') }
    finally { setBusy(false) }
  }}><fieldset disabled={busy}><legend>Dati attività</legend><div className="form-grid"><label>Nome<input required maxLength={120} value={row.name} onChange={e => change('name', e.target.value)} /></label><label>Slug · bloccato dopo la prima pubblicazione<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} disabled={!!row.first_published_at} value={row.slug} onChange={e => change('slug', e.target.value)} /></label><label>Colore principale<input type="color" value={row.primary_color} onChange={e => change('primary_color', e.target.value)} /></label><label>Stato<select value={row.status} onChange={e => change('status', e.target.value as BusinessRow['status'])}><option value="draft">Bozza</option><option value="published">Pubblicata</option><option value="inactive">Disattivata</option></select></label></div><label>Descrizione<textarea maxLength={1000} value={row.description} onChange={e => change('description', e.target.value)} /></label><label>URL recensione Google<input type="url" maxLength={2048} value={row.google_review_url || ''} onChange={e => change('google_review_url', e.target.value || null)} /></label><div className="form-grid"><ImageUpload label="Immagine profilo" value={row.logo_url} onChange={v => change('logo_url', v)} onBusy={uploadBusy} /><ImageUpload label="Copertina" value={row.cover_url} onChange={v => change('cover_url', v)} onBusy={uploadBusy} /></div><p>Le immagini caricate sono pubbliche, anche per le bozze. Rimozione e sostituzione diventano effettive sulla card dopo il salvataggio.</p></fieldset>
    <fieldset disabled={busy}><legend>Collegamenti ordinati</legend>{actions.map((a, i) => <fieldset key={a.id}><legend>Azione {i + 1}</legend><div className="form-grid"><label>Tipo<select value={a.type} onChange={e => updateAction(a.id, { type: e.target.value as ActionRow['type'], url: null, phone_number: null })}>{Object.entries(actionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Etichetta<input maxLength={120} value={a.title} onChange={e => updateAction(a.id, { title: e.target.value })} /></label><label>Sottotitolo<input maxLength={240} value={a.subtitle} onChange={e => updateAction(a.id, { subtitle: e.target.value })} /></label>{a.type === 'phone' || a.type === 'whatsapp' ? <label>Telefono internazionale<input required placeholder="+390212345678" pattern="\+[1-9][0-9]{6,14}" value={a.phone_number || ''} onChange={e => updateAction(a.id, { phone_number: e.target.value })} /></label> : <label>URL<input required type="url" maxLength={2048} value={a.url || ''} onChange={e => updateAction(a.id, { url: e.target.value })} /></label>}{a.type === 'whatsapp' && <label>Messaggio WhatsApp<input maxLength={1000} value={a.message} onChange={e => updateAction(a.id, { message: e.target.value })} /></label>}</div><label className="check"><input type="checkbox" checked={a.enabled} onChange={e => updateAction(a.id, { enabled: e.target.checked })} />Attiva</label><div className="toolbar"><button type="button" disabled={!i} onClick={() => { const next = [...actions]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; setActions(next) }}>Sposta su</button><button type="button" disabled={i === actions.length - 1} onClick={() => { const next = [...actions]; [next[i + 1], next[i]] = [next[i], next[i + 1]]; setActions(next) }}>Sposta giù</button><button type="button" onClick={() => setActions(actions.filter(item => item.id !== a.id))}>Rimuovi azione</button></div></fieldset>)}<button type="button" disabled={actions.length >= 100} onClick={() => setActions([...actions, { id: crypto.randomUUID(), type: 'website', title: '', subtitle: '', url: '', phone_number: null, message: '', enabled: true, position: actions.length }])}>Aggiungi azione</button></fieldset><div className="toolbar"><button disabled={busy || uploads > 0}>{busy ? 'Salvataggio…' : 'Salva attività'}</button><button type="button" onClick={() => setPreview(!preview)}>{preview ? 'Chiudi anteprima' : 'Anteprima anche della bozza'}</button></div><p role="status">{message}</p></form>{preview && <section aria-label="Anteprima"><p>Anteprima amministrativa · nessun evento statistico registrato.</p><BusinessLandingPage business={toBusiness(row)} /></section>}</>
}
