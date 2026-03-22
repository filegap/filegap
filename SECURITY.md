# Security Policy

`filegap` is a privacy-first PDF tool suite. Security and privacy issues are high priority.

## How To Report

Please report vulnerabilities privately:

- Open a **private security advisory** on GitHub

Do not open public issues for unpatched vulnerabilities.

When reporting, include:

- A clear description of the issue
- Reproduction steps or proof of concept
- Affected component(s) and version/commit, if known
- Impact assessment (what can an attacker do)

## Response Expectations

- Initial triage acknowledgment: within **3 business days**
- Status update after triage: within **7 business days**
- Fix timeline: depends on severity and complexity

If a report is valid, we will coordinate disclosure and credit the reporter (unless you prefer to stay anonymous).

## Scope

Examples in scope:

- Code execution, injection, privilege escalation
- Dependency vulnerabilities with practical impact
- Data leakage or unintended file/content exposure
- Any behavior that breaks our privacy guarantees

Examples out of scope:

- Vulnerabilities only in unsupported environments
- Missing best practices without a demonstrated impact
- Purely theoretical issues without a realistic exploit path

## Privacy-First Security Invariants

The following are non-negotiable for this project:

- PDF processing must stay local (web, CLI, desktop)
- No user file upload for processing
- No tracking or logging of user file data (names, sizes, pages, contents)

A finding that violates these invariants is treated as a critical privacy/security issue.

## Trust Model

`filegap` is designed so that:

- All file processing happens locally
- No file content is ever sent to external servers
- No file metadata is logged or tracked

Users should be able to verify this behavior independently (for example via browser devtools or offline usage).
