import { useEffect, useState } from 'react'
import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { db, supabase } from '../lib/supabase'

export function AdminGate() {
  const [state, setState] = useState(supabase ? 'loading' : 'configuration')
  useEffect(() => {
    if (!supabase) return
    let generation = 0
    const check = async () => {
      const current = ++generation
      try {
        const { data: { session }, error } = await db().auth.getSession()
        if (error) throw error
        if (!session) { if (current === generation) setState('login'); return }
        const result = await db().rpc('is_admin')
        if (result.error) throw result.error
        if (current === generation) setState(result.data === true ? 'admin' : 'denied')
      } catch { if (current === generation) setState('error') }
    }
    void check()
    const { data } = supabase.auth.onAuthStateChange((event) => {
      // Token refresh/focus must not unmount an editor with unsaved changes.
      // Database RLS remains authoritative while membership is rechecked.
      if (event === 'SIGNED_OUT') { generation++; setState('login') }
      else setTimeout(() => void check(), 0)
    })
    return () => { generation++; data.subscription.unsubscribe() }
  }, [])
  if (state === 'login') return <Navigate to="/admin/login" replace />
  if (state !== 'admin') return <main className="admin"><h1>Amministrazione TapCard</h1><p role="status">{({ loading: 'Verifica accesso…', denied: 'Utente non autorizzato. Il tuo UUID deve essere autorizzato con una procedura amministrativa.', configuration: 'Configurazione Supabase mancante. Consulta .env.example.', error: 'Verifica accesso non riuscita. Ricarica per riprovare.' } as Record<string, string>)[state]}</p><Link to="/admin/login">Login</Link>{state === 'denied' && <button onClick={() => void db().auth.signOut()}>Esci</button>}</main>
  return <main className="admin"><header className="admin-header"><Link to="/admin">TapCard · Admin</Link><button onClick={async () => { const { error } = await db().auth.signOut(); if (error) alert(error.message) }}>Esci</button></header><Outlet /></main>
}

export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  return <main className="admin login"><h1>Accedi a TapCard</h1><p>Accesso riservato all’amministratore.</p><form onSubmit={async e => {
    e.preventDefault(); setBusy(true); setError('')
    try {
      const result = await db().auth.signInWithPassword({ email, password })
      if (result.error) throw result.error
      navigate('/admin', { replace: true })
    } catch (err) { setError(err instanceof Error ? err.message : 'Accesso non riuscito') }
    finally { setBusy(false) }
  }}><label>Email<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label><button disabled={busy}>{busy ? 'Accesso…' : 'Accedi'}</button><p role="alert">{error}</p></form></main>
}
