# AGENTS.md

## Contesto Progetto
- `filegap` e una suite di tool PDF privacy-first: elaborazione locale, senza upload di file a servizi esterni.
- Per visione, obiettivi e dettagli architetturali fare sempre riferimento a [README.md](README.md).

## Regole Open Source e Sicurezza
- Il progetto e open source: nessun dato sensibile deve finire nel repository.
- Prima di proporre o preparare un commit, verificare sempre che non siano presenti:
  - segreti, token, chiavi API, credenziali
  - file `.env` o configurazioni con valori reali
  - dump, log o PDF di test con dati personali non anonimizzati
- Se c'e dubbio su un file, fermarsi e chiedere conferma prima di procedere.

## Privacy Invariants (Obbligatori)
- Durante il processamento PDF non sono consentite richieste di rete in nessun canale:
  - web
  - CLI
  - desktop app
- I file utente non devono essere caricati, persistiti o ispezionati lato server.
- Qualsiasi proposta che introduca processing server-side dei PDF e fuori scope.
- Se una modifica mette a rischio uno di questi invarianti, il lavoro va bloccato e va richiesta conferma esplicita.

## Logging Policy (Obbligatoria)
- Non loggare mai dati utente o metadati dei file PDF, ne in development ne in production.
- Sono vietati nei log: filename, path utente, dimensioni file, page count, page order, range di pagine, contenuto del file, estratti o buffer binari.
- I messaggi di errore devono restare generici e non devono includere input utente.
- Sono ammessi solo log tecnici ad alto livello, senza payload sensibile.

## Privacy & Analytics Rules (Obbligatorie)
- Questo progetto e privacy-first.
- Analytics consentita solo in forma anonima, aggregata e ad eventi ad alto livello.
- Non tracciare mai: filename, path utente, dimensioni file, page count, page order, range, contenuto file, input utente legato ai file.
- Tracking consentito:
  - page views
  - uso strumenti ad alto livello (es. apertura tool)
  - click CTA ad alto livello
- Gli eventi analytics devono contenere solo il nome evento, senza payload.
- In caso di dubbio: non tracciare.

## Logging Rules (Rinforzo)
- Non loggare dati file utente.
- Evitare log di input utente.
- Meglio nessun log che un log potenzialmente non sicuro.

## Standard Commit
- Tutti i commit devono rispettare Conventional Commits:
  - riferimento: https://www.conventionalcommits.org/en/v1.0.0/
  - esempi: `feat(core): add merge operation`, `fix(cli): validate split mode`

## Gate di Sicurezza Pre-Commit
- Prima di ogni commit deve essere eseguita una review di sicurezza.
- La review deve avere esito positivo e senza criticita aperte.
- In presenza di criticita, il commit va bloccato finche non risolte o esplicitamente approvate.
- Prima di ogni commit devono essere eseguiti i test automatici pertinenti.
- Il commit e consentito solo con test in stato verde (pass).
- Se il commit tocca `apps/web`, i gate minimi obbligatori sono:
  - `npm run build` in `apps/web`
  - `npm run test` in `apps/web`

## Checklist Pre-Commit
1. Scope chiaro: il commit include una sola modifica logica e mantiene un diff minimo.
2. Nessun dato sensibile: verificare assenza di token, chiavi, credenziali e segreti hardcoded.
3. Nessun artefatto non voluto: escludere log, file temporanei, output di build e dati personali.
4. Security review positiva: nessuna criticita aperta prima del commit.
5. Build/validazione locale: eseguire almeno i controlli tecnici del perimetro modificato.
6. Test obbligatori: eseguire sempre i test automatici pertinenti prima del commit.
7. Test in stato verde: non committare con test falliti.
8. Se ci sono modifiche frontend in `apps/web`, eseguire sempre `npm run build` e `npm run test` in `apps/web`.
9. Documentazione aggiornata: allineare `README.md` e `docs/*` quando cambia il comportamento.
10. Messaggio commit conforme: usare formato Conventional Commits.
11. Branch policy rispettata: usare branch coerenti con `dev/main` e prassi git-flow.
12. Review finale del diff staged: controllo conclusivo prima del commit.

## Strategia Branching
- Branch principali: `main` e `dev`.
- Applicare, dove possibile, pratiche git-flow:
  - feature branch da `dev`: `feature/<nome>`
  - fix branch da `dev`: `fix/<nome>`
  - hotfix branch da `main` quando necessario: `hotfix/<nome>`
  - release branch da `dev` quando si prepara il rilascio: `release/<versione>`
- Integrare verso `dev` durante lo sviluppo ordinario e promuovere in `main` solo codice stabile.
