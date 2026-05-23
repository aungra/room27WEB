#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FTP_SERVER="${FTP_SERVER:-ftp-1.lolipop.jp}"
FTP_REMOTE_DIR="${FTP_REMOTE_DIR:-room27}"
DEPLOY_BASE="${DEPLOY_BASE:-HEAD~1}"
DEPLOY_REF="${DEPLOY_REF:-HEAD}"

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

is_deployable_file() {
  local file="$1"

  [[ -f "$file" ]] || return 1
  [[ "$file" != .git/* ]] || return 1
  [[ "$file" != .github/* ]] || return 1
  [[ "$file" != node_modules/* ]] || return 1
  [[ "$file" != scripts/* ]] || return 1

  case "$file" in
    .DS_Store|.gitignore|.ftp-env|HANDOFF.md|vercel.json) return 1 ;;
  esac

  return 0
}

upload_file() {
  local relative_path="$1"
  local remote_path="$relative_path"

  if [[ -n "$FTP_REMOTE_DIR" ]]; then
    remote_path="${FTP_REMOTE_DIR%/}/$relative_path"
  fi

  echo "Uploading $relative_path"
  curl --fail --silent --show-error \
    --ftp-create-dirs \
    --user "$FTP_USERNAME:$FTP_PASSWORD" \
    --upload-file "$relative_path" \
    "ftp://$FTP_SERVER/$remote_path"
}

files=()

if [[ "${DEPLOY_ALL:-0}" == "1" ]]; then
  while IFS= read -r file; do
    file="${file#./}"
    if is_deployable_file "$file"; then
      files+=("$file")
    fi
  done < <(find . -type f | sort)
elif [[ "$#" -gt 0 ]]; then
  for file in "$@"; do
    file="${file#./}"
    if is_deployable_file "$file"; then
      files+=("$file")
    else
      echo "Skipping non-deployable file: $file" >&2
    fi
  done
else
  while IFS= read -r file; do
    if is_deployable_file "$file"; then
      files+=("$file")
    fi
  done < <(git diff --name-only --diff-filter=ACMR "$DEPLOY_BASE" "$DEPLOY_REF" | sort)
fi

if [[ "${#files[@]}" -eq 0 ]]; then
  echo "No deployable files found."
  exit 0
fi

for file in "${files[@]}"; do
  upload_file "$file"
done

echo "Deploy complete."
