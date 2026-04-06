# parallel-scope-check

## Purpose

Clarify the allowed scope, excluded scope, and conflict risk for parallel work in the repository.

## Use When

- `Definisci lo scope per questo task`
- `Controlla se questo lavoro tocca aree condivise`
- `Verifica il rischio di conflitti`

## Inputs

- task description
- target files or affected area
- repository parallel work protocol

## Procedure

1. Identify the likely touched area.
2. Map it to repository ownership zones.
3. Flag any shared hotspots such as `crates/core/**`.
4. Propose allowed scope, excluded scope, and expected output.
5. Highlight likely integration or coordination risks.

## Outputs

- scope touched
- scope excluded
- hotspot warnings
- expected checks
- handoff notes

## Can Do Without Confirmation

- inspect repository structure
- propose scope boundaries
- flag risks

## Requires Explicit Confirmation

- changing scope beyond the original task
- editing shared hotspots if broader coordination is needed

## Repository Notes

- Shared files such as `README.md`, `docs/**`, `Cargo.toml`, and `Cargo.lock` should ideally be updated in a dedicated final pass.

## Stop Conditions

- task is too vague to map safely
- ownership or hotspot impact is unclear
