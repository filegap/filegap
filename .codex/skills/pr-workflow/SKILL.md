# pr-workflow

## Purpose

Prepare and create a pull request using the team's standard GitHub workflow.

## Use When

- `Crea la PR`
- `Prepara la pull request`
- `Apri una PR`

## Inputs

- current branch
- current diff or commit range
- repository PR conventions
- issue reference when applicable

## Procedure

1. Inspect branch name and current repository status.
2. Check whether the branch exists on `origin` when the repository uses a remote PR workflow.
3. Determine the base branch from repository-local rules.
4. Extract the issue id from the branch name when it matches an issue-based pattern such as `feature/<issue-id>-<description>`.
5. Prepare the PR title:
   - if an issue id is available, prefix the title with `#<issue-id> - `
   - derive the remaining title from the branch description
   - replace `-` with spaces and capitalize the first word
   - example: `feature/8425-lambda-update-external-availability` -> `#8425 - Lambda update external availability`
6. Prepare the PR body:
   - include a short summary of changes
   - include the issue link when an issue id is available
   - retrieve the issue URL with `gh issue view <issue-id> --json url -q .url` when GitHub CLI is the repository standard
7. Prepare PR metadata:
   - assign the PR to the current GitHub user
   - retrieve the current user with `gh api user --jq .login` when GitHub CLI is the repository standard
   - infer labels from the change type, touched files, branch name, or commit messages
   - if label choice is uncertain, propose labels and ask before applying them
8. If the user explicitly requests execution, create the PR through the standard GitHub CLI workflow.

## Outputs

- PR title
- PR body draft
- base branch
- issue reference and issue URL when available
- assignee
- proposed labels
- metadata checklist
- optional ready-to-run PR workflow

## Can Do Without Confirmation

- inspect branch and diff
- draft title and body
- retrieve issue URL
- retrieve current GitHub user
- propose labels
- propose metadata

## Requires Explicit Confirmation

- push branch
- create PR
- modify PR metadata remotely
- apply labels remotely
- assign PR remotely

## GitHub CLI Notes

When GitHub CLI is the repository standard, use `gh`.

Useful commands:

- current user: `gh api user --jq .login`
- issue URL: `gh issue view <issue-id> --json url -q .url`
- create PR: `gh pr create`

When creating the PR, include assignee and labels only when they are known and valid for the repository. If labels are ambiguous, create a draft command or ask for confirmation before applying them.

## Label Heuristics

Infer labels conservatively from the actual change.

Examples:

- documentation-only changes: `documentation` or `docs` if available
- tests-only changes: `test` or `tests` if available
- CI/build/config changes: `ci`, `build`, or `chore` if available
- frontend/UI changes: `frontend` or `ui` if available
- backend/API changes: `backend` or `api` if available
- infrastructure changes: `infra` or `infrastructure` if available
- bug fixes: `bug` or `fix` if available
- new features: `feature` or `enhancement` if available

Do not invent repository labels. Prefer reading existing labels first when applying labels remotely.

## Repository Notes

- Repositories may define different base-branch rules or may not use PRs at all.
- Follow repository-local rules for branch naming, issue references, base branch, assignee, labels, and review readiness.
- In repositories without an active PR workflow, stop after preparation and explain the limitation.

## Stop Conditions

- branch state is unclear
- repository PR workflow is undefined
- issue reference cannot be resolved safely
- base branch cannot be determined safely
- required labels are unclear and the user has not confirmed them
