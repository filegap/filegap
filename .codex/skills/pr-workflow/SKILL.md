# pr-workflow

## Purpose

Prepare and create a pull request using the repository's GitHub workflow.

## Use When

- `Crea la PR`
- `Prepara la pull request`
- `Apri una PR`

## Inputs

- current branch
- current diff or commit range
- repository PR conventions

## Procedure

1. Inspect branch name and repository status.
2. Check whether the branch exists on `origin` when the repository uses remote PR workflows.
3. Draft the PR title and body according to repository conventions.
4. Include the summary of changes and relevant issue references when needed.
5. If the user explicitly requests execution, create the PR through the standard GitHub workflow.

## Outputs

- PR title
- PR body draft
- metadata checklist

## Can Do Without Confirmation

- inspect branch and diff
- draft title and body
- propose metadata

## Requires Explicit Confirmation

- push branch
- create PR
- modify PR metadata remotely

## Repository Notes

- Use `gh` when repository workflow expects GitHub CLI.
- Follow repository-local branch and release conventions.

## Stop Conditions

- branch state is unclear
- repository PR workflow is undefined
