# Evidence ableton-remote-script-delete-method-fix-20260718: command

- Role: developer
- Summary: Added do_DELETE support to AbletonMcpBridge/http_bridge.py and JSON body parsing for DELETE requests. Updated remote-script-static test to assert do_DELETE and POST/DELETE body parsing. Validation passed: npm test and python3 -m py_compile for Remote Script files. Live follow-up showed Ableton is currently selecting legacy legacy bridge, so DELETE still returns HTTP 501 until the Control Surface preference is changed to AbletonMcpBridge or the selected script is updated.
- Path: not applicable
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: not declared
