#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FTP_SERVER="${FTP_SERVER:-ftp-1.lolipop.jp}"
FTP_REMOTE_DIR="${FTP_REMOTE_DIR:-room27}"

if [[ -f "$ROOT_DIR/.ftp-env" ]]; then
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.ftp-env"
fi

if [[ -z "${FTP_USERNAME:-}" || -z "${FTP_PASSWORD:-}" ]]; then
  echo "FTP_USERNAME and FTP_PASSWORD are required." >&2
  echo "Create .ftp-env or export them before running this script." >&2
  exit 1
fi

cd "$ROOT_DIR"

find . -type f \
  ! -path './.git/*' \
  ! -path './.github/*' \
  ! -path './node_modules/*' \
  ! -path './scripts/*' \
  ! -name '.DS_Store' \
  ! -name '.gitignore' \
  ! -name '.ftp-env' \
  ! -name 'HANDOFF.md' \
  ! -name 'vercel.json' \
  | sort \
  | while IFS= read -r file; do
      relative_path="${file#./}"
      remote_path="$relative_path"
      if [[ -n "$FTP_REMOTE_DIR" ]]; then
        remote_path="${FTP_REMOTE_DIR%/}/$relative_path"
      fi

      echo "Uploading $relative_path"
      curl --fail --silent --show-error \
        --ftp-create-dirs \
        --user "$FTP_USERNAME:$FTP_PASSWORD" \
        --upload-file "$relative_path" \
        "ftp://$FTP_SERVER/$remote_path"
    done

echo "Deploy complete."
