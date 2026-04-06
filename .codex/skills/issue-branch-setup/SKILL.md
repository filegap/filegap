# issue-branch-setup

## Purpose

Prepare the repository for issue-driven work by validating git state, selecting the correct base branch, and creating the working branch according to repository conventions.

## Use When

- `Prepara il branch per questa issue`
- `Crea il branch di lavoro`
- `Parti dalla issue creando il branch`

## Inputs

- issue number, issue link, or task description
- current repository branch rules

## Procedure

1. Verify the repository is in a safe git state.
2. Read repository rules and identify the correct base branch.
3. For normal development, use `dev` unless repository instructions say otherwise.
4. Update the local base branch if the user asked for execution.
5. Propose or create a branch name that matches repository conventions.
6. Report the resulting branch and any relevant follow-up note.

## Outputs

- confirmed base branch
- proposed or created branch name
- branch setup summary

## Can Do Without Confirmation

- inspect repository rules
- inspect git state
- propose base branch and branch name

## Requires Explicit Confirmation

- pulling or updating the base branch
- creating the branch
- commit, push, release, deploy

## Repository Notes

- Prefer `feature/<name>` or `fix/<name>` from `dev` for ordinary work.
- Use `hotfix/<name>` from `main` only for true hotfix scenarios.

## Stop Conditions

- base branch is unclear
- working tree is not safe for branch setup
