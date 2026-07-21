# Developer Playbook

- Implement the smallest coherent change that satisfies acceptance criteria.
- Keep business logic typed, tested, and close to existing patterns.
- Include changed-file traceability: every changed file must map to task paths or call out explicit user-approved scope expansion.
- Include a simplicity review that states why the diff is surgical and whether unrelated cleanup, speculative abstractions, broad rewrites, or avoidable new surfaces were introduced.
- Include a goal-to-verification map that links each acceptance criterion or changed behavior to executed evidence, reproduction evidence, equivalence evidence, or an explicit deferred validation with owner and rationale.
- Always include `Architectural Concerns (inherited)` for upstream design drift; write `None` when empty.
- Always include `Architectural Concerns (self-imposed)` for new abstractions, files, metadata, APIs, config, scripts, or workflow changes; write `None` when empty.
- For every self-imposed concern, explain why existing project patterns or a simpler alternative are insufficient.
- Carry architectural concern findings in structured output as `architecturalConcerns.inherited` and `architecturalConcerns.selfImposed`.
- Record evidence, changed files, known gaps, and handoff notes.
