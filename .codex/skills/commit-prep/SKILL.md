# commit-prep

## Purpose

Analyze the current diff and prepare a commit strategy that matches repository conventions.

## Use When

- `Prepara il commit`
- `Proponi il messaggio di commit`
- `Committa le modifiche`

## Inputs

- current diff
- repository commit conventions

## Procedure

1. Inspect the diff.
2. Determine whether one commit or multiple commits would improve clarity.
3. Propose Conventional Commit message(s).
4. Explain the rationale for the split when needed.

## Outputs

- proposed commit message or commit split
- short rationale

## Can Do Without Confirmation

- inspect diff
- propose commit messages
- propose commit split

## Requires Explicit Confirmation

- create commits
- amend commits
- push commits

## Repository Notes

- Prefer small, single-purpose commits.
- Keep commit scope aligned with the privacy and validation rules of the repository.

## Stop Conditions

- diff mixes unrelated concerns and needs clarification
