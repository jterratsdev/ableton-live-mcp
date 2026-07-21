# Evidence verify-live-remote-script-reinstall-20260718: command

- Role: qa
- Summary: Retried live verification after user reported restart/reload. /status works from Live PID 35269, but /plugins still returns the old response shape and snapshot/rollback remain unsupported. lsof shows Live owns 127.0.0.1:9789; ps -p 35269 shows the process started at Sat Jul 18 00:38:14 2026, so Ableton did not fully restart after updated files were installed.
- Path: not applicable
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: not declared
