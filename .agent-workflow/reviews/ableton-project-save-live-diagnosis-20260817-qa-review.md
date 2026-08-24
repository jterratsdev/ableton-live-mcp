# Review ableton-project-save-live-diagnosis-20260817: qa

- Result: changes
- Severity: info
- Findings: High: the published save tool relies on save methods that do not exist in the public Live Object Model. Fake-Live tests overstate runtime support by supplying invented save/save_as and application save methods. Installed code is current, so restart or reinstall will not fix this.
- Recommendation: Fail closed and advertise save capability as unsupported for the Remote Script backend. If project save is required, design a separate opt-in macOS Accessibility/UI automation backend with focus, dialog, permission, and post-action verification controls.

## Return Action
- Return role: developer
- Return phase: developer
- Summary: Return to developer implementation for correction before release can proceed.
- Required evidence: Complete the requested implementation correction, attach real command/file evidence, then record an approving review from the responsible role or QA before resuming release.
- Resume command: `orchestra workflow run --task ableton-project-save-live-diagnosis-20260817 --resume wfrun-1787022502510-e385b8`
