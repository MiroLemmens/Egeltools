#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
server="${EGELTOOLS_SERVER:-servarr}"
ssh "$server" 'mkdir -p ~/egeltools-publisher /var/www/files/egeltools/dev /var/www/files/egeltools/main'
scp scripts/publisher/Dockerfile scripts/publisher/server.py "$server:egeltools-publisher/"
ssh "$server" 'set -eu
  docker build -t egeltools-publisher:local "$HOME/egeltools-publisher"
  docker network inspect egeltools-publishing >/dev/null 2>&1 || docker network create egeltools-publishing
  if ! docker inspect files --format "{{json .NetworkSettings.Networks}}" | grep -q egeltools-publishing; then
    docker network connect egeltools-publishing files
  fi
  if docker container inspect egeltools-publisher >/dev/null 2>&1; then docker rm -f egeltools-publisher; fi
  docker run -d --name egeltools-publisher --restart unless-stopped \
    --network egeltools-publishing --cap-drop ALL --security-opt no-new-privileges \
    --read-only --tmpfs /tmp:rw,noexec,nosuid,size=128m --memory 256m --cpus 1 --pids-limit 128 \
    -v /var/www/files/egeltools/dev:/publish/dev \
    -v /var/www/files/egeltools/main:/publish/main egeltools-publisher:local'
