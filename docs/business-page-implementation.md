# Business Landing Page: implementazione

## Avvio locale

Dalla radice `tapcard`:

```sh
npm run dev -- --host 127.0.0.1
```

- `http://127.0.0.1:5173/b/bar-centrale`
- `http://127.0.0.1:5173/b/studio-esempio`
- `http://127.0.0.1:5173/b/non-esiste` per lo stato non trovato.
- `/` mantiene accessibile l’attività già presente, usando la stessa pagina.

## Configurazione e integrazione

`src/data/businesses.ts` contiene due attività dichiarate dimostrative. La prima riusa i collegamenti del precedente `mockVenue`, tramite adapter; la seconda rappresenta uno studio di architettura. I mock e tipi precedenti rimangono intatti.

`src/types/business.ts` distingue azioni web, telefono e WhatsApp con una union discriminata. `actions` determina ordine, etichette, sottotitoli e abilitazione. `src/services/businesses.ts` è il punto da sostituire con una sorgente reale: attualmente la risoluzione è sincrona, senza ritardi, rete, stati di caricamento artificiali o risposte obsolete. Un futuro adapter asincrono dovrà introdurre caricamento, retry e annullamento delle richieste.

`App.tsx` gestisce `/b/:slug`, apertura diretta e navigazione indietro/avanti tramite `popstate`, senza installare un router. I link interni normali effettuano una navigazione del documento. Percorsi sconosciuti o malformati non mostrano altre attività. Il titolo del documento cambia con lo stato.

Configurare `googleReviewUrl` con l’URL effettivamente ottenuto dall’attività. Formati ammessi:

- `https://g.page/r/<identificativo>/review`
- `https://search.google.com/local/writereview?placeid=<identificativo>`

Sono accettati HTTP e HTTPS, con preferenza per HTTPS nei dati. Host, percorso e presenza dell’identificativo sono verificati; la validità reale dell’attività non è verificabile localmente. Altri formati Google richiedono un’estensione esplicita del validatore. Su richiesta, Bar Centrale usa il placeholder `https://search.google.com/local/writereview?placeid=DEMO_BAR_CENTRALE` per mostrare la CTA. La pagina dichiara che il link è dimostrativo e non è associato a una vera attività: va sostituito prima della pubblicazione. Studio Forma mantiene il fallback senza recensioni.

Telefono: numero locale o internazionale, 7–15 cifre, con separatori rimossi. WhatsApp: prefisso internazionale esplicito `+` oppure `00`, senza inferire il paese; messaggio codificato. Solo URL assoluti HTTP(S) per azioni esterne. Le immagini possono anche usare percorsi locali dalla radice, come `/business-demo-logo.svg`.

## Riferimento visivo

Il file richiesto `business-page-reference.png` non era presente. È stato aperto e usato `docs/UI_for_review`, un PNG disponibile nel repository. La UI riprende card bianca, ombra ampia, cover ondulata, logo circolare sovrapposto, gerarchia tipografica, CTA con simbolo Google, icone social, chevron, bordi arrotondati e footer con cuore.

Differenze intenzionali: testi e azioni dipendono dalla configurazione; Bar Centrale mostra la CTA con URL dimostrativo esplicitamente segnalato; Studio Forma mantiene il fallback senza recensioni. La cover usa una foto esterna differente, poiché la fotografia del riferimento non è disponibile separatamente. Il logo dimostrativo è un SVG locale; in sua assenza vengono mostrate le iniziali. Il font usa lo stack di sistema esistente, senza scaricare font o aggiungere dipendenze. I testi secondari sono più scuri per il contrasto. Il tema scuro e il wrapping sui display piccoli adattano le superfici e le dimensioni mantenendo tutti i contenuti accessibili.

## Verifiche

```sh
npm run build
npm run lint
node docs/check-business.mjs
node docs/check-business-render.mjs
```

`npm run build` esegue anche il typecheck `tsc -b`. I due controlli mirati usano Node, TypeScript, React e Vite già installati, senza framework aggiuntivi. Verificano link non sicuri, domini contraffatti, telefoni, messaggi WhatsApp, tutti i tipi di azione, duplicati, colori, immagini, risoluzione slug, dati non validi, rendering delle demo, escaping del testo, CTA e stato senza destinazioni.

Le richieste HTTP dirette e ripetute ai tre percorsi sopra restituiscono l’entry point SPA con stato 200. Questo verifica il fallback locale di Vite, non sostituisce una prova di refresh nel browser.

Non era disponibile un browser collegato all’automazione: confronto screenshot, caricamento/fallimento effettivo delle immagini, focus da tastiera, cronologia, larghezze 320/375/390/768/1440, tema chiaro/scuro e zoom 200% restano da verificare visivamente. Non sono dichiarati come test superati.

## Hosting

Non è presente una configurazione di deployment. In produzione il server deve servire `dist/index.html` per `/b/*` e altri percorsi applicativi non corrispondenti a file. Per Nginx, nella `location /`: `try_files $uri $uri/ /index.html;`. Servire gli asset esistenti normalmente. Il fallback HTTP 200 della SPA non equivale a un vero stato HTTP 404 per attività sconosciute; quest’ultimo richiede supporto server.
