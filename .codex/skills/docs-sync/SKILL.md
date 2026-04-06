# docs-sync

## Purpose

Keep repository documentation aligned with code and workflow changes.

## Use When

- `Aggiorna la documentazione`
- `Controlla se il README va aggiornato`
- `Sincronizza le docs`

## Inputs

- current diff or requested change
- repository documentation layout

## Procedure

1. Identify whether the change affects setup, commands, privacy guarantees, release flow, architecture, or user-facing behavior.
2. Check `README.md` and `docs/*` for outdated or missing content.
3. Propose or apply minimal documentation updates consistent with repository rules.
4. Highlight any remaining documentation gaps.

## Outputs

- proposed documentation changes
- updated documentation when requested
- remaining doc gaps if relevant

## Can Do Without Confirmation

- inspect docs
- propose updates
- draft documentation text

## Requires Explicit Confirmation

- if local preferences require confirmation before editing docs
- commit, push, release, deploy

## Repository Notes

- Prioritize privacy, local-only processing, and user-facing command accuracy.

## Stop Conditions

- documentation ownership or destination is unclear
- requested update scope is too broad
