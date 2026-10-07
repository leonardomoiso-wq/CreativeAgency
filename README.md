# Open Call — sito e gestione

Sito per le giornate di shooting condivise (Open Call). È il secondo passo dopo
l'email d'ingaggio: spiega il meccanismo, mostra location e rete di contatti,
guida il brand alla candidatura e poi gli dà un pannello per seguire lo stato.

Next.js (App Router) + Supabase (database, login, immagini). Pubblicazione su Vercel.

## Pagine

| Indirizzo | Cosa fa |
|---|---|
| `/` | Apertura, meccanismo in sei passaggi, location disponibili, stato della Open Call, bacheca, criteri di selezione |
| `/bacheca` | Location, agenzie, volti, crew e backstage, filtrabili |
| `/candidatura` | Candidatura guidata in cinque passaggi (chi sei, capi, location, accesso) |
| `/brand` | Pannello brand: stato, brand abbinati, location, moodboard comune |
| `/team` | Schede del team con bio, credits e Instagram personale |
| `/portfolio` | Progetti filtrabili per styling, fotografia, produzioni condivise |
| `/login` | Accesso via email con link, senza password |
| `/admin` | Media center del team (con password): immagini per sezione, testi, candidature, Open Call, accessi |

Finché il database è vuoto o non collegato, le pagine pubbliche mostrano contenuti
segnaposto (tra parentesi quadre).

## Messa in funzione

1. **Supabase, tabelle.** SQL Editor > New query: incolla `supabase/schema.sql` ed esegui.
   Crea tabelle, regole di accesso, lo spazio immagini `media` e i contenuti iniziali.
   Se lo avevi già eseguito, eseguilo di nuovo: aggiunge le parti nuove senza toccare i dati.
2. **Vercel.** Importa questo repository e aggiungi le due variabili d'ambiente di
   `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
3. **Supabase, indirizzo del sito.** Authentication > URL Configuration: metti
   l'indirizzo Vercel in *Site URL* e aggiungi `https://IL-TUO-SITO/**` tra i
   *Redirect URLs*. Senza questo il link di login riporta all'indirizzo sbagliato.
4. **Primo accesso al media center.** In Supabase > Authentication > Users >
   *Add user* crea il tuo utente con email e password (spunta *Auto Confirm User*).
   Poi esegui `supabase/make-admin.sql` con la tua email. Da quel momento entri da
   `/admin` e puoi dare accesso al resto del team dalla scheda **Accessi**.

## Come lavora il team

1. In `/admin` > **Immagini** scegli la sezione (location, agenzie, volti, crew,
   backstage, portfolio per sezione, team) e trascini le foto nel riquadro. Ogni
   foto diventa una scheda: l'etichetta si scrive direttamente sotto l'immagine,
   gli altri dati in *Dettagli*. Si riordina trascinando le schede e si cambia una
   foto trascinandone un'altra sopra. Le foto grandi vengono ridotte da sole.
   In **Logo** carichi il logo (SVG o PNG trasparente) e, se serve, una
   versione chiara per i fondi scuri. Senza logo il sito mostra il nome in lettere.
   In **Testi** si cambiano i testi del sito su tre livelli: occhiello, titolo, testo.
2. Le candidature arrivano in **Candidature e gruppi**. Per ognuna imposti lo
   stato e scrivi un messaggio: il brand li vede nel suo pannello.
3. Crei un **gruppo** (nome, concept, location, data) e ci assegni i brand.
   Da quel momento ognuno vede gli altri brand del gruppo e la location.
4. Con lo stato **Moodboard** il brand può caricare i propri riferimenti; anche
   il team può aggiungerne dal gruppo.

## Immagini d'esempio

Finché il portfolio è vuoto, il sito usa le foto in `public/esempi/`. Appena
carichi i tuoi lavori dal media center spariscono da sole.

## Copy

Le scelte di parole e il tono sono spiegati in `docs/lessico.md`.

## Dati dello studio

Nome, email e riga legale stanno in `src/lib/site.ts`.

## Sviluppo in locale

```bash
cp .env.example .env.local   # poi inserisci i due valori
npm install
npm run dev
```

## Non ancora incluso

- Pagamento dell'acconto (si conferma a mano, cambiando lo stato in `/admin`)
- Gallery privata per la consegna delle immagini
