# Project instructions for ChatGPT / Codex

## Conversation branches

- Use `dev` as the integration branch for this repository (`https://github.com/MiroLemmens/Egeltools.git`).
- At the start of each new conversation, fetch `origin` and create a unique `feature/<short-task-name>-<unique-suffix>` branch from `origin/dev` before editing project files. Reuse that conversation's branch while its PR remains unmerged; after cleanup, create a new unique feature branch from the latest `origin/dev` for follow-up work. Create a branch even when the conversation starts with read-only work.
- Keep concurrent conversations in separate worktrees. Preserve existing local changes and use a separate worktree when switching branches would interfere with another conversation or unrelated work.
- After completing changes, run relevant checks, commit only the conversation's changes, and push its feature branch. Merge the latest `origin/dev` into the feature branch and resolve conflicts, rerunning affected checks if integration changes the result.
- Open a GitHub pull request from the conversation's feature branch into `dev`, or update its existing open PR. Include a concise summary and validation evidence. For follow-up work after a merged PR, open a new PR from the new feature branch.
- Integrate every change into `dev` through its PR; do not directly push or locally merge changes into `dev`. Automatically merge the PR when relevant checks pass and required reviews are satisfied; this is authorized and requires no routine confirmation. Enable GitHub auto-merge while required checks or reviews are pending when available, and report the pending status until the PR actually merges. Respect branch protections without bypassing required checks or reviews. If conflicts or an advancing `origin/dev` prevent merging, update the feature branch, resolve conflicts, rerun affected checks, and push the update. Keep `main` unchanged unless explicitly requested.
- After GitHub confirms the PR is merged, fetch `origin/dev` and deploy the merged result using the release instructions below. Verify the PR's merge commit is included in remote `dev` and deployment succeeds before reporting completion. Include the PR link and report any unresolved review, check, merge, push, or deployment blocker explicitly.

- After confirming the PR is merged and its changes are present in `origin/dev`, delete its feature branch both remotely and locally. Switch the local checkout to up-to-date `dev` before deleting the local branch. Preserve uncommitted work and any commits added after the PR merged; verify the remote branch still points to the merged head before deleting it. Release an associated worktree only when its work is preserved and it is no longer in use. Verify both branch references are gone, and report any cleanup blocker. Branch deletion is authorized without routine confirmation.

## Deployment

Always deploy after completing changes to this project. Deployment is part of the task and is authorized by this project instruction; do not stop after local edits or ask for routine deployment confirmation.

- Follow the release process in `README.md`.
- When changing `EgelTools.user.js`, bump both `@version` and `APP.version` to the same new version and add release notes to `CHANGELOG.md`.
- Run checks relevant to the changes, then run `scripts/deploy.sh` from the project root, including after documentation or instruction changes. Reuse the current version when the userscript itself is unchanged.
- Confirm that deployment succeeds before reporting the task complete. If deployment fails, resolve the failure when possible; otherwise clearly report the blocker and that deployment is incomplete.
- Preserve immutable published releases; never overwrite an existing release with different content.
