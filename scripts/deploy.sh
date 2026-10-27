#!/usr/bin/env bash

set -euo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
readonly SCRIPT_FILE="${PROJECT_DIR}/EgelTools.user.js"
readonly CHANGELOG_FILE="${PROJECT_DIR}/CHANGELOG.md"
readonly README_FILE="${PROJECT_DIR}/README.md"
readonly SERVER="${EGELTOOLS_SERVER:-servarr}"
readonly PUBLISH_ROOT="${EGELTOOLS_PUBLISH_ROOT:-/var/www/files/egeltools}"

version="$(sed -nE 's|^// @version[[:space:]]+([^[:space:]]+).*$|\1|p' "${SCRIPT_FILE}")"
app_version="$(sed -nE "s|^[[:space:]]+version: '([^']+)',.*$|\1|p" "${SCRIPT_FILE}" | head -n 1)"

if [[ -z "${version}" ]]; then
  echo "Could not read @version from ${SCRIPT_FILE}" >&2
  exit 1
fi

if [[ "${version}" != "${app_version}" ]]; then
  echo "@version (${version}) and APP.version (${app_version}) do not match" >&2
  exit 1
fi

readonly VERSION_DIR="${PUBLISH_ROOT}/releases/${version}"
readonly REMOTE_RELEASE="${VERSION_DIR}/EgelTools.user.js"
readonly REMOTE_CURRENT="${PUBLISH_ROOT}/EgelTools.user.js"
readonly UPLOAD_NAME="EgelTools.user.js.${version}.$$.upload"
readonly REMOTE_UPLOAD="/tmp/${UPLOAD_NAME}"

local_checksum="$(shasum -a 256 "${SCRIPT_FILE}" | awk '{print $1}')"

scp -q "${SCRIPT_FILE}" "${SERVER}:${REMOTE_UPLOAD}"

cleanup() {
  ssh "${SERVER}" "rm -f -- '${REMOTE_UPLOAD}'" >/dev/null 2>&1 || true
}
trap cleanup EXIT

remote_checksum="$(ssh "${SERVER}" "if [ -f '${REMOTE_RELEASE}' ]; then sha256sum '${REMOTE_RELEASE}' | awk '{print \$1}'; fi")"

if [[ -n "${remote_checksum}" && "${remote_checksum}" != "${local_checksum}" ]]; then
  echo "Release ${version} already exists with different content; bump the version first" >&2
  exit 1
fi

ssh "${SERVER}" \
  "mkdir -p '${VERSION_DIR}' && \
   if [ ! -f '${REMOTE_RELEASE}' ]; then install -m 0644 '${REMOTE_UPLOAD}' '${REMOTE_RELEASE}'; fi && \
   install -m 0644 '${REMOTE_UPLOAD}' '${REMOTE_CURRENT}'"

scp -q "${CHANGELOG_FILE}" "${SERVER}:${PUBLISH_ROOT}/CHANGELOG.md"
scp -q "${README_FILE}" "${SERVER}:${PUBLISH_ROOT}/README.md"

published_checksum="$(ssh "${SERVER}" "sha256sum '${REMOTE_CURRENT}' | awk '{print \$1}'")"
if [[ "${published_checksum}" != "${local_checksum}" ]]; then
  echo "Published checksum does not match the local script" >&2
  exit 1
fi

echo "Published EgelTools ${version}"
echo "Install/update: https://files.miro23.uk/egeltools/EgelTools.user.js?channel=stable"
echo "Release:       https://files.miro23.uk/egeltools/releases/${version}/EgelTools.user.js"
