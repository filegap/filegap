# issue-workflow

## Purpose

Start work from an issue or issue-like task by turning the request into a clear implementation context.

## Use When

- `Lavoriamo alla issue 1234`
- `Analizza questa issue`
- `Partiamo da questo ticket`

## Inputs

- issue number, issue link, or task description
- current repository context

## Procedure

1. Read the issue or task description.
2. Summarize the requested outcome and constraints.
3. Identify the likely impacted areas in the repository.
4. Highlight privacy, docs, testing, and release impact when relevant.
5. Propose a short execution plan.

## Outputs

- issue summary
- impacted areas
- proposed plan
- open questions if needed

## Can Do Without Confirmation

- inspect the repository
- summarize the task
- propose a plan

## Requires Explicit Confirmation

- branch creation if not explicitly requested
- code changes
- commit, push, release, deploy

## Repository Notes

- Include privacy-first impact when the task touches PDF processing, logging, analytics, or file handling.

## Stop Conditions

- issue is ambiguous
- repository context is not enough to suggest a safe plan
