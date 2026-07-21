#!/usr/bin/env bash
set -euo pipefail

APP_PATH="${1:-/Applications/Ableton Live 12 Lite.app}"
SCRIPT_NAME="AbletonMcpBridge"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/ableton_remote_scripts/${SCRIPT_NAME}"
TARGET_DIR="${APP_PATH}/Contents/App-Resources/MIDI Remote Scripts/${SCRIPT_NAME}"

print_permission_help() {
  cat >&2 <<EOF

macOS blocked writing inside the Ableton app bundle.

On recent macOS versions, sudo can still fail until the terminal app has
permission to modify applications. Open System Settings -> Privacy & Security
and grant App Management or Full Disk Access to the terminal app you are using:
Terminal, iTerm, or Codex. Then run this installer again.

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
  echo "Usage: $0 '/Applications/Ableton Live 12 Lite.app'" >&2
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
echo "npm run doctor -- \"${APP_PATH}\""
