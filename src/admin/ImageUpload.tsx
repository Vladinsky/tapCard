import { useState } from 'react'
import { db } from '../lib/supabase'

export function ImageUpload({ label, value, onChange, onBusy }: { label: string; value: string | null; onChange: (url: string | null) => void; onBusy: (busy: boolean) => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return <fieldset><legend>{label}</legend>{value && <img className="upload-preview" src={value} alt={`Anteprima ${label}`} />}<label>JPEG, PNG o WebP · massimo 5 MiB<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={async e => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string, string>)[file.type]
    if (!ext || file.size > 5242880) { setError('Tipo non consentito o file oltre 5 MiB.'); return }
    setBusy(true); onBusy(true)
    try {
      const bitmap = await createImageBitmap(file)
      bitmap.close()
      const path = `${crypto.randomUUID()}.${ext}`
      const { error } = await db().storage.from('business-images').upload(path, file, { contentType: file.type, upsert: false })
      if (error) throw error
      onChange(db().storage.from('business-images').getPublicUrl(path).data.publicUrl)
    } catch (error) { setError(error instanceof Error ? error.message : 'Upload fallito. L’immagine precedente è conservata.') }
    finally { setBusy(false); onBusy(false) }
  }} /></label>{value && <button type="button" disabled={busy} onClick={() => onChange(null)}>Rimuovi dalla card</button>}<p role="alert">{error}</p>{busy && <p>Caricamento immagine…</p>}</fieldset>
}
