# Setting up the What's new routine

The routine reads `docs/news-state.json`, looks at approved sites for three topics a run, and opens one pull request that changes only `content/news/**` and `docs/news-state.json`. A GitHub workflow (`.github/workflows/news-pr.yml`, check name `news-pr`) rejects anything else and re-checks every item against its live page. The prompt is `docs/routines/whats-new.md`. Field names below follow the routine form as I know it; if a label differs, use the nearest one.

## 1. Repository settings (once)

1. Settings, Actions, General: Actions enabled; workflow permissions can stay "Read repository contents" (the workflow asks for more where it needs it).
2. Settings, Branches (or Rulesets), add a rule for `main`:
   - Require a pull request before merging.
   - Require status checks to pass, and add **`news-pr`** (it appears in the list after the workflow has run once; open any pull request to make it appear).
   - Do not allow bypassing, and block direct pushes to `main`.
   `news-pr` runs on every pull request and passes at once on ordinary ones, so requiring it never leaves other pull requests pending.
3. Leave "Allow auto-merge" off for now (section 6).

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
- Network access: restrict it to an allowlist of domains, never "all". The routine needs:
  - `github.com`, `api.github.com` (clone, push, pull request)
  - `registry.npmjs.org` (`npm ci`)
  - `fonts.googleapis.com`, `fonts.gstatic.com` (the build downloads the site's fonts)
  - `archive.org`, `web.archive.org` (`verify:news` falls back to an archive copy of a page that blocks it)
  - every host in `docs/news-state.json`. Print them with:
    `node -e 'const s=require("./docs/news-state.json");console.log([...new Set(Object.values(s.allowedDomains).flat().map(e=>e.split("/")[0]))].sort().join("\n"))'`
- When you change `allowedDomains`, update this list too, or the routine cannot open the new site.

## 4. Connectors

Remove every connector (Slack, Google Drive, email, issue trackers and the rest). The routine needs none, and each one is something a hostile page could try to talk it into using. Git access comes from the repository connection in section 2.

## 5. Schedule

Weekly, for example Mondays 07:00 UTC. It looks at 3 topics a run, so 18 topics are all covered every 6 weeks. Run it once by hand first and read the pull request before turning on the schedule.

## 6. Turn on auto-merge (optional, later)

Do this only when you trust the pull requests enough to stop reading them. Do both parts together, in this order:

1. In `lib/site.ts` set `NEWS_MODE = "auto"` and commit it to `main` (through a pull request). Pages and About then stop saying "reviewed by me".
2. Settings, General, Pull Requests: tick "Allow auto-merge". Settings, Secrets and variables, Actions, Variables: add `NEWS_AUTOMERGE` = `true`.

From then on the `news-automerge` job runs `gh pr merge --auto --squash` for same-repository `claude/` pull requests whose `news-pr` check passed, and GitHub merges when the required checks are green.

To turn it off, reverse the order: delete the variable (or set it to anything but `true`), then set `NEWS_MODE` back to `"review"`.

## 7. What the checks do and do not prove

They prove each URL is https and inside the topic's allowlist (including after redirects), the date shown is on the page, the evidence phrase is in the page text, the summary follows the format and credits the source for any figure or comparison, and nothing outside the two paths changed. They do not prove the summary says what the page says, or that the page is worth a reader's time. That is why `NEWS_MODE` defaults to "review".

## 8. When something goes wrong

- `news-pr` fails on "also changes": the routine edited a path it should not. Close the pull request.
- `verify:news` fails on one item: the page changed, moved or blocks the runner. Edit or delete that item by hand, or close the pull request; the next run starts fresh.
- The routine could not push: check that branch pushes are allowed for `claude/` branches and that the repository connection has write access.
- A bad item reached `main`: delete it from `content/news/<slug>.json` and push the change. Nothing else depends on it.
