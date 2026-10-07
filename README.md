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
| `/admin` | Gestione: candidature e gruppi, bacheca, Open Call, portfolio, team |

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
4. **Primo accesso.** Fai login da `/login`, poi esegui `supabase/make-admin.sql`
   con la tua email per attivare la gestione.

## Come lavora il team

1. In `/admin` > **Bacheca** carichi location (con foto, città, disponibile sì/no),
   agenzie, volti, crew e backstage. Più foto insieme diventano più schede.
2. Le candidature arrivano in **Candidature e gruppi**. Per ognuna imposti lo
   stato e scrivi un messaggio: il brand li vede nel suo pannello.
3. Crei un **gruppo** (nome, concept, location, data) e ci assegni i brand.
   Da quel momento ognuno vede gli altri brand del gruppo e la location.
4. Con lo stato **Moodboard** il brand può caricare i propri riferimenti; anche
   il team può aggiungerne dal gruppo.

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
