# pre-commit-gate

## Purpose

Run the repository's pre-commit decision checklist before preparing a commit.

## Use When

- `Fai il pre-commit check`
- `Verifica se siamo pronti per il commit`
- `Controlla i gate prima del commit`

## Inputs

- current diff
- repository validation rules

## Procedure

1. Review scope and confirm the change is logically focused.
2. Check for secrets, sensitive files, logs, build artifacts, or unintended files.
3. Require a positive security review.
4. Determine the relevant build and test gates from the affected area.
5. Check whether `README.md` or `docs/*` need updates.
6. Prepare a short pass/fail report before commit.

## Outputs

- pass/fail checklist
- required validations
- open blockers

## Can Do Without Confirmation

- inspect diff
- inspect staged files
- propose the gate checklist

## Requires Explicit Confirmation

- running heavyweight validation if the user prefers analysis-first
- creating the commit

## Repository Notes

- `apps/web` changes require `npm run build` and `npm run test`.
- `apps/desktop` changes require `npm run build` and `npm run test`.

## Stop Conditions

- diff is too broad
- sensitive data or artifacts are present
- required validations have not been run
