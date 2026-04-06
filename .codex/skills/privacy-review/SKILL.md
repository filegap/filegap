# privacy-review

## Purpose

Verify that a change respects the privacy-first and local-only processing guarantees of `filegap`.

## Use When

- `Fai un check privacy sulle modifiche`
- `Verifica che questa modifica rispetti i vincoli privacy-first`
- `Controlla i vincoli privacy`

## Inputs

- current diff or selected files
- repository privacy rules

## Procedure

1. Inspect the change for any file-processing, network, logging, or analytics behavior.
2. Verify that PDF processing remains local-only across web, CLI, and desktop.
3. Check that no server-side upload, persistence, or inspection path is introduced.
4. Check that logs and analytics remain free of sensitive file metadata and user payloads.
5. Report any privacy invariant violations or risks.

## Outputs

- pass/fail privacy review
- violations or risks
- suggested fixes

## Can Do Without Confirmation

- inspect code and config
- report findings

## Requires Explicit Confirmation

- applying fixes
- any action that would relax privacy guarantees

## Repository Notes

- If a proposal introduces server-side PDF processing, stop and flag it as out of scope.

## Stop Conditions

- privacy guarantees are unclear
- the change introduces risk that cannot be resolved safely without product confirmation
