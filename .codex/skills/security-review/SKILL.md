# security-review

## Purpose

Review the current change set from a security perspective and surface actionable risks.

## Use When

- `Fai un check di sicurezza`
- `Analizza le modifiche in ottica di sicurezza`
- `Controlla se ci sono problemi di sicurezza`

## Inputs

- current diff or selected files
- repository context

## Procedure

1. Inspect the diff and identify trust boundaries, file handling, secrets, and external integrations.
2. Look for concrete risks such as secret exposure, unsafe logging, weak validation, or excessive permissions.
3. Distinguish actionable findings from low-signal observations.
4. Propose mitigations consistent with repository patterns.

## Outputs

- prioritized findings
- rationale for each finding
- mitigation suggestions

## Can Do Without Confirmation

- inspect code and config
- report findings
- suggest safer patterns

## Requires Explicit Confirmation

- applying fixes
- changing secrets, release configuration, or infrastructure-sensitive settings

## Repository Notes

- Prioritize privacy-first guarantees, open-source hygiene, and least exposure of user data.

## Stop Conditions

- insufficient context for a credible assessment
