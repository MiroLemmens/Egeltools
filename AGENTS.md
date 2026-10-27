# Project instructions for ChatGPT / Codex

## Conversation branches

- Use `dev` as the integration branch for this repository (`https://github.com/MiroLemmens/Egeltools.git`).
- At the start of each new conversation, fetch `origin` and create a unique `feature/<short-task-name>-<unique-suffix>` branch from `origin/dev` before editing project files. Reuse that conversation's branch for follow-up work; create its branch even when the conversation starts with read-only work.
- Keep concurrent conversations in separate worktrees. Preserve existing local changes and use a separate worktree when switching branches would interfere with another conversation or unrelated work.
- After completing changes, run relevant checks, commit only the conversation's changes, and push its feature branch. Merge the latest `origin/dev` into the feature branch and resolve conflicts, rerunning affected checks if integration changes the result.
- Automatically merge the completed feature branch into `dev` and push `dev` to `origin`; this is authorized and requires no routine confirmation. Use a clean integration worktree when needed, preserve concurrent changes, and retry integration if `origin/dev` advances. Keep `main` unchanged unless explicitly requested.
- Deploy the merged result using the release instructions below. Verify that the feature commit is included in remote `dev` and deployment succeeds before reporting completion. Report any unresolved merge, push, or deployment blocker explicitly.

## Deployment

Always deploy after completing changes to this project. Deployment is part of the task and is authorized by this project instruction; do not stop after local edits or ask for routine deployment confirmation.

- Follow the release process in `README.md`.
- When changing `EgelTools.user.js`, bump both `@version` and `APP.version` to the same new version and add release notes to `CHANGELOG.md`.
- Run checks relevant to the changes, then run `scripts/deploy.sh` from the project root, including after documentation or instruction changes. Reuse the current version when the userscript itself is unchanged.
- Confirm that deployment succeeds before reporting the task complete. If deployment fails, resolve the failure when possible; otherwise clearly report the blocker and that deployment is incomplete.
- Preserve immutable published releases; never overwrite an existing release with different content.
