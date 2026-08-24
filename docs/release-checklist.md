# Release Checklist

This checklist defines the expected bar for publishing `@jterrats/ableton-live-mcp@0.2.1`.

## Required Local Checks

- `npm ci`
- `npm audit --omit=dev`
- `npm test`
- `PYTHONPYCACHEPREFIX=/tmp/ableton-mcp-pycache python3 -m py_compile ableton_remote_scripts/AbletonMcpBridge/*.py`
- `npm pack --dry-run`
- `ableton-live-mcp doctor --app-path "<Ableton app path>"`

## Initial Publication

The first publication is a manual bootstrap because npm trusted publishing can
only be configured after the package exists. Version `0.1.0` completed this
bootstrap.

1. Create the public GitHub repository `jterrats/ableton-live-mcp`.
2. Add the repository as the local `origin`, then push the reviewed commit.
3. Set the release version in `package.json`. Use
   `npm version <version> --no-git-tag-version` so npm also synchronizes
   `package-lock.json` without creating a Git tag.
4. Run `npm login`, complete two-factor authentication, and verify the account
   with `npm whoami`.
5. Run all required local and Live checks from the exact commit being released.
6. Inspect `npm pack --dry-run` and publish with
   `npm publish --access public`.
7. Confirm `@jterrats/ableton-live-mcp@0.1.0` installs and its CLI starts from a
   clean temporary directory.

Creating the repository, adding a remote, pushing, tagging, authenticating, and
publishing are explicit operator actions. Release preparation must not perform
them implicitly.

## Subsequent Publications

The `jterratsdev` organization provides the `NPM_TOKEN` Actions secret used by
the other npm packages in the organization. Confirm that the secret is visible
to this repository and belongs to an npm account with publish access to
`@jterrats/ableton-live-mcp`.

The publish workflow:

- runs on human pushes to `main` that modify `package.json`;
- compares the previous and current `package.json` versions before expensive
  setup and requires `package-lock.json` to match the new version;
- skips publication when Dependabot is the workflow actor;
- validates `NPM_TOKEN` with `npm whoami` before running the release checks;
- runs deterministic install, tests, Python compilation, and package checks
  exactly once before publishing the already-validated contents;
- authenticates publication with `NPM_TOKEN` and uses GitHub OIDC only to attach
  npm provenance to the published package.

Do not merge a version bump until the organization token has been validated. A
version change merged to `main` is the explicit release action; ordinary
package metadata edits do not publish.

## Rollback Plan

Before publication, rollback means stopping the release: do not push the
version commit, create a tag, or publish the package. The current public
`0.2.0` release remains unchanged.

After `0.2.1` is published, npm package contents are immutable. If a release
blocking regression is confirmed:

1. Deprecate `@jterrats/ableton-live-mcp@0.2.1` with an actionable message and
   keep `0.2.0` available; do not unpublish either version.
2. Pin affected MCP clients to `@jterrats/ableton-live-mcp@0.2.0`.
3. Reinstall the `0.2.0` bundled Remote Script into the exact Ableton app that
   is running, restart Live, and select `AbletonMcpBridge` again.
4. Run `doctor` against that app and require a fresh installation, reachable
   bridge, and `staleRuntime.status=not_detected`; then run the read-only smoke
   suite before resuming writes.
5. Publish a forward fix as `0.2.2` after the complete release checklist passes.

There are no database migrations, remote configuration changes, feature flags,
or background jobs to reverse. The release owner monitors installation
freshness, bridge reachability, MCP startup/tool listing, and read-only Live
queries during verification. npm deprecation, version pinning, Remote Script
reinstallation, tagging, pushing, and publishing remain explicit operator
actions.

## Required Live Checks

- Install the Remote Script with `ableton-live-mcp install-remote-script --app-path "<Ableton app path>"`.
- Restart Ableton Live after installation.
- Select `AbletonMcpBridge` in Preferences -> Link, Tempo & MIDI.
- Run `doctor` and confirm file freshness is `fresh`, the bridge is reachable, and stale runtime status is `not_detected`.
- Run read-only smoke before write smoke on user projects.
- Create a snapshot before safe-write, mastering, export, or destructive workflows.

## 0.2.1 Scope

- Safe Arrangement clip deletion from an exact read-only plan, with verified
  `Song.undo` compensation after partial failure.
- Verifiable Session clip deletion and explicit Save/Save As reporting.
- Plugin multi-output discovery and receiver-track routing with fail-closed
  selector handling and rollback of newly created tracks.
- Bridge request bodies up to 1 MiB, bounded MIDI note arrays, stricter numeric
  parameter contracts, inventory-backed presets, and pre-resolved mastering
  chains including VST and AU devices.

## 0.1.0 Scope

- Local MCP stdio server.
- Bundled Ableton Python Remote Script bridge.
- Deterministic development bridge and tests.
- Track, return, master, device, routing, MIDI clip, snapshot, observability, risk, and workflow tools.
- Closed-loop mixer write verification through `writeVerification`.

## Known Constraints

- Some Remote Script endpoints remain conditional because Live Python APIs vary by edition/version.
- Render and bounce are supported by the deterministic development bridge; the Python Remote Script returns explicit unsupported responses where Live does not expose reliable render APIs.
- macOS may require sudo plus App Management or Full Disk Access before copying into `/Applications`.
