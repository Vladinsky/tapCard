# TapCard

Card pubbliche React/TypeScript/Vite, amministrazione privata Supabase e tracking tramite Netlify Functions. I componenti e la grafica pubblica esistenti sono conservati.

## Avvio

Node 24 LTS, npm. Configurazione completa e passaggi remoti in [docs/SETUP.md](docs/SETUP.md).

```powershell
npm ci
Copy-Item .env.example .env
# Compila .env localmente, senza committarlo.
npm run dev -- --offline
```

Apri http://localhost:8888. Questo è il percorso locale completo: Vite + Functions + regole Netlify. Senza configurazione Supabase viene mostrato un errore esplicito. I mock sono disponibili solo con `VITE_DEMO_MODE=true` su `/b/bar-centrale` e `/b/studio-esempio`.

## Funzionalità

- `/`: pagina iniziale TapCard; `/b/:slug`: attività pubblicata; rotta sconosciuta: pagina non trovata.
- `/admin/login`: email/password Supabase, sessione persistente e logout, nessuna registrazione.
- `/admin`: elenco, ricerca, cancellazione confermata e pulizia immagini inutilizzate.
- `/admin/businesses/new` e `/:id/edit`: editor, anteprima bozza, azioni ordinabili, immagini, stato bozza/pubblicato/disattivato. Lo slug è bloccato dopo la prima pubblicazione.
- `/admin/businesses/:id/qr`: QR PNG 2048 px, SVG, link QR/NFC basati sul dominio canonico.
- `/admin/businesses/:id/statistics`: aperture, fonti, click per azione, andamento giornaliero, 7/30 giorni e date personalizzate, Europe/Rome.
- Migrazione SQL versionata: RLS, autorizzazione admin tramite UUID, vincoli, salvataggio atomico, Storage, idempotenza e rate limiter condiviso nel database.
- API controllate: `/api/track` e `/api/redirect`; destinazioni risolte dal database e analytics senza IP/fingerprint.

## Struttura

| Percorso | Responsabilità |
| --- | --- |
| `src/components` | Componenti pubblici riutilizzati |
| `src/admin` | Auth, elenco, editor, Storage, QR e statistiche |
| `src/lib/businessAdapter.ts` | Righe SQL → modello `Business` |
| `src/services/businesses.ts` | Caricamento asincrono e demo esplicita |
| `netlify/functions` | Endpoint HTTP |
| `netlify/lib` | Validazione destinazioni e accesso server a Supabase |
| `supabase/migrations` | Schema, policy, RPC e Storage |
| `tests` | PostgreSQL locale, endpoint, QR e UI |

## Verifiche

```powershell
npm run lint
npm run build
npm test
npm run test:ui
node docs/check-business.mjs
node docs/check-business-render.mjs
```

`build` controlla anche TypeScript delle Functions e dei test. `npm test` usa il test runner Node tramite tsx, PGlite (PostgreSQL locale), un server HTTP sintetico, qrcode e jsQR. Non richiede credenziali. I test UI richiedono Chrome installato: avviano Vite sulla porta 5174 e Chrome headless, simulando le risposte Supabase. Non accedono a un progetto remoto. QR e screenshot sono salvati in `artifacts/` e ignorati da Git.

Verifiche eseguite durante questa implementazione:

- Lint senza avvisi; build frontend e controllo tipi server riusciti.
- Sei test automatici riusciti: migrazione/RLS per anonimo, admin e non-admin; bozze e azioni disabilitate; Storage; salvataggio atomico; blocco slug; idempotenza/limite eventi; aggregazione statistiche; URL sicuri; redirect senza open redirect; errore analytics; URL QR/NFC; decodifica PNG 2048 px.
- Due script di regressione pubblica riusciti.
- Netlify Dev locale: rotte pubbliche/admin e refresh serviti; API inesistente 404, redirect non valido 400, tracking GET 405. Sulla macchina verificata è stato necessario `NODE_OPTIONS=--use-system-ca` per la CLI; vedi guida.
- UI a 1440, 390 e 320 px: pubblico chiaro/scuro, login, lista, editor/salvataggio/anteprima, nuova attività, QR e statistiche. Nessun overflow orizzontale o errore JavaScript. Decodificato anche il PNG effettivamente offerto dalla pagina QR.
- Audit dipendenze produzione: zero vulnerabilità segnalate. Audit completo: cinque avvisi high nella catena di sviluppo `netlify-cli → @netlify/dev/@netlify/images → ipx → sharp`. Il rimedio automatico proposto era un downgrade major della CLI; non è stato applicato senza una verifica di compatibilità. Questi pacchetti non sono importati nel frontend o nelle Functions dell’app. Non esporre Netlify Dev su internet e rivaluta il tooling prima di usarne le funzioni di elaborazione immagini.

Non verificati: Supabase Auth/PostgREST/Storage remoti, deploy Netlify reale, scrittura fisica NFC, scansione con fotocamera/QR stampato. I test PGlite eseguono la migrazione reale ma simulano gli schemi gestiti `auth` e `storage`; i test UI usano fixture. Nessun push, commit, migrazione remota o pubblicazione eseguiti.

## Sicurezza e limiti operativi

Leggi [la guida di configurazione](docs/SETUP.md) prima della pubblicazione: contiene procedura esatta del primo admin, variabili separate browser/server, configurazione Auth, GitHub/Netlify e verifica manuale remota.

- Le immagini, incluse quelle delle bozze, sono pubbliche. File sostituiti/abbandonati richiedono pulizia esplicita. Il limite è 5 MiB per JPEG/PNG/WebP.
- Le statistiche contano eventi, non persone uniche o recensioni completate. Il limite condiviso è 120 nuovi tentativi/minuto/attività; protegge gli inserimenti, non elimina costi di invocazione o abusi distribuiti. Un errore analytics non blocca un redirect già validato.
- Nessun fallback silenzioso ai mock e nessuna chiave privilegiata nel bundle. Tutte le variabili `VITE_*` sono pubbliche.
- Le migrazioni non sono eseguite dalla build. Il deploy richiede i passaggi manuali nella guida.

## Provenienza della base

All’avvio `develop` conteneva solo il README iniziale. I sorgenti richiesti erano nel branch locale `master`: sono stati recuperati da lì senza cambiare branch o riscrivere la cronologia. `.idea` e i file locali non versionati sono stati preservati; `dist` è stato rigenerato dalla build. Le dipendenze preesistenti React, Vite, TypeScript e OxLint non sono state aggiornate deliberatamente.
