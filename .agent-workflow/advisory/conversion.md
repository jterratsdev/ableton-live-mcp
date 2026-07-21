# Advisory Conversion

Use this checklist after the target project repository is confirmed.

## Convert To A Task

```sh
orchestra advisory convert --json
```

Optional flags:

- `--file <file>` converts a different project-task JSON file.
- `--id <id>` overrides the advisory task ID.
- `--backlog <url>` links the converted task to an external backlog item.
- `--target-dir <dir>` writes the task into a specific project workspace.

## Verify

```sh
orchestra status --json
orchestra health --json
```

Attach the advisory README, decisions, role guides, and this conversion result as evidence on the project task.
