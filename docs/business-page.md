# Tapcard — Business Landing Page

## Mandato di implementazione

Implementa direttamente nel repository la Business Landing Page descritta in questa specifica, per l'applicazione Tapcard basata su React 19, TypeScript e Vite. Non limitarti a proporre un piano o a creare un mockup.

Prima di modificare il codice, leggi le istruzioni del repository e analizza struttura, routing, componenti, stili, dati, dipendenze e script disponibili. Riusa l'esistente quando sensato e adatta i nomi proposti alle convenzioni del progetto. Preserva le funzionalità già presenti. Se esiste già una pagina pubblica dell'attività, evolvila senza creare un percorso parallelo inutilizzato.

Al termine esegui typecheck e build con gli strumenti del repository, correggi gli errori introdotti e riepiloga modifiche, verifiche eseguite ed eventuali limiti reali. Non dichiarare verifiche non eseguite.

## 1. Obiettivo e prodotto

La pagina pubblica viene raggiunta aprendo un link tramite QR code o tag NFC. Deve presentare un'attività e facilitare come azione principale l'apertura del suo link per lasciare una recensione Google.

Il prodotto deve essere generico: bar, ristoranti, negozi, parrucchieri, officine e studi professionali devono poter usare la stessa UI cambiando solo i dati. Menu e catalogo sono collegamenti opzionali, non sezioni obbligatorie.

Obiettivo secondario: consentire l'accesso rapido ai contatti e ai canali dell'attività. La scansione del QR/NFC avviene esternamente: non implementare un lettore QR, accesso all'hardware NFC o un generatore di codici.

## 2. Principi UX mobile-first

- Progetta prima per smartphone: lettura immediata, azioni raggiungibili con il pollice e pochi elementi concorrenti.
- Adotta uno stile moderno, pulito e curato, con spazio bianco, gerarchie tipografiche chiare e bordi arrotondati.
- Rendi la recensione l'azione dominante, riconoscibile prima dei collegamenti secondari.
- Mostra solo i dati e le azioni configurati; evita spazi vuoti riservati a contenuti assenti.
- Usa testi neutrali rispetto al settore e una descrizione breve fornita dall'attività.
- Non chiedere login, valutazioni preliminari o compilazione di moduli prima della recensione.
- Non promettere che la recensione sia stata pubblicata: la pagina può soltanto aprire la destinazione Google.

## 3. Layout e gerarchia

Ordine dei contenuti:

1. Sfondo pagina neutro, con eventuale accento leggero derivato dal colore primario.
2. Card principale centrata, larga quanto lo spazio disponibile su mobile con margini laterali; su desktop usa una larghezza massima indicativa di 480–560 px.
3. Cover opzionale nella parte superiore, con rapporto indicativo 16:9 e ritaglio `object-fit: cover`.
4. Logo dell'attività, opzionalmente sovrapposto tra cover e contenuto, con fondo neutro e bordo che lo separi dall'immagine.
5. Nome attività come unico `h1` e breve descrizione opzionale.
6. CTA primaria «Lascia una recensione», con riferimento visibile a Google e testo di supporto facoltativo, ad esempio «Condividi la tua esperienza su Google».
7. Elenco verticale dei collegamenti secondari abilitati, nell'ordine configurato.
8. Footer discreto: «Grazie per il tuo supporto».

Ogni azione secondaria contiene icona coerente, titolo, sottotitolo opzionale e freccia a destra. L'intera superficie è cliccabile. Usa bordi, superfici e spaziature più discreti rispetto alla CTA primaria. La freccia non deve essere l'unico elemento interattivo.

Evita altezze fisse per la card e per i contenuti testuali. Cover e descrizione non devono spingere inutilmente la CTA principale molto in basso: verifica la gerarchia anche su telefoni di piccole dimensioni.

## 4. CTA recensione

- Etichetta principale: «Lascia una recensione».
- Usa il colore primario configurato, con testo e focus accessibili. Se il colore non permette un risultato leggibile, correggi la resa secondo le regole di accessibilità sotto indicate.
- Apri direttamente l'URL di recensione Google configurato per quella specifica attività; non generare URL da nomi o indirizzi presunti.
- Non inserire passaggi intermedi, incentivi, selezioni delle stelle o filtri che indirizzino a Google soltanto gli utenti soddisfatti.
- Se l'URL manca o non è valido, non mostrare un pulsante rotto o disabilitato: ometti la CTA e mostra un messaggio discreto «Le recensioni non sono al momento disponibili». Mantieni utilizzabili gli altri link.
- Non inventare punteggi, numero di recensioni, badge, testimonianze o risultati.

## 5. Modello dati TypeScript

Integra questo modello con i tipi esistenti, evitando duplicazioni. I contenuti non devono essere codificati nei componenti. Usa una configurazione per attività; se manca una sorgente dati, crea mock locali separati dalla UI.

```ts
export type WebUrl = string; // Da validare a runtime: il tipo non garantisce la sicurezza.
export type HexColor = string; // Formato supportato: #RRGGBB, validato a runtime.

export type BusinessActionType =
  | 'website'
  | 'menu'
  | 'catalog'
  | 'instagram'
  | 'facebook'
  | 'whatsapp'
  | 'phone'
  | 'directions';

export interface BusinessActionBase {
  id: string;
  title?: string; // Se assente, usa l'etichetta predefinita del tipo.
  subtitle?: string;
  enabled?: boolean; // Default: true.
}

export type BusinessAction = BusinessActionBase & (
  | {
      type: Exclude<BusinessActionType, 'phone' | 'whatsapp'>;
      url: WebUrl;
    }
  | {
      type: 'phone';
      phoneNumber: string;
    }
  | {
      type: 'whatsapp';
      phoneNumber: string; // Numero internazionale con prefisso paese.
      message?: string;
    }
);

export interface Business {
  id: string;
  slug: string;
  name: string;
  description?: string;
  coverUrl?: WebUrl;
  logoUrl?: WebUrl;
  primaryColor?: HexColor;
  googleReviewUrl?: WebUrl;
  actions: BusinessAction[]; // L'ordine dell'array è l'ordine di visualizzazione.
}
```

Etichette predefinite: `website` → «Sito web», `menu` → «Menu», `catalog` → «Catalogo», `instagram` → «Instagram», `facebook` → «Facebook», `whatsapp` → «WhatsApp», `phone` → «Telefono», `directions` → «Indicazioni stradali».

Gli ID delle azioni devono essere stabili e univoci nell'attività. Mappa tipi e icone nel codice: non salvare JSX, HTML o nomi arbitrari di componenti nei dati. L'assenza di azioni secondarie è uno stato valido.

Prepara dati dimostrativi per almeno due attività di settori differenti, con combinazioni diverse di azioni e immagini, per verificare che la UI sia realmente generica. Segnala chiaramente i dati dimostrativi; non presentarli come attività reali e non usare destinazioni Google inventate come se fossero funzionanti.

## 6. Componentizzazione proposta

Adatta questa struttura al repository senza imporre una riorganizzazione generale:

```text
src/
  types/business.ts
  components/
    BusinessHeader.tsx
    ReviewCTA.tsx
    ActionCard.tsx
    BusinessLandingPage.tsx
  pages/BusinessPage.tsx
  data/businesses.ts             # Solo se servono mock locali
  services/businesses.ts         # Risoluzione attività, se non esiste già
  utils/businessLinks.ts         # Validazione e costruzione link
```

- `BusinessPage`: legge lo slug e gestisce risoluzione dati e stati della pagina.
- `BusinessLandingPage`: compone la UI a partire da un oggetto `Business`, senza dipendere direttamente dal router o dai mock.
- `BusinessHeader`: gestisce cover, logo, nome e descrizione.
- `ReviewCTA`: rappresenta l'azione primaria quando disponibile.
- `ActionCard`: rende il collegamento secondario già validato, con un aspetto uniforme.
- Utility o servizi: centralizzano validazione, normalizzazione dei numeri e costruzione degli URL, senza duplicare logica nei componenti.

Non concentrare l'implementazione in `App.tsx`. Mantieni una complessità proporzionata: non creare un design system o un framework di configurazione per questa singola funzionalità.

## 7. Routing e caricamento

- Percorso pubblico: `/b/:slug`, ad esempio `/b/studio-esempio`.
- Lo slug risolve una singola attività tramite il sistema dati esistente o un adapter locale sostituibile. Non inserire nomi di attività nel markup.
- Riusa il router già installato. Se manca, scegli la soluzione minima coerente con il progetto; aggiungi una dipendenza solo se necessaria e motivane l'uso nel riepilogo.
- Lo slug sconosciuto deve mostrare una pagina «Attività non trovata», mai i dati di un'altra attività come fallback.
- Se il caricamento è asincrono, prevedi stati di caricamento, errore e tentativo di ricaricamento. Non introdurre ritardi artificiali per mostrare uno skeleton.
- Gestisci cambi di slug senza lasciare visibili dati precedenti o risposte asincrone obsolete.
- Imposta il titolo del documento in modo significativo, ad esempio «Nome attività | Tapcard», e aggiornalo anche negli stati di errore.
- Verifica apertura diretta e refresh del percorso. Se il deployment richiede fallback SPA verso `index.html`, aggiorna la configurazione esistente quando disponibile oppure documenta esattamente il requisito ancora da applicare.

## 8. Cover, logo e colore primario

- Cover assente o non caricabile: usa una fascia neutra o un gradiente discreto, senza icona di immagine rotta.
- Logo assente o non caricabile: usa le iniziali del nome su una superficie neutra. Non richiedere un servizio esterno per generare avatar.
- Logo presente: usa `object-fit: contain` per evitare di tagliare il marchio; cover presente: `object-fit: cover`.
- Riserva spazio alle immagini per ridurre gli spostamenti del layout. Evita download di immagini enormi quando sono già disponibili varianti ottimizzate.
- `primaryColor` deve essere una variabile CSS circoscritta alla pagina, ad esempio `--business-primary`, con un default centralizzato coerente con il tema del progetto. Non hardcodare il blu nei singoli componenti.
- Accetta soltanto il formato colore previsto, normalizzalo e applica il default quando manca o è invalido.
- Scegli testo chiaro o scuro in base al contrasto effettivo; se necessario adatta il colore visualizzato per focus, bordi e testo. Non presumere che il bianco sia leggibile su ogni colore di brand.

## 9. Comportamento dei collegamenti

- Usa elementi `<a>` con `href` reale per la navigazione; non simulare link con `<div>` o soli gestori `onClick`.
- Website, menu, catalogo, social, indicazioni e recensione aprono una nuova scheda tramite `target="_blank"` e `rel="noopener noreferrer"`. Indica in modo accessibile l'apertura in una nuova scheda.
- Menu e catalogo aprono il documento o la pagina configurata; non aggiungere visualizzatori PDF incorporati.
- Le indicazioni aprono l'URL del servizio mappe configurato. Non costruire coordinate o indirizzi inesistenti.
- Telefono: genera `tel:` da un numero normalizzato e validato; lascia gestire al dispositivo l'apertura dell'app telefonica.
- WhatsApp: costruisci `https://wa.me/<numero>` con numero internazionale composto da sole cifre; codifica il messaggio opzionale con `encodeURIComponent`. Non indovinare il prefisso nazionale. Il link può aprire una nuova scheda e il dispositivo può passare all'app.
- Accetta solo URL web assoluti `https:` o `http:` per le destinazioni web, preferendo HTTPS nei dati. Rifiuta protocolli quali `javascript:`, `data:` e `file:`. Non promuovere automaticamente URL malformati a destinazioni valide.
- Per `googleReviewUrl`, oltre al protocollo, verifica che l'host appartenga a un dominio Google previsto per i link recensione. Usa un elenco esplicito dei formati supportati e confronti esatti o confini di dominio; una stringa che contiene «google» non è una validazione. Riusa un validatore affidabile già presente, se disponibile.
- Ometti azioni disabilitate, con destinazione mancante o invalida. Un'azione errata non deve bloccare le altre.
- Non renderizzare HTML proveniente dalla configurazione e non usare `dangerouslySetInnerHTML` per titoli o descrizioni.

## 10. Fallback e stati limite

Gestisci esplicitamente:

- nome obbligatorio assente o vuoto: dati non validi, con stato di errore comprensibile;
- descrizione o sottotitolo assenti: nessuno spazio vuoto artificiale;
- nome, descrizioni e titoli lunghi: wrapping corretto e nessuna sovrapposizione;
- URL immagine non validi o caricamento fallito: fallback visivo;
- colore assente, invalido, molto chiaro o molto scuro: resa leggibile;
- recensione assente: messaggio discreto e altri collegamenti utilizzabili;
- nessuna azione secondaria: niente contenitore o intestazione vuota;
- nessuna destinazione disponibile: messaggio «I collegamenti di questa attività non sono al momento disponibili» senza controlli fittizi;
- attività inesistente o errore di rete: stato distinto dalla normale pagina vuota.

I fallback non devono inventare dati di contatto o collegamenti. Evita messaggi duplicati quando mancano sia recensione sia azioni secondarie.

## 11. Accessibilità e responsive

- Usa landmark semantici, un unico `h1`, ordine di lettura naturale e nomi accessibili comprensibili per ogni link.
- Tutte le azioni devono essere raggiungibili e attivabili da tastiera, con focus chiaramente visibile e non tagliato dai contenitori.
- Assicura contrasto WCAG AA: almeno 4.5:1 per testo normale, 3:1 per testo grande e indicatori/interfacce ove applicabile.
- Prevedi superfici cliccabili di almeno 44 × 44 CSS px e spazi sufficienti fra azioni.
- Le icone decorative e le frecce devono essere escluse dall'albero accessibile. Non usare soltanto un'icona o il colore per spiegare un'azione.
- La cover è decorativa se non aggiunge informazioni: usa `alt=""`. Per il logo evita annunci duplicati se il nome è già adiacente; usa un testo alternativo significativo solo quando necessario.
- Annuncia gli stati asincroni con strumenti appropriati, senza rendere tutta la pagina una live region.
- Rispetta `prefers-reduced-motion`. Evita animazioni necessarie alla comprensione.
- Verifica larghezze indicative di 320, 375, 390, 768 e 1440 px: niente scroll orizzontale e margini coerenti.
- Verifica zoom e ingrandimento del testo, inclusa una prova al 200%, senza perdita di contenuti o controlli.
- Mantieni la card centrata su desktop e uno scroll verticale naturale su mobile; considera le safe area dove rilevanti.

## 12. Requisiti tecnici

- React 19, TypeScript e Vite, mantenendo le versioni e il package manager del progetto.
- Componenti funzionali con tipi espliciti e senza `any` non motivati.
- Riusa stile, token, icone e primitive già disponibili. Se mancano icone, SVG locali semplici sono sufficienti: non aggiungere un'intera libreria per poche icone.
- Nessuna dipendenza nuova per routing, colori o utility senza verificarne prima la necessità.
- Se esiste già un backend, collega il livello dati usando i contratti disponibili. Se manca, usa mock isolati e documenta il punto di sostituzione; non inventare API funzionanti.
- Non aggiungere autenticazione, pannello amministrativo, upload di immagini, analytics o persistenza remota fuori ambito.
- Non cambiare configurazioni globali, versioni delle dipendenze o struttura del repository se non serve alla funzionalità.
- Evita errori in console, chiavi instabili negli elenchi, link annidati e richieste inutili.
- Aggiungi test mirati se esiste già l'infrastruttura: privilegia risoluzione dello slug, validazione link e fallback. Non introdurre un framework di test solo per questa pagina.

## 13. Cosa non fare

- Non rendere la UI specifica per ristorazione o un singolo settore.
- Non dare alle azioni secondarie lo stesso peso della recensione.
- Non introdurre caroselli, popup, animazioni invasive o CTA sticky che coprono i contenuti.
- Non aggiungere flussi di review gating, valutazioni finte, incentivi o richieste di recensioni esclusivamente positive.
- Non hardcodare dati dell'attività nei componenti o il colore del brand in più punti.
- Non mostrare link finti, `href="#"`, pulsanti senza azione o immagini rotte.
- Non sostituire altre pagine o funzionalità dell'applicazione senza necessità.
- Non fermarti a un documento di proposta: questa specifica richiede implementazione nel repository e verifica del risultato.

## 14. Acceptance criteria

- [ ] `/b/:slug` mostra l'attività corretta e lo slug sconosciuto mostra «Attività non trovata».
- [ ] L'apertura diretta e il refresh del percorso sono verificati; eventuali requisiti di hosting non applicabili localmente sono documentati.
- [ ] Nome, descrizione, immagini, colore, URL recensione e azioni provengono dal modello dati.
- [ ] La stessa UI supporta almeno due attività dimostrative di settori differenti senza modifiche ai componenti.
- [ ] La CTA «Lascia una recensione» è visivamente dominante e apre la destinazione Google configurata senza passaggi intermedi.
- [ ] L'assenza o invalidità del link recensione produce il fallback previsto, senza un controllo non funzionante.
- [ ] Tutti gli otto tipi di azione sono supportati; vengono mostrati soltanto quelli abilitati e validi, nell'ordine configurato.
- [ ] Telefono e WhatsApp producono collegamenti corretti, incluso un messaggio con spazi e caratteri speciali.
- [ ] URL con protocolli non consentiti e domini Google contraffatti sono rifiutati.
- [ ] Cover e logo mancanti o non caricabili mostrano fallback curati; non compaiono immagini rotte.
- [ ] Colori chiari e scuri mantengono testi, controlli e focus leggibili.
- [ ] Nomi e testi lunghi, nessuna azione e dati non validi non rompono il layout.
- [ ] Le larghezze previste, l'uso da tastiera e l'ingrandimento del testo non producono perdita di contenuti o scroll orizzontale.
- [ ] I link hanno semantica corretta, icone decorative nascoste e indicazione accessibile quando aprono una nuova scheda.
- [ ] Gli eventuali stati asincroni di caricamento, errore e cambio slug funzionano correttamente.
- [ ] Le funzionalità preesistenti restano utilizzabili e non sono state aggiunte dipendenze superflue.
- [ ] Typecheck e build completati usando gli script esistenti. Se manca uno script di typecheck, usa il comando TypeScript coerente con i `tsconfig` del progetto, senza inventare script già esistenti.
- [ ] Eseguiti i controlli pertinenti già disponibili e una verifica visiva, quando l'ambiente la consente. Eventuali verifiche impossibili sono dichiarate esplicitamente.
- [ ] Il riepilogo finale indica file principali modificati, integrazione dati, verifiche e limiti residui, senza dichiarare completate attività non eseguite.
