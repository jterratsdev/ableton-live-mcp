# Evidence ableton-effective-mixing-endpoints-20260720: command

- Role: developer
- Summary: Implemented effective mixing endpoints: /tracks/modify, /returns, /returns/modify, /routing/buses, /devices/parameter, and stricter /mastering/apply behavior. Development adapter now mutates observable mixer, return, routing, device parameter, and master device state. Remote Script applies mixer/device changes through Live API and returns 404/400 for missing sends, routing, devices, parameters, or no-op mastering. Validation passed: npm test; python3 -m py_compile for Remote Script files; repository-wide legacy-reference search returned no matches.
- Path: not applicable
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: not declared
