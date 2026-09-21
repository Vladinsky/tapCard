# Configurazione Supabase e Netlify

Questi passaggi modificano servizi remoti: devono essere eseguiti dal proprietario. Non sono stati eseguiti dall’agente. Non inviare password, service role o secret key in chat.

## 1. Supabase

1. Crea un progetto Supabase, scegli una regione adatta e conserva la password database in un password manager. Il codice non richiede piani a pagamento; restano applicabili le quote del servizio.
2. Nel SQL Editor esegui **una sola volta, su progetto nuovo**, il contenuto di `supabase/migrations/202609210001_core.sql`. La migrazione è transazionale; se fallisce, correggi la causa prima di ripeterla. Non rilanciarla su uno schema già creato. Per futuri cambiamenti aggiungi nuove migrazioni versionate, senza modificare quelle già applicate. Non applicare a uno schema preesistente senza revisione.
3. In Authentication → configurazione accessi / Sign In / Providers disattiva **Allow new users to sign up** e gli accessi anonimi. Lascia abilitato Email/password. Disabilita provider OAuth non utilizzati. Il fatto che non esista un form di registrazione non basta a disabilitare l’API signup.
4. In Authentication → Users → Add user / Create new user crea il tuo utente email/password. Conferma l’email con la procedura amministrativa del pannello (Auto Confirm User). Usa una password robusta e unica; non inserirla nei file del progetto. Copia l’UUID dell’utente.
5. Nel SQL Editor, con il ruolo amministrativo del progetto, sostituisci il segnaposto ed esegui:

   ```sql
   insert into public.administrators(user_id)
   values ('UUID_DEL_TUO_UTENTE'::uuid);
   ```

   Questa è la sola procedura per autorizzare l’admin. Il browser non può modificare la tabella, neppure come admin. Email e user_metadata non assegnano privilegi. Per revocare l’accesso:

   ```sql
   delete from public.administrators
   where user_id = 'UUID_DEL_TUO_UTENTE'::uuid;
   ```

6. In Authentication → URL Configuration imposta Site URL al dominio HTTPS canonico finale. Aggiungi alle Redirect URLs il solo URL finale `/admin/login` e `http://localhost:8888/admin/login` per sviluppo. Il login password attuale non usa redirect OAuth; evita wildcard sulle deploy preview. Il recupero password non è implementato nell’app: gestiscilo dal pannello Supabase con la procedura amministrativa.
7. In Project Settings → API / API Keys recupera Project URL e chiave **publishable** (oppure legacy anon) per il browser. Recupera la **service_role** legacy solo per le Functions; il client server accetta anche una secret key server Supabase nel medesimo campo, se disponibile. Mai usare una chiave privilegiata in una variabile `VITE_*`.
8. Controlla che RLS sia attiva su `businesses`, `business_actions`, `administrators`, `interaction_events`. Non aggiungere policy permissive manualmente. `is_admin` non accetta UUID arbitrari; `record_event` è eseguibile solo da `service_role`. Non esistono viste che bypassano RLS.
9. In Storage controlla il bucket `business-images`: pubblico, limite 5 MiB, MIME `image/jpeg`, `image/png`, `image/webp`. Le policy permettono scrittura/cancellazione solo all’admin. Anche le immagini di bozze e i file non ancora associati a una card sono pubblicamente leggibili tramite URL.

Riferimenti ufficiali: [configurazione Auth](https://supabase.com/docs/guides/auth/general-configuration), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [controllo accessi Storage](https://supabase.com/docs/guides/storage/security/access-control).

## 2. Sviluppo locale

Usa Node **24 LTS** (`.nvmrc`; verifica effettuata con 24.20.0) e npm. Il Vite esistente richiede almeno Node 20.19/22.12; il progetto adotta un solo runtime Node 24 per frontend e Functions.

```powershell
npm ci
Copy-Item .env.example .env
# Compila .env localmente: nessun segreto va committato.
npm run dev -- --offline
```

Apri **http://localhost:8888**. Il comando avvia Vite e Netlify Functions insieme e applica `netlify.toml`. `--offline` impedisce alla CLI di cercare un sito Netlify collegato; non blocca le chiamate dell’app al progetto Supabase configurato. Non usare la porta Vite 5173 per la verifica completa del tracking. `npm run dev:vite` è un comando interno di Netlify Dev. `npm run preview` serve solo gli asset compilati, senza Functions.

La CLI può inizializzare/scaricare il proprio runtime Edge anche senza Edge Functions nell’app. Se in una rete con certificati aziendali compare `unable to verify the first certificate` o un errore `fetch failed`, su Node 24 in PowerShell usa `$env:NODE_OPTIONS='--use-system-ca'` prima del comando. È la configurazione necessaria sulla macchina verificata; non disabilitare la validazione TLS. Le porte 5173 e 8888 devono essere libere: chiudi eventuali precedenti istanze prima di riavviare.

Compila `.env` con:

| Variabile | Dove serve | Valore |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Browser / build | Project URL Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser / build | Publishable o anon, mai service_role |
| `VITE_PUBLIC_BASE_URL` | Browser / build | Origine HTTPS canonica finale, senza percorsi |
| `VITE_DEMO_MODE` | Browser / build | `false` in produzione |
| `SUPABASE_URL` | Functions | Lo stesso Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Functions | Chiave privilegiata, solo server |

Per vedere solo i mock imposta esplicitamente `VITE_DEMO_MODE=true` e visita `/b/bar-centrale` o `/b/studio-esempio`. Non ci sono fallback demo impliciti, né login demo. Con demo disattivata e configurazione assente, la pagina mostra un errore. Riavvia il server dopo modifiche a `.env`.

## 3. GitHub → Netlify

1. Rivedi le modifiche locali. Il branch inizialmente aperto `develop` conteneva solo README: i sorgenti sono stati recuperati dal branch locale `master`, senza cambiare branch. Prima del push scegli consapevolmente il branch che conterrà questa implementazione. Nessun commit/push è stato eseguito dall’agente.
2. Esegui lint, test e build, poi committa sorgenti, configurazione e lockfile. Non aggiungere `.env`, `node_modules`, `dist`, `.netlify` o `artifacts`.
3. Quando vuoi pubblicare, esegui tu il push su GitHub. In Netlify scegli Add new project → Import an existing project → GitHub, autorizza l’accesso al solo repository TapCard e seleziona il branch appena preparato.
4. Base directory: radice repository. Build: `npm run build`. Publish: `dist`. Functions: `netlify/functions`. Node: 24. I valori sono già in `netlify.toml`.
5. Configura le variabili sopra nel pannello Netlify, prima della build definitiva. Le `VITE_*` devono essere disponibili al build. `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` devono essere disponibili alle **Functions**, nel contesto production; limita lo scope alle Functions se il pannello/piano lo permette. Non mettere segreti in `netlify.toml`.
6. Non assegnare la service role di produzione a deploy preview o branch non fidati. Per preview interattive usa un progetto Supabase separato; altrimenti lascia non configurate le funzioni. La base canonica non deve derivare da `DEPLOY_PRIME_URL`, dall’indirizzo corrente o dalle preview.
7. Scegli dominio personalizzato o nome Netlify permanente, abilita HTTPS e imposta `VITE_PUBLIC_BASE_URL=https://IL-DOMINIO-FINALE`. Aggiorna Site URL Auth. Ricompila dopo ogni modifica `VITE_*`: sono incorporate nel bundle. Per stampare QR serve l’origine definitiva, anche quando li generi in locale.
8. Avvia il deploy dal pannello solo quando configurazione e branch sono pronti. Controlla i log build e Functions.
9. Verifica da finestra anonima: `/`, `/b/SLUG`, refresh diretto `/admin`, login, accesso negato a un secondo utente non autorizzato, bozza invisibile, upload/sostituzione/rimozione, QR letto da telefono, URL NFC, click telefono/WhatsApp e incremento statistiche. Prova API non esistenti: devono restituire 404, non HTML SPA.

Le regole `/api/*` precedono il fallback SPA. Le rotte sconosciute del frontend mostrano una pagina “non trovata”, servita dal fallback HTTP 200 (non è una pagina SSR con status 404).

Riferimenti ufficiali: [Vite su Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/), [Netlify Dev](https://docs.netlify.com/api-and-cli-guides/cli-guides/local-development/), [variabili delle Functions](https://docs.netlify.com/build/functions/environment-variables/), [contesti e variabili](https://docs.netlify.com/build/environment-variables/overview/).

## 4. Uso e manutenzione

- Crea una bozza, aggiungi contenuti e azioni, controlla l’anteprima e pubblica. Dopo la prima pubblicazione lo slug rimane immutabile, anche se disattivi o rimetti in bozza. Disattivazione e cancellazione rendono inutilizzabili le card stampate; la cancellazione richiede conferma ed elimina anche le statistiche.
- Il salvataggio SQL di attività e azioni è atomico. I file Storage hanno un ciclo separato: upload con UUID, nessuna sovrascrittura, immagine precedente conservata su errore. Salva per applicare una sostituzione. I file abbandonati restano nel bucket e si eliminano esplicitamente dalla libreria admin, che blocca i file ancora referenziati. Chiudi gli altri editor prima della pulizia; Storage e database non condividono una transazione. La libreria mostra gli ultimi 100 file: per archivi più grandi usa il pannello Storage.
- MIME e dimensione sono limitati anche dal bucket. Il browser verifica che il file sia decodificabile; Storage applica i metadati MIME, non una scansione antivirus né una ricodifica server del contenuto. Solo l’unico admin fidato può effettuare upload.
- QR nero/bianco, margine quattro moduli, PNG 2048 px e SVG. Esportazione/link bloccati per attività non pubblicate e origine canonica assente/non valida. La copia NFC non programma fisicamente il tag.
- Eventi: un UUID per apertura/attivazione del link, unicità nel database. I retry con lo stesso UUID non incrementano. Una nuova visita o un nuovo click sono un nuovo evento; non si deduplicano persone. Prefetch, bot e riaperture possono incidere sui numeri. `source` sconosciuti diventano `direct`.
- Limite condiviso nel database: 120 tentativi nuovi/minuto per attività, aperture e click insieme; oltre soglia non vengono aggiunti eventi. Il tracking POST restituisce 429, i redirect validi continuano e scrivono un avviso. Payload POST 1 KiB e URL redirect 1 KiB. Il contatore non dipende dalla memoria delle Functions. Non è una protezione DDoS: le richieste consumano comunque invocazioni e letture, e un aggressore può saturare la quota globale di un locale. Non ci sono identificatori di visitatore, fingerprint o IP salvati dall’app.
- Il tentativo analytics ha timeout di 1,5 secondi: se fallisce, il redirect validato prosegue. Errori e limitazioni sono visibili nei log Functions. La destinazione deve prima essere letta dal database: se quella lettura fallisce, il server risponde 503 senza inventare URL di ripiego.
- Le statistiche aggregano in PostgreSQL per Europe/Rome, fino a 366 giorni per richiesta; le date finali sono inclusive. “Aperture” è il totale nell’intervallo selezionato, “Click su recensione” non è “recensione pubblicata”. Nessun rapporto viene presentato come conversione di utenti unici. I giorni senza eventi non hanno righe. I click sulle azioni rimosse conservano l’UUID storico.
- Nessuna conservazione automatica degli eventi è configurata. Scegli una retention: ad esempio, esegui periodicamente dal SQL Editor fidato `delete from public.interaction_events where occurred_at < now() - interval '180 days';`. Questa operazione riduce i totali storici. Le finestre del rate limiter vengono ripulite al successivo evento della stessa attività. Eventuali log infrastrutturali Supabase/Netlify seguono le impostazioni dei fornitori.
- Nessun backup, dominio, servizio remoto, migrazione remota, tag NFC o deploy è stato creato automaticamente. Configura e verifica backup/retention secondo le esigenze reali.
