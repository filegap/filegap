# test-check

## Purpose

Choose and execute the smallest meaningful validation flow for the current change.

## Use When

- `Fai i test`
- `Controlla che tutto funzioni`
- `Verifica le modifiche`

## Inputs

- changed files or requested scope
- repository validation rules

## Procedure

1. Identify the affected area.
2. Map the change to the repository validation flow.
3. Propose the relevant commands or checks.
4. If explicitly requested, run the selected validation flow.
5. Summarize failures and likely causes.

## Outputs

- validation plan
- executed checks when requested
- concise result summary

## Can Do Without Confirmation

- inspect repository scripts
- propose validation commands

## Requires Explicit Confirmation

- run heavyweight validation when the user's preference is analysis-first
- commit, push, release, deploy

## Repository Notes

- For `apps/web`, minimum validation is `npm run build` and `npm run test`.
- For `apps/desktop`, minimum validation is `npm run build` and `npm run test`.
- For `crates/cli` and `crates/core`, run relevant Rust tests.

## Stop Conditions

- validation path is unclear
- required local setup is missing
