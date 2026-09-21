import { useEffect, useState } from 'react'
import { db } from '../lib/supabase'

// Explicit cleanup avoids deleting an image still used by another card or an unsaved editor.
export function ImageLibrary() {
  const [names, setNames] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    let active = true
    void db().storage.from('business-images').list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } }).then(({ data, error }) => {
      if (active) { setNames((data || []).map(f => f.name)); if (error) setMessage(error.message) }
    })
    return () => { active = false }
  }, [revision])
  return <details><summary>Gestisci file immagini (ultimi 100)</summary><p>Elimina solo file non usati. Chiudi gli editor aperti prima della pulizia. I file rimossi dalla card restano qui fino all’eliminazione esplicita.</p><div className="image-library">{names.map(name => {
    const url = db().storage.from('business-images').getPublicUrl(name).data.publicUrl
    return <article key={name}><img className="upload-preview" src={url} alt="File caricato" /><button onClick={async () => {
      setMessage('')
      const { data, error } = await db().from('businesses').select('id').or(`logo_url.eq.${url},cover_url.eq.${url}`).limit(1)
      if (error) { setMessage(error.message); return }
      if (data?.length) { setMessage('File ancora utilizzato da un’attività. Rimuovilo dalla card e salva prima.'); return }
      if (!confirm('Eliminare questo file inutilizzato dallo Storage? Controlla che non sia in un editor ancora da salvare.')) return
      const result = await db().storage.from('business-images').remove([name])
      if (result.error) setMessage(result.error.message); else { setRevision(n => n + 1); setMessage('File eliminato.') }
    }}>Elimina file</button></article>
  })}</div><p role="status">{message}</p></details>
}
