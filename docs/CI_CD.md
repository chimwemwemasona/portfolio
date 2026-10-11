# GitHub Actions deployment

Workflow: `.github/workflows/deploy.yml`.
Live URL: https://95.217.214.201/

## Flow

Pull requests to main run validation only. Pushes to main run validation and deployment. The workflow can also be run manually on main. Validation checks HTML assets/anchors, project details/order, JavaScript syntax, CSS integrity, packaging, and deployment artifact/rollback behavior. The checkout action is pinned to a commit SHA.

The deploy job packages `dist/` with its commit SHA and per-file SHA-256 checksums. It streams the archive over SSH to a restricted server command. No SCP, arbitrary shell, port forwarding, or PTY is permitted for the Actions key. SSH verifies the committed server host key.

The installed `server_deploy.py` rejects unsafe paths, symlinks, duplicate files, oversized archives, and checksum mismatches. It locks deployment, confirms the commit is still GitHub main, writes a versioned release, and atomically switches `current`. It verifies all public HTTPS assets using the self-signed certificate as its trust anchor and checks Twin Palm. Failed verification restores the previous release and fails the Actions job. GitHub concurrency serializes production runs; stale commits are also rejected server-side.

## Required one-time repository secret

Set **PORTFOLIO_DEPLOY_KEY** at https://github.com/chimwemwemasona/portfolio/settings/secrets/actions.

Use the dedicated private key generated locally at `.cache/github-actions-deploy`. The matching public key is installed on the server with a forced deploy command and SSH restrictions. The private key is ignored by Git and must be pasted only into GitHub's secret field. It is separate from the broader local administration key. Do not put passwords or key contents in commits, issue bodies, logs, or chat messages.

After adding the secret, rerun the latest failed deployment job from the Actions tab or manually run the workflow on main. An empty secret makes the deployment job fail with a clear setup message; validation remains independently visible.

The connector available during setup can write source and read/rerun Actions, but cannot create repository Actions secrets. The secret has now been configured and the deployment job completed successfully.

## Server-installed handler

Installed at `/home/chimwemwe/apps/chimwemwe-portfolio/server_deploy.py`, outside `current` and outside the public root. The forced key accepts only `deploy <40-character-sha>`, with the artifact on stdin. Workflow pushes deploy static content only. Infrastructure and handler changes require a separate administrative SSH update; they are not automatically applied from an artifact.

`deployment.json` on the server records the active commit, previous release, URL, and timestamp. Retain prior releases for rollback. The public GitHub main-ref check uses the unauthenticated API once per deployment; transient API failures leave the active release unchanged.

## Evidence

- Eight deployment-validation tests passed on Ubuntu, including rollback after failed verification and rejection of stale commits.
- A real archive deployed successfully through the restricted Actions key, with all live files verified.
- The Actions key was tested and cannot run a general shell command.
- GitHub Actions run https://github.com/chimwemwemasona/portfolio/actions/runs/38163752389 (attempt 2) passed both validation and deployment. The server manifest independently confirmed deployed commit `6d72eafe697394ae0eeb884cc97231c6eb3e9f7f`.
- HTTPS content, certificate IP verification, the HTTP redirect, and Twin Palm availability were checked again after the Actions deployment.

Reference: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
