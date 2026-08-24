# Evidence ableton-stale-delete-plan-duplicate-track-review-20260818: report

- Role: qa
- Summary: Root cause confirmed in source. live_arrangement_delete.clip_candidate hashes id(track) into trackIdentity and id(clip) into clipIdentity; planToken is derived from clipIdentity, resolve_exact_clip rereads proxies and compares those ephemeral hashes, and post-delete verification also compares regenerated ephemeral identities. live_track_operations.resolve_created_track builds before_ids from id(track), treats the first freshly wrapped after proxy as the created track, and renames index 0. Existing Python Arrangement fixtures retain identical objects and the duplicate integration covers only the JS adapter/source index 0, so all focused suites pass despite real Remote Script defects. Minimum fixes: observable deterministic identity fields plus recreated-proxy/no-op verification tests; exact destination index resolution with source-name preservation/readback and recreated-proxy nonzero-source tests. The reported commits 67c56e2, d01e973, and b23e5b8 are not objects in this ableton-mcp repository.
- Path: not applicable
- Command: not applicable
- Exit code: not applicable
- Diff excerpt: not applicable
- Verifier contract: not applicable
- Automation surface: not declared
