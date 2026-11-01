#!/usr/bin/env python3
"""Post one CHANGELOG.md release section to a chat webhook (Discord, Slack or generic JSON)."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
REPOSITORY = 'MiroLemmens/Egeltools'
HEADING = re.compile(r'^## (\d+(?:\.\d+)+)(?:\s+[—-]\s+(\S+))?\s*$')
DISCORD_LIMIT = 4096
SLACK_LIMIT = 2900


def script_version(text):
    meta = re.search(r'^//\s*@version\s+(\S+)', text, re.M)
    app = re.search(r"\bversion:\s*'([^']+)'", text)
    if not meta or not app or meta.group(1) != app.group(1):
        raise ValueError('@version and APP.version are missing or differ')
    return meta.group(1)


def release_notes(changelog, version):
    """Return (date, bullet list) for one version heading in CHANGELOG.md."""
    date, lines, found = None, [], False
    for line in changelog.splitlines():
        match = HEADING.match(line)
        if match:
            if found:
                break
            if match.group(1) == version:
                found, date = True, match.group(2)
            continue
        if found:
            lines.append(line)
    if not found:
        raise ValueError(f'CHANGELOG.md has no "## {version}" section')
    notes, current = [], None
    for line in lines:
        if line.startswith('- '):
            current = line[2:].strip()
            notes.append(current)
        elif line.strip() and current is not None:
            notes[-1] = f'{notes[-1]} {line.strip()}'
    if not notes:
        raise ValueError(f'CHANGELOG.md section {version} has no bullet points')
    return date, notes


def fit(notes, limit, more):
    """Join bullets, dropping trailing ones (with a pointer to the full changelog) to stay under limit."""
    body = '\n'.join(f'• {note}' for note in notes)
    if len(body) <= limit:
        return body
    kept = []
    for note in notes:
        candidate = '\n'.join(kept + [f'• {note}', more])
        if len(candidate) > limit:
            break
        kept.append(f'• {note}')
    if not kept:
        return notes[0][:limit - len(more) - 2] + '…\n' + more
    return '\n'.join(kept + [more])


def payload(kind, version, channel, date, notes):
    install = f'https://files.miro23.uk/egeltools/{channel}/EgelTools.user.js'
    changelog = f'https://github.com/{REPOSITORY}/blob/{channel}/CHANGELOG.md'
    title = f'EgelTools {version}' + ('' if channel == 'main' else f' ({channel})')
    if kind == 'discord':
        more = f'[Full changelog]({changelog})'
        return {
            'username': 'EgelTools',
            'allowed_mentions': {'parse': []},
            'embeds': [{
                'title': title,
                'url': install,
                'description': fit(notes, DISCORD_LIMIT, more),
                'color': 0x2F6FB0,
                'footer': {'text': f'Released {date}' if date else 'New release'},
                'fields': [{'name': 'Install / update', 'value': f'[EgelTools.user.js]({install})'}],
            }],
        }
    if kind == 'slack':
        slack_notes = [re.sub(r'\*\*(.+?)\*\*', r'*\1*', note) for note in notes]
        more = f'<{changelog}|Full changelog>'
        text = f'*<{install}|{title}>*' + (f' — {date}' if date else '') + '\n' + fit(slack_notes, SLACK_LIMIT, more)
        return {'text': text, 'unfurl_links': False}
    return {'name': 'EgelTools', 'version': version, 'channel': channel, 'date': date,
            'notes': notes, 'install_url': install, 'changelog_url': changelog}


def detect_kind(url):
    if re.match(r'https://(?:\w+\.)?discord(?:app)?\.com/api/webhooks/', url):
        return 'discord'
    if url.startswith('https://hooks.slack.com/'):
        return 'slack'
    return 'generic'


def version_at(ref):
    """Userscript version at a git ref, or None when the ref or file is unavailable."""
    for name in ('EgelTools.user.js', 'egeltools.user.js'):
        result = subprocess.run(['git', 'show', f'{ref}:{name}'], cwd=ROOT, capture_output=True, text=True)
        if result.returncode == 0:
            try:
                return script_version(result.stdout)
            except ValueError:
                return None
    return None


def post(url, body):
    request = urllib.request.Request(url, data=json.dumps(body).encode(), method='POST', headers={
        'Content-Type': 'application/json', 'User-Agent': f'EgelTools-changelog (+https://github.com/{REPOSITORY})'})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.status


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--version', help='release to announce (default: the userscript @version)')
    parser.add_argument('--channel', choices=('dev', 'main'), default='dev')
    parser.add_argument('--format', choices=('auto', 'discord', 'slack', 'generic'), default='auto')
    parser.add_argument('--since', metavar='REF', help='only post when the userscript version differs from REF')
    parser.add_argument('--dry-run', action='store_true', help='print the payload instead of posting it')
    args = parser.parse_args(argv)

    url = os.environ.get('EGELTOOLS_CHANGELOG_WEBHOOK', '').strip()
    if not url and not args.dry_run:
        config = Path.home() / '.config/egeltools/changelog-webhook'
        url = config.read_text().strip() if config.is_file() else ''
    if not url and not args.dry_run:
        parser.error('set EGELTOOLS_CHANGELOG_WEBHOOK or ~/.config/egeltools/changelog-webhook, or use --dry-run')
    if url and not url.startswith('https://'):
        parser.error('the webhook URL must use https://')

    source = next((ROOT / name for name in ('EgelTools.user.js', 'egeltools.user.js') if (ROOT / name).is_file()))
    current = script_version(source.read_text())
    version = args.version or current
    if args.since:
        previous = version_at(args.since)
        if previous is None:
            print(f'Cannot read the userscript version at {args.since}; not announcing to avoid a duplicate.')
            return 0
        if previous == version:
            print(f'Version {version} unchanged since {args.since}; nothing to announce.')
            return 0
    date, notes = release_notes((ROOT / 'CHANGELOG.md').read_text(), version)
    kind = detect_kind(url) if args.format == 'auto' else args.format
    body = payload(kind, version, args.channel, date, notes)
    if args.dry_run:
        print(json.dumps(body, indent=2, ensure_ascii=False))
        return 0
    status = post(url, body)
    print(f'Announced EgelTools {version} ({args.channel}) to the {kind} webhook: HTTP {status}')
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ValueError, OSError) as error:
        print(f'changelog-webhook: {error}', file=sys.stderr)
        sys.exit(1)
