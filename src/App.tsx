import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import './App.css'
import './admin/admin.css'
import { BusinessPage } from './pages/BusinessPage'
import { AdminGate, Login } from './admin/Auth'
import { BusinessList } from './admin/BusinessList'
import { BusinessEditor } from './admin/BusinessEditor'
import { QRPage } from './admin/QRPage'
import { Statistics } from './admin/Statistics'

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<main className="business-page"><section className="business-state"><h1>TapCard</h1><p>Apri il link o il QR della tua attività.</p><Link to="/admin">Area amministrativa</Link></section></main>} />
    <Route path="/b/:slug" element={<BusinessPage />} />
    <Route path="/admin/login" element={<Login />} />
    <Route path="/admin" element={<AdminGate />}>
      <Route index element={<BusinessList />} />
      <Route path="businesses/new" element={<BusinessEditor />} />
      <Route path="businesses/:id/edit" element={<BusinessEditor />} />
      <Route path="businesses/:id/qr" element={<QRPage />} />
      <Route path="businesses/:id/statistics" element={<Statistics />} />
    </Route>
    <Route path="*" element={<main className="business-page"><section className="business-state"><h1>Pagina non trovata</h1><Link to="/">Torna a TapCard</Link></section></main>} />
  </Routes></BrowserRouter>
}
