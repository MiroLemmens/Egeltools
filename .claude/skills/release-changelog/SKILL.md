---
name: release-changelog
description: Write a readable, player-facing CHANGELOG.md entry for an EgelTools userscript update and announce it through the changelog webhook. Use for every userscript version bump (any change to EgelTools.user.js), when asked to write release notes or a changelog, or to (re)announce a release to the webhook.
---

# Release changelog

Every EgelTools update gets a changelog entry players can read, and that entry is announced on the changelog webhook (Discord, Slack or any JSON endpoint). `scripts/changelog-webhook.py` posts one `CHANGELOG.md` section; this skill covers writing that section and getting it published.

## 1. Gather what changed

- Previous release: the top `## <version>` heading in `CHANGELOG.md` on `origin/dev`.
- Changes since then: `git log --oneline origin/dev..HEAD` and `git diff origin/dev -- EgelTools.user.js`. For a release that is already merged, find the commit that introduced the previous version (`git log -S"@version      <old>" --oneline -- EgelTools.user.js`) and diff from there.
- Read the diff, not only the commit subjects; subjects are often terse or developer-facing.

## 2. Bump the version

Bump `// @version` and `APP.version` in `EgelTools.user.js` to the same new version, past whatever `origin/dev` already has (parallel sessions take versions quickly). Documentation-only changes reuse the current version and get no new entry.

## 3. Write the entry

Insert a new section directly under the intro paragraph of `CHANGELOG.md`, newest first:

```markdown
## 1.2.98 — 2026-11-01

- Fix ... (what was broken, as the player saw it, and what happens now).
- Add **Feature name** to ...: what it does and where to find it.
```

Style, matching the existing entries:

- Write for Grepolis players, not developers: describe what they see and do (windows, buttons, alarms, settings), never function names, models, selectors, refactors or tests.
- One bullet per visible change, each a complete sentence or two starting with a verb: Add, Fix, Show, Remove, Bring back, Sending … no longer ….
- Bold the UI names a player would look for (**Party trades**, **Settings → Town distances**, **Dismiss alarm**).
- Fixes say what went wrong in play and what works again; mention the version that introduced a regression when known.
- Leave out internal-only changes. If nothing in the release is player-visible, write one short bullet such as "Internal fixes and reliability improvements."
- Date is today's date in ISO form, separated by an em dash. Keep the heading exactly `## <version> — <YYYY-MM-DD>`; the webhook script parses it.
- Keep the entry short enough to read in a chat message: usually 1–5 bullets.

Preview exactly what will be posted:

```bash
python3 scripts/changelog-webhook.py --dry-run --format discord
```

The script fails if `@version` and `APP.version` differ, or if the section is missing or has no bullets.

## 4. Publish

Commit the entry with the userscript change and merge it into `dev` through the normal PR flow in `CLAUDE.md`.

The **Publish userscript** Action announces the release on its own after a successful publish when the repository secret `CHANGELOG_WEBHOOK_URL` is set: it posts only when the push changed the userscript version, so documentation-only pushes and retries do not repeat an announcement. Check the Action's **Announce changelog** step.

Announce by hand only when that step did not run (secret missing, manual run, failed step) or the user asks for a repost, and only after the release is live at `https://files.miro23.uk/egeltools/<channel>/deployment.json`:

```bash
python3 scripts/changelog-webhook.py --channel dev
```

The webhook URL comes from `EGELTOOLS_CHANGELOG_WEBHOOK` or `~/.config/egeltools/changelog-webhook`. It is a secret: never commit it, print it, or pass it on the command line. `--version <x.y.z>` reposts an older section; `--format` overrides the auto-detected Discord/Slack/generic payload. Posting is a public message, so confirm with the user before a manual post that repeats one already sent.
