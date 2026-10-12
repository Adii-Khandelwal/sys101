# Setting up the What's new routine

The routine reads `docs/news-state.json`, looks at approved sites for three topics a run, and opens one pull request that changes only `content/news/**` and `docs/news-state.json`. A GitHub workflow (`.github/workflows/news-pr.yml`, check name `news-pr`) runs from the base branch, rejects anything else, and re-checks every item against its live page. The prompt is `docs/routines/whats-new.md`. Field names below follow the routine form as I know it; if a label differs, use the nearest one.

## 1. Repository settings (once, before the routine exists)

Merge this hardening to `main` first, so the workflow, the guard script and CODEOWNERS are the base copies every later pull request is judged by.

1. Settings, Actions, General:
   - Actions enabled. Workflow permissions: **Read repository contents** (the workflow asks for write only in the auto-merge job).
   - Fork pull request workflows: keep "Require approval for first-time contributors" (or stricter).
2. Settings, Branches (or Rulesets), add a rule for `main`:
   - Require a pull request before merging, with at least 1 approval.
   - **Require review from Code Owners**. `.github/CODEOWNERS` names you for `.github/**`, `scripts/**`, `lib/**`, `package.json`, `package-lock.json`, `vitest.config.ts`, `content/topics/**` and `content/learn/**`. The routine's pull requests touch none of these, so they are not held up by it.
   - Require status checks to pass, and add **`news-pr`**. It appears in the list after the workflow has run once. It runs on every pull request and passes at once on ordinary ones, so requiring it never leaves other pull requests pending.
   - Block direct pushes to `main`, and do not let anyone, admins included, bypass the rule while the routine is switched on.
   - GitHub does not let an author approve their own pull request. If you open a pull request that touches a code-owner path, you need a second reviewer or account, or you must temporarily allow admin bypass for that one merge. The routine's pull requests are unaffected.
3. Leave "Allow auto-merge" off for now (section 8).

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
- Network access: restrict it to an allowlist of domains, never "all". Paste these as "Allowed domains", one per line.

Infrastructure (clone, push, `npm ci`, the build's font download, archive fallback for pages that block the checker):

```
github.com
api.github.com
registry.npmjs.org
fonts.googleapis.com
fonts.gstatic.com
archive.org
web.archive.org
```

News sources, from `docs/news-state.json`, with the `www` variants the sites redirect to:

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

Two of these are reached only through a redirect: `aws.amazon.com/builders-library/` goes to `builder.aws.com`, and `uber.com/blog/` goes to a locale path (`/in/en/blog/` from the machine I tested on) that the Uber entries do not cover, so the check refuses it. The three other Uber paths redirect to `/us/en/blog/`, which is covered. `netflixtechblog.com` refuses plain requests, so its items are normally verified from an archive copy and say so in the pull request table.

- When you change `allowedDomains`, update this list too, or the routine cannot open the new site. Re-derive it with:
  `node -e 'const s=require("./docs/news-state.json");console.log([...new Set(Object.values(s.allowedDomains).flat().map(e=>e.host))].sort().join("\n"))'`
  and add the `www.` variant of any host that redirects to it.

## 4. Connectors

Remove every connector (Slack, Google Drive, email, issue trackers and the rest). The routine needs none, and each one is something a hostile page could try to talk it into using. Git access comes from the repository connection in section 2.

## 5. Schedule

Weekly, for example Mondays 07:00 UTC. It looks at 3 topics a run, so 18 topics are all covered every 6 weeks. Run it once by hand first and read the pull request before turning on the schedule.

## 6. What the workflow does

1. `pull_request_target` starts it, so the workflow file, `scripts/` and `package.json` are the ones on `main`. A pull request cannot change them for its own run.
2. It lists the pull request's files through the GitHub API (not from the pull request's checkout) and runs `scripts/news-guard.mjs`. A pull request that touches a news path or comes from a `claude/news-*` branch may change only `content/news/**/*.json` and `docs/news-state.json`, renames included. Anything else fails here, before any pull request file is on the runner.
3. It checks the pull request out into `pr/`, refuses symlinks, copies only `content/news/` and `docs/news-state.json` into the base workspace, and deletes `pr/`. For `claude/` branches it also fails if `allowedDomains` differs from the base branch.
4. Only then does it install, build, test, run `check-news` and run `verify:news`, all from base code, reading the copied files as data.
5. The `news-automerge` job is skipped unless `NEWS_AUTOMERGE` is `true`, the branch is a same-repository `claude/` branch, and step 2 to 4 passed. It checks nothing out.

The token is read-only everywhere except `news-automerge`.

## 7. Before you ever enable auto-merge: the test pull request

Do not set `NEWS_AUTOMERGE` until you have run this test on GitHub and seen it fail the way it should. It proves the guard blocks a pull request from a `claude/` branch that adds a file outside the allowed paths.

1. Make sure the hardening (workflow, `scripts/news-guard.mjs`, CODEOWNERS) is on `main` and the branch rule from section 1 is active. `NEWS_AUTOMERGE` must not exist yet.
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
4. Repeat with a changed script, which is the case that matters most: `echo "// test" >> scripts/check-news.mjs`, commit, push to the same branch. Expected: `news-pr` fails again, listing both files; the pull request also asks for a Code Owner review. Confirm the log shows the guard ran from `main` (the guard step prints "Guard failed: ..." and nothing from the changed script runs).
5. Clean up: `gh pr close claude/news-guard-test --delete-branch`.
6. If `news-pr` passes at step 3 or 4, stop. Do not enable auto-merge, and open an issue with the logs.

## 8. Turn on auto-merge (optional, only after section 7 passed)

Do both parts together, in this order:

1. In `lib/site.ts` set `NEWS_MODE = "auto"` and commit it to `main` (through a pull request that you review). Pages and About then stop saying "reviewed by me".
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
