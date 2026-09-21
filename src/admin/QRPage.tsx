import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import { cardLinks } from '../lib/links'
import { useBusiness } from './data'
import { qrOptions } from '../lib/qr'

export function QRPage() {
  const { id } = useParams()
  const { row, error } = useBusiness(id)
  const [generated, setGenerated] = useState({ qr: '', png: '', svg: '' })
  const [message, setMessage] = useState('')
  let links: ReturnType<typeof cardLinks> | undefined
  let unavailable = error
  try { if (row) { if (row.status !== 'published') throw new Error('Pubblica l’attività prima di esportare QR e link.'); links = cardLinks(import.meta.env.VITE_PUBLIC_BASE_URL, row.slug) } }
  catch (err) { unavailable = (err as Error).message }
  const qr = links?.qr
  const { png, svg } = generated.qr === qr ? generated : { png: '', svg: '' }
  useEffect(() => {
    let active = true
    if (qr) void Promise.all([QRCode.toDataURL(qr, qrOptions), QRCode.toString(qr, { ...qrOptions, type: 'svg' })])
      .then(([png, svg]) => { if (active) setGenerated({ qr, png, svg }) }).catch(e => { if (active) setMessage(e.message) })
    return () => { active = false }
  }, [qr])
  const copy = async (text: string) => { try { await navigator.clipboard.writeText(text); setMessage('Link copiato.') } catch { setMessage('Copia non disponibile: seleziona e copia il link visualizzato.') } }
  return <><h1>QR e NFC · {row?.name}</h1>{unavailable && <p role="alert">{unavailable}</p>}{!row && !error && <p>Caricamento…</p>}{links && <><p>Il QR resta valido quando modifichi i collegamenti dell’attività.</p>{png && <img className="qr-preview" src={png} alt="Codice QR della pagina pubblica" />}<div className="toolbar">{png && <a className="button" download={`${row!.slug}-qr.png`} href={png}>Scarica PNG 2048 px</a>}{svg && <a className="button" download={`${row!.slug}-qr.svg`} href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}>Scarica SVG</a>}</div><label>Link QR<input readOnly value={links.qr} /></label><button onClick={() => void copy(links.qr)}>Copia link QR</button><label>Link NFC<input readOnly value={links.nfc} /></label><button onClick={() => void copy(links.nfc)}>Copia link NFC</button><p>Copiare il link NFC non scrive fisicamente il tag: usa un’app o dispositivo di scrittura NFC.</p></>}<p role="status">{message}</p></>
}
