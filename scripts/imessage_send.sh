#!/usr/bin/env bash
set -euo pipefail

TO="+14157206659"   # <-- PUT YOUR NUMBER HERE (E.164 format)
MSG="${*:-}"

if [[ -z "$MSG" ]]; then
  echo "Usage: ./scripts/imessage_send.sh \"message text\""
  exit 1
fi

osascript -e "tell application \"Messages\" to send \"${MSG//\"/\\\"}\" to buddy \"${TO}\" of (1st service whose service type = iMessage)"
