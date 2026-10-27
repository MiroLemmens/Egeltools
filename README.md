# EgelTools

## Install and automatic updates

- Development: <https://files.miro23.uk/egeltools/dev/EgelTools.user.js>
- Main: <https://files.miro23.uk/egeltools/main/EgelTools.user.js>

Every push to `dev` or `main` runs **Publish userscript**. Each hosted copy has update/download metadata pointing to its own branch. Userscript managers require a higher version to auto-update. Existing installations using the legacy stable URL must reinstall from their chosen branch URL to switch channels.

The publisher reads the committed userscript (`EgelTools.user.js` or the legacy lowercase filename), validates matching `@version` and `APP.version`, and changes only its hosted update/download URLs. Source files are not rewritten. Each branch keeps immutable releases under `<branch>/releases/<version>/EgelTools.user.js`; reusing a version with different content fails. The legacy stable URL and its release history remain untouched.

## Publish a release

1. For userscript changes, bump `@version` and `APP.version` together and add notes to `CHANGELOG.md`.
2. Run relevant checks and merge the change through a pull request into `dev`.
3. The Action publishes the merged branch automatically. Check its result and the public download.
4. For an explicit deployment or retry, run `scripts/deploy.sh dev` (or `main`). This publishes the latest remote branch head, not uncommitted local work. Reuse the version for documentation-only changes.

The Action can also be run manually on either branch. An older queued run is skipped if a newer commit is already the branch head. Publishing to `main` uses the same process, through a PR targeting `main`.

## Server setup

`servarr` runs the `egeltools-publisher` Docker container, built from `scripts/publisher/Dockerfile`. It runs as UID/GID 1001, with only these writable host mounts:

- `/var/www/files/egeltools/dev` → `/publish/dev`
- `/var/www/files/egeltools/main` → `/publish/main`

It has no Docker socket, host credentials, or checkout mounted. GitHub Actions uses a short-lived signed OIDC token; no repository deployment secret or self-hosted runner is needed. The service verifies GitHub's signature, issuer, audience, expiration, repository/owner IDs, workflow path, event and branch, then fetches that branch from GitHub and checks the signed commit before publishing. Repository code is never executed on the server.

Caddy forwards `/egeltools/deploy` to `egeltools-publisher:8094` over Docker network `egeltools-publishing`. Mutable channel downloads and `deployment.json` use `Cache-Control: no-store`; versioned branch releases use immutable caching. The container restarts automatically after a server restart.

To install/update the service from an approved checkout, run `scripts/setup-publisher.sh`. Caddy's `/data/filehost/Caddyfile` needs the routing and cache directives in `scripts/publisher/Caddyfile.fragment` inside its existing site block. Validate and reload Caddy after merging these directives. Updating publisher code requires this server setup step; normal userscript pushes do not.

Validation: `python3 -m unittest discover -s tests -p 'test_publisher.py'` (requires `PyJWT[crypto]==2.10.1`), plus `bash -n scripts/*.sh`.
