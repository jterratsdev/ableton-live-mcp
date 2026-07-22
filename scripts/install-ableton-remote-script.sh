#!/usr/bin/env bash
set -euo pipefail

APP_PATH="/Applications/Ableton Live 12 Lite.app"
SCRIPT_NAME="AbletonMcpBridge"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/ableton_remote_scripts/${SCRIPT_NAME}"

usage() {
  cat <<EOF
Usage: ableton-live-mcp install-remote-script [--app-path "/Applications/Ableton Live 12 Lite.app"]
       ableton-live-mcp install-remote-script "/Applications/Ableton Live 12 Lite.app"
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-path)
      if [[ $# -lt 2 ]]; then
        echo "--app-path requires a value" >&2
        exit 2
      fi
      APP_PATH="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
    *)
      APP_PATH="$1"
      shift
      ;;
  esac
done

TARGET_DIR="${APP_PATH}/Contents/App-Resources/MIDI Remote Scripts/${SCRIPT_NAME}"

print_permission_help() {
  cat >&2 <<EOF

macOS blocked writing inside the Ableton app bundle.

If you ran this through npm/npx without elevated permissions, close Ableton and
retry with:

sudo -E npx -y @jterrats/ableton-live-mcp install-remote-script --app-path "${APP_PATH}"

From a local repo checkout, run:

sudo bash scripts/install-ableton-remote-script.sh --app-path "${APP_PATH}"

On recent macOS versions, sudo can still fail until the terminal app has
permission to modify applications. Open System Settings -> Privacy & Security
and grant App Management or Full Disk Access to the terminal app you are using:
Terminal, iTerm, or Codex. Then run the installer again.

You can also copy the folder manually in Finder and authenticate when prompted:
${SOURCE_DIR}
to:
${TARGET_DIR}
EOF
}

if [[ ! -d "${SOURCE_DIR}" ]]; then
  echo "Source Remote Script not found: ${SOURCE_DIR}" >&2
  exit 1
fi

if [[ ! -d "${APP_PATH}" ]]; then
  echo "Ableton app not found: ${APP_PATH}" >&2
  usage >&2
  exit 1
fi

if ! mkdir -p "${TARGET_DIR}"; then
  print_permission_help
  exit 1
fi

if ! cp -R "${SOURCE_DIR}/." "${TARGET_DIR}/"; then
  print_permission_help
  exit 1
fi

echo "Installed ${SCRIPT_NAME} to:"
echo "${TARGET_DIR}"
echo
echo "Restart Ableton Live, then select ${SCRIPT_NAME} in Preferences -> Link, Tempo & MIDI."
echo "Verify installation and bridge health with:"
echo "ableton-live-mcp doctor --app-path \"${APP_PATH}\""
