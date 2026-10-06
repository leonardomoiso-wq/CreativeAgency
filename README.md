# Open Call — sito e gestione

Sito per le produzioni condivise (Open Call): homepage con il conteggio dei posti,
pagina Team, pagina Portfolio, login e area di gestione.

Next.js (App Router) + Supabase (database, login, immagini). Pubblicazione su Vercel.

## Pagine

| Indirizzo | Cosa fa |
|---|---|
| `/` | Open Call corrente: concept, conteggio dei posti, categorie, richiesta del posto |
| `/team` | Schede del team con bio, credits e Instagram personale |
| `/portfolio` | Progetti filtrabili per styling, fotografia, produzioni condivise |
| `/login` | Accesso via email con link, senza password |
| `/admin` | Gestione: Open Call, categorie, richieste dei brand, portfolio, team |

Finché il database è vuoto o non collegato, le pagine pubbliche mostrano contenuti
segnaposto (tra parentesi quadre).

## Messa in funzione

1. **Supabase, tabelle.** SQL Editor > New query: incolla `supabase/schema.sql` ed esegui.
   Crea tabelle, regole di accesso, lo spazio immagini `media` e i contenuti iniziali.
2. **Vercel.** Importa questo repository e aggiungi le due variabili d'ambiente di
   `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
3. **Supabase, indirizzo del sito.** Authentication > URL Configuration: metti
   l'indirizzo Vercel in *Site URL* e aggiungi `https://IL-TUO-SITO/admin` tra i
   *Redirect URLs*. Senza questo il link di login riporta all'indirizzo sbagliato.
4. **Primo accesso.** Fai login da `/login`, poi esegui `supabase/make-admin.sql`
   con la tua email per attivare la gestione.

## Dati dello studio

Nome, email e riga legale stanno in `src/lib/site.ts`.

## Sviluppo in locale

```bash
cp .env.example .env.local   # poi inserisci i due valori
npm install
npm run dev
```

## Non ancora incluso

- Pagamento dell'acconto (le richieste arrivano in `/admin` e si confermano a mano)
- Area riservata dei brand (brief e gallery privata)
