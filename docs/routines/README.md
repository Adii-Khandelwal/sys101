# Setting up the What's new routine

The routine reads `docs/news-state.json`, looks at approved sites for three topics a run, and opens one pull request that changes only `content/news/**` and `docs/news-state.json`. A GitHub workflow (`.github/workflows/news-pr.yml`, check name `news-pr`) runs from the base branch, rejects anything else, and re-checks every item against its live page. The prompt is `docs/routines/whats-new.md`. Field names below follow the routine form as I know it; if a label differs, use the nearest one.

## Setup order

Do these in order. Each step needs the one before it.

1. **Push to `main`.** `pull_request_target` runs the workflow file from the pull request's base branch, which is `main`. Until the workflow, `scripts/news-guard.mjs` and the allowlist are on `main`, no pull request runs them, and the routine's first pull request would be checked by nothing.
2. **Wait for the Vercel build.** The push deploys the site. Confirm the build is green with the new checks before anything depends on it.
3. **Open any trivial pull request** (a typo fix in a doc) so the `news-pr` check exists, check that it passes at once, then require it in branch protection (section 1). GitHub only offers a check for requirement after it has run once.
4. **Create the environment and the routine** (sections 2 to 6). The environment comes first because the routine form asks for it, and its domain list must be right before the first run or every fetch fails.
5. **Run now**, by hand, with the schedule still off. You see one real run before any unattended one.
6. **Read the whole run and the pull request.** Every page it opened, every page it skipped and why, the table, the `news-pr` result. The checks do not prove a summary says what the page says (section 9); you are the check for that. Then turn the schedule on.
7. **Run the guard test** (section 7). It proves a `claude/` pull request with a forbidden file is blocked, before auto-merge exists to make that matter.
8. **Only then** set `NEWS_MODE` to `"auto"` and `NEWS_AUTOMERGE` to `true`, together (section 8). The pages say "reviewed by me" only in review mode, so the two must change as one.

## 1. Repository settings

1. Settings, Actions, General:
   - Actions enabled. Workflow permissions: **Read repository contents** (the workflow asks for write only in the auto-merge job).
   - Fork pull request workflows: keep "Require approval for first-time contributors" (or stricter).
2. Settings, Branches (or Rulesets), add a rule for `main`:
   - Require a pull request before merging, with **0 required approvals**.
   - Require status checks to pass, and add **`news-pr`** (after setup step 3).
   - Block direct pushes to `main`.
   - **Do not** tick "Require review from Code Owners" and do not require approvals.
3. Leave "Allow auto-merge" off until setup step 8.

### Why there is no code-owner or approval requirement

`.github/CODEOWNERS` lists `@Adii-Khandelwal` for `.github/**`, `scripts/**`, `lib/**`, `package.json`, `package-lock.json`, `vitest.config.ts`, `content/topics/**` and `content/learn/**`. The handle comes from the git remote:

```
origin	https://github.com/Adii-Khandelwal/sys101.git (fetch)
origin	https://github.com/Adii-Khandelwal/sys101.git (push)
```

With one owner it protects nothing. GitHub does not let an author approve their own pull request, and the routine's pull requests carry your GitHub identity, because it pushes and opens them through your connection. A required code-owner review or a required approval would block your own work and every routine pull request, with nobody else able to approve. The file stays as a record of who owns what, and so GitHub shows the owner on a pull request.

The controls that do work against a sole owner are:

- the `claude/` branch prefix: only a branch starting `claude/` can ever be auto-merged, and only one starting `claude/news-` is treated as a news pull request;
- the path guard, run from `main`'s copy: a news pull request may change only `content/news/**/*.json` and `docs/news-state.json`;
- the allowlist check: a `claude/` pull request may not change `allowedDomains`;
- the required `news-pr` check, which nothing but a passing run can satisfy.

Because routine pull requests look like yours, GitHub cannot tell them from a pull request you wrote. The branch name and the changed paths are the only way the workflow can.

## 2. Create the routine

| Field | Value |
|---|---|
| Name | sys101 What's new |
| Prompt | The text below the line in `docs/routines/whats-new.md`, pasted whole |
| Repository | this repository |
| Branch pushes | Only branches starting with `claude/`. Do not enable unrestricted branch pushes. |
| Environment | A new environment (section 3) |
| Connectors | None (section 4) |
| Trigger | Schedule (section 5) |

## 3. Environment and network access

- Node 24 (`.nvmrc`). If the environment has a setup script field, use `nvm install 24 && nvm use 24` or the image's Node 24 option.
- Network access: a custom allowlist, never "all". **Tick "Also include default list of common package managers"**: that is what lets `npm ci` reach the npm registry, and the routine fails without it.
- Then add these domains, one per line.

What the routine's own work needs:

```
github.com
api.github.com
fonts.googleapis.com
fonts.gstatic.com
archive.org
web.archive.org
```

`fonts.googleapis.com` and `fonts.gstatic.com` are for `npm run build`, which downloads the site's fonts. `archive.org` and `web.archive.org` are for `npm run verify:news` falling back to an archive copy of a page that blocks it (`netflixtechblog.com` normally does); such items are marked "verified from archive copy" in the pull request table.

The news sources, from `docs/news-state.json`, with the `www` variants the sites redirect to:

```
aws.amazon.com
bind9.readthedocs.io
blog.cloudflare.com
builder.aws.com
cassandra.apache.org
cloud.google.com
cockroachlabs.com
developer.mozilla.org
discord.com
dropbox.tech
engineering.atspotify.com
engineering.fb.com
engineering.grab.com
engineering.zalando.com
etcd.io
figma.com
github.blog
grpc.io
haproxy.com
istio.io
kafka.apache.org
kubernetes.io
lucene.apache.org
memcached.org
netflixtechblog.com
nginx.org
notion.com
postgresql.org
rabbitmq.com
redis.io
research.google
rfc-editor.org
slack.engineering
uber.com
valkey.io
web.dev
www.cockroachlabs.com
www.figma.com
www.haproxy.com
www.notion.com
www.postgresql.org
www.rabbitmq.com
www.rfc-editor.org
www.uber.com
```

Two of these are reached only through a redirect: `aws.amazon.com/builders-library/` goes to `builder.aws.com`, and `uber.com` paths go to locale paths that the Uber pattern `^/(blog/|[a-zA-Z]{2}/en/blog/|en-US/blog/)` covers.

When you change `allowedDomains`, update this list too, or the routine cannot open the new site. Re-derive the hosts with:
`node -e 'const s=require("./docs/news-state.json");console.log([...new Set(Object.values(s.allowedDomains).flat().map(e=>e.host))].sort().join("\n"))'`
and add the `www.` variant of any host that redirects to it.

## 4. Connectors

Remove every connector (Slack, Google Drive, email, issue trackers and the rest). The routine needs none, and each one is something a hostile page could try to talk it into using. Git access comes from the repository connection in section 2.

## 5. Schedule

Weekly, for example Mondays 07:00 UTC. It looks at 3 topics a run, so 18 topics are all covered every 6 weeks. Run it once by hand first and read the pull request before turning on the schedule.

## 6. What the workflow does

1. `pull_request_target` starts it, so the workflow file, `scripts/` and `package.json` are the ones on `main`. A pull request cannot change them for its own run.
2. It lists the pull request's files through the GitHub API (not from the pull request's checkout) and runs `scripts/news-guard.mjs`. A `claude/` branch that is named `claude/news-*` or touches a news path is a news pull request and may change only `content/news/**/*.json` and `docs/news-state.json`, renames included; anything else fails here, before any pull request file is on the runner. A pull request from any other branch is a news pull request only when it changes nothing but those files. One of yours that mixes news data with code (a schema change, for example) is not, so it passes at once with no automatic merge; you review it, and the Vercel build still runs `check-news` on it.
3. It checks the pull request out into `pr/`, refuses symlinks, copies only `content/news/` and `docs/news-state.json` into the base workspace, and deletes `pr/`. For `claude/` branches it also fails if `allowedDomains` differs from the base branch.
4. Only then does it install, build, test, run `check-news` and run `verify:news`, all from base code, reading the copied files as data.
5. The `news-automerge` job is skipped unless `NEWS_AUTOMERGE` is `true`, the branch is a same-repository `claude/` branch, and step 2 to 4 passed. It checks nothing out.

The token is read-only everywhere except `news-automerge`.

## 7. Before you ever enable auto-merge: the test pull request

Setup step 7. Do not set `NEWS_AUTOMERGE` until you have run this test on GitHub and seen it fail the way it should. It proves the guard blocks a pull request from a `claude/` branch that adds a file outside the allowed paths.

1. Make sure the workflow and `scripts/news-guard.mjs` are on `main` and the branch rule from section 1 is active. `NEWS_AUTOMERGE` must not exist yet.
2. In your clone:
   ```
   git switch main && git pull
   git switch -c claude/news-guard-test
   echo "guard test" > docs/guard-test.txt
   git add docs/guard-test.txt
   git commit -m "Guard test: a file outside the allowed paths"
   git push -u origin claude/news-guard-test
   gh pr create --base main --head claude/news-guard-test --title "Guard test (do not merge)" --body "Must fail news-pr."
   ```
3. Open the pull request's Checks tab. Expected:
   - `news-pr` **fails** at "Only news files may change", and the log lists `docs/guard-test.txt`. No later step runs (no `npm ci`, no build).
   - `news-automerge` does not run.
   - The merge button is blocked.
4. Repeat with a changed script, which is the case that matters most: `echo "// test" >> scripts/check-news.mjs`, commit, push to the same branch. Expected: `news-pr` fails again, listing both files. Confirm the log shows the guard ran from `main` (the guard step prints "Guard failed: ..." and nothing from the changed script runs).
5. Clean up: `gh pr close claude/news-guard-test --delete-branch`.
6. If `news-pr` passes at step 3 or 4, stop. Do not enable auto-merge, and open an issue with the logs.

## 8. Turn on auto-merge (optional, only after section 7 passed)

Do both parts together, in this order:

1. In `lib/site.ts` set `NEWS_MODE = "auto"` and commit it to `main` (through a pull request). Pages and About then stop saying "reviewed by me".
2. Settings, General, Pull Requests: tick "Allow auto-merge". Settings, Secrets and variables, Actions, Variables: add `NEWS_AUTOMERGE` = `true`.

From then on `news-automerge` runs `gh pr merge --auto --squash` for same-repository `claude/` pull requests whose `news-pr` check passed, and GitHub merges when the required checks are green.

To turn it off, reverse the order: delete the variable (or set it to anything but `true`), then set `NEWS_MODE` back to `"review"`.

## 9. What the checks do and do not prove

They prove each URL is https and inside the topic's allowlist (including after redirects), the item's publisher and kind match the entry, the date shown is on the page, the evidence phrase is in the page text, the summary follows the format and credits the source for any figure or comparison, and nothing outside the two paths changed. They do not prove the summary says what the page says, that the page is worth a reader's time, or that a `builder.aws.com` page is written by AWS (the routine prompt tells it to skip those that are not; nothing checks it). That is why `NEWS_MODE` defaults to "review".

## 10. When something goes wrong

- `news-pr` fails on "also changes": the routine edited a path it should not. Close the pull request.
- `news-pr` fails on "allowedDomains differs": only a person edits the allowlist, in a pull request that is not a `claude/` branch.
- `verify:news` fails on one item: the page changed, moved or blocks the runner. Edit or delete that item by hand, or close the pull request; the next run starts fresh.
- The routine could not push: check that branch pushes are allowed for `claude/` branches and that the repository connection has write access.
- A bad item reached `main`: delete it from `content/news/<slug>.json` and push the change.
