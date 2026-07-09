# Claims Processing — E2E Test Suite (Playwright)

Automated UI + API tests for the Claims Processing app, mapped 1:1 to the test cases generated
from the BRD (see `testcase-generator/sample-output/testcases_claims_processing.json`) and pushed
to Jira (see `jira_issue_mapping.json`). Every test title is tagged `[TC-xxx]` so results can be
correlated back to their Jira issue automatically.

## Setup

```bash
cd e2e
npm install
npx playwright install chromium   # downloads a browser binary; needs normal internet access
```

## Running

```bash
npm test                 # starts backend + frontend automatically, runs the full suite headless
npm run test:headed      # same, but shows the browser
npm run report           # opens the HTML report from the last run
```

If you already have the backend (`:4000`) and frontend (`:5173`) running, skip the auto-start:

```bash
SKIP_WEBSERVER=1 npm test
```

Tests run **serially** (`workers: 1`) because the backend is an in-memory store shared across
requests with no per-test reset endpoint — parallel runs would race on claim numbering / totals.

## Coverage

| Spec file | Test cases |
|---|---|
| `policy-search.spec.js` | TC-001, TC-002, TC-003 |
| `claim-submission.spec.js` | TC-004 – TC-009 |
| `adjudication.spec.js` | TC-010 – TC-016 |
| `access-control.spec.js` | TC-017, TC-018, TC-022 |
| `dashboard.spec.js` | TC-019 |
| `claims-list.spec.js` | TC-020 |
| `approval-queue.spec.js` | TC-021 |

## Reporting results back to Jira

After a run, `test-results/results.json` (Playwright's JSON reporter output) can be fed into
`scripts/report-to-jira.js`, which comments on and transitions each linked Jira issue based on
the **actual** pass/fail outcome:

```bash
JIRA_BASE_URL=https://your-domain.atlassian.net \
JIRA_EMAIL=you@example.com \
JIRA_API_TOKEN=... \
node scripts/report-to-jira.js test-results/results.json \
  ../testcase-generator/sample-output/jira_issue_mapping.json
```

By default it transitions passing tests to "Done" and failing tests to "In Progress" — adjust
`JIRA_PASS_TRANSITION` / `JIRA_FAIL_TRANSITION` env vars to match your project's actual workflow
status names (check with `GET /rest/api/3/issue/{key}/transitions` first).

**Note:** this script only reports genuine execution results — it will not run unless a real
Playwright run has produced `results.json`, so Jira never gets a fabricated pass/fail.
