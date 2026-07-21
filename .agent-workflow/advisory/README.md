# Advisory Workspace

This workspace was initialized in advisory mode. Open Orchestra created workflow
state and portable guidance under `.agent-workflow/advisory` without writing
root instruction files.

## Use This For

- Product and technical discovery before choosing a target repository.
- Reviewing requirements, risks, acceptance criteria, and delivery evidence.
- Preparing a project task that can be copied into a real project workspace.

## Safe Next Steps

1. Refine findings in `.agent-workflow/advisory/decisions.md`.
2. Review role-specific responsibilities in `.agent-workflow/advisory/role-guides.md`.
3. Follow `.agent-workflow/advisory/conversion.md` after the target repo is confirmed.
4. Convert `.agent-workflow/advisory/project-task.json` with `orchestra advisory convert --json`.

## Classification

- Kind: `advisory`
- Write policy: `allow`
- Signals: `explicit-advisory-mode`
