#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
branch="${1:-dev}"
case "$branch" in dev|main) ;; *) echo 'Usage: scripts/deploy.sh [dev|main]' >&2; exit 1 ;; esac
git fetch origin "$branch"
sha="$(git rev-parse "origin/$branch")"
ssh "${EGELTOOLS_SERVER:-servarr}" "docker exec egeltools-publisher python /app/server.py --publish '$branch' '$sha'"
echo "Published branch head: https://files.miro23.uk/egeltools/$branch/EgelTools.user.js"
