# AGENTS.md

## Contesto Progetto
- `pdflo` e una suite di tool PDF privacy-first: elaborazione locale, senza upload di file a servizi esterni.
- Per visione, obiettivi e dettagli architetturali fare sempre riferimento a [README.md](README.md).

## Regole Open Source e Sicurezza
- Il progetto e open source: nessun dato sensibile deve finire nel repository.
- Prima di proporre o preparare un commit, verificare sempre che non siano presenti:
  - segreti, token, chiavi API, credenziali
  - file `.env` o configurazioni con valori reali
  - dump, log o PDF di test con dati personali non anonimizzati
- Se c'e dubbio su un file, fermarsi e chiedere conferma prima di procedere.

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

## Checklist Pre-Commit
1. Scope chiaro: il commit include una sola modifica logica e mantiene un diff minimo.
2. Nessun dato sensibile: verificare assenza di token, chiavi, credenziali e segreti hardcoded.
3. Nessun artefatto non voluto: escludere log, file temporanei, output di build e dati personali.
4. Security review positiva: nessuna criticita aperta prima del commit.
5. Build/validazione locale: eseguire almeno i controlli tecnici del perimetro modificato.
6. Test obbligatori: eseguire sempre i test automatici pertinenti prima del commit.
7. Test in stato verde: non committare con test falliti.
8. Documentazione aggiornata: allineare `README.md` e `docs/*` quando cambia il comportamento.
9. Messaggio commit conforme: usare formato Conventional Commits.
10. Branch policy rispettata: usare branch coerenti con `dev/main` e prassi git-flow.
11. Review finale del diff staged: controllo conclusivo prima del commit.

## Strategia Branching
- Branch principali: `main` e `dev`.
- Applicare, dove possibile, pratiche git-flow:
  - feature branch da `dev`: `feature/<nome>`
  - fix branch da `dev`: `fix/<nome>`
  - hotfix branch da `main` quando necessario: `hotfix/<nome>`
  - release branch da `dev` quando si prepara il rilascio: `release/<versione>`
- Integrare verso `dev` durante lo sviluppo ordinario e promuovere in `main` solo codice stabile.
