"""Publish only GitHub-authenticated branch heads; never execute repository code."""
import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
from http.server import BaseHTTPRequestHandler, HTTPServer

import jwt

REPOSITORY = 'MiroLemmens/Egeltools'
AUDIENCE = 'https://files.miro23.uk/egeltools/deploy'
ISSUER = 'https://token.actions.githubusercontent.com'
ROOT = Path(os.environ.get('PUBLISH_ROOT', '/publish'))
KEYS = jwt.PyJWKClient(ISSUER + '/.well-known/jwks', timeout=15)


def authorize(claims):
    branch = claims.get('ref', '').removeprefix('refs/heads/')
    if (branch not in ('dev', 'main')
            or claims.get('ref') != f'refs/heads/{branch}'
            or claims.get('repository') != REPOSITORY
            or claims.get('repository_id') != '1344937945'
            or claims.get('repository_owner_id') != '181408858'
            or claims.get('event_name') not in ('push', 'workflow_dispatch')
            or claims.get('workflow_ref') != f'{REPOSITORY}/.github/workflows/publish.yml@refs/heads/{branch}'
            or not re.fullmatch(r'[0-9a-f]{40}', claims.get('sha', ''))):
        raise ValueError('Untrusted workflow identity')
    return branch, claims['sha']


def render(source, branch):
    text = source.decode('utf-8')
    versions = re.findall(r'^// @version\s+(\S+)\s*$', text, re.M)
    app = re.search(r"const APP = Object.freeze\(\{.*?version:\s*'([^']+)'", text, re.S)
    if len(versions) != 1 or not re.fullmatch(r'\d+(?:\.\d+)+', versions[0]) or not app or app[1] != versions[0]:
        raise ValueError('Invalid or mismatched userscript version')
    for field in ('updateURL', 'downloadURL'):
        text, count = re.subn(rf'^// @{field}\s+.*$', f'// @{field}  https://files.miro23.uk/egeltools/{branch}/EgelTools.user.js', text, flags=re.M)
        if count != 1:
            raise ValueError(f'Expected one @{field}')
    return versions[0], text.encode('utf-8')


def write_release(root, branch, source, sha):
    version, content = render(source, branch)
    target = root / branch
    release = target / 'releases' / version / 'EgelTools.user.js'
    release.parent.mkdir(parents=True, exist_ok=True)
    if release.exists() and release.read_bytes() != content:
        raise ValueError(f'Release {branch}/{version} already exists with different content; bump the version')
    if not release.exists():
        atomic_write(release, content)
    atomic_write(target / 'EgelTools.user.js', content)
    result = dict(branch=branch, version=version, commit=sha, sha256=hashlib.sha256(content).hexdigest())
    atomic_write(target / 'deployment.json', (json.dumps(result) + '\n').encode())
    return result


def atomic_write(path, content):
    fd, temporary = tempfile.mkstemp(dir=path.parent, prefix='.publish-')
    try:
        with os.fdopen(fd, 'wb') as output:
            output.write(content)
            output.flush()
            os.fsync(output.fileno())
        os.chmod(temporary, 0o644)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def publish(branch, sha):
    if branch not in ('dev', 'main') or not re.fullmatch(r'[0-9a-f]{40}', sha):
        raise ValueError('Invalid branch or commit')
    # Serialize HTTP and manual deployments, including the head check.
    with open('/tmp/egeltools-publish.lock', 'w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        with tempfile.TemporaryDirectory() as checkout:
            def git(*args):
                return subprocess.check_output(['git', '-C', checkout, *args], stderr=subprocess.PIPE, timeout=60)
            git('init', '--quiet')
            git('fetch', '--quiet', '--depth=1', f'https://github.com/{REPOSITORY}.git', f'refs/heads/{branch}')
            head = git('rev-parse', 'FETCH_HEAD').decode().strip()
            if head != sha:
                return dict(branch=branch, skipped='Superseded by a newer branch head', commit=sha)
            files = git('ls-tree', '--name-only', 'FETCH_HEAD').decode().splitlines()
            filename = next((name for name in ('EgelTools.user.js', 'egeltools.user.js') if name in files), None)
            if filename is None:
                raise ValueError('Userscript missing from branch')
            source = git('show', f'FETCH_HEAD:{filename}')
            return write_release(ROOT, branch, source, sha)


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != '/egeltools/deploy':
            self.send_error(404)
            return
        try:
            scheme, token = self.headers.get('Authorization', '').split(' ', 1)
            if scheme != 'Bearer' or len(token) > 16384:
                raise ValueError('Invalid authorization')
            claims = jwt.decode(token, KEYS.get_signing_key_from_jwt(token).key,
                                algorithms=['RS256'], audience=AUDIENCE, issuer=ISSUER,
                                options={'require': ['exp', 'iat', 'nbf', 'sub', 'aud', 'iss']})
            branch, sha = authorize(claims)
        except (ValueError, jwt.PyJWTError):
            self.send_error(403, 'Invalid deployment identity')
            return
        try:
            result = publish(branch, sha)
        except Exception as error:
            print(f'Publication failed: {type(error).__name__}: {error}', flush=True)
            self.send_error(500, 'Publication failed; inspect publisher logs')
            return
        body = (json.dumps(result) + '\n').encode()
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--publish', nargs=2, metavar=('BRANCH', 'SHA'))
    args = parser.parse_args()
    if args.publish:
        print(json.dumps(publish(*args.publish)))
    else:
        HTTPServer(('0.0.0.0', 8094), Handler).serve_forever()
