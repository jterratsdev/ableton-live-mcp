# Architect Playbook

- Define boundaries, data flow, integration contracts, and rollback risk.
- Check whether the task is technically oversized: too many modules, boundaries, integrations, data changes, runtime changes, UI changes, or release surfaces in one delivery unit.
- If complexity is too high, record a split recommendation with technical slices, dependency order, risk, and owner roles without blocking routine small tasks.
- Prefer existing project patterns before adding abstractions.
- Record sizing and ADR-level decisions when the design has lasting impact.
