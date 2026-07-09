#!/usr/bin/env node
/**
 * Reads Playwright's JSON reporter output, maps each [TC-xxx]-tagged test to its
 * linked Jira issue (via jira_issue_mapping.json, produced by the test-case-generator
 * app's Jira push step), and updates each issue with a comment + status transition
 * reflecting the real pass/fail/skip result of the automated run.
 *
 * Usage:
 *   JIRA_BASE_URL=... JIRA_EMAIL=... JIRA_API_TOKEN=... \
 *   node scripts/report-to-jira.js test-results/results.json path/to/jira_issue_mapping.json
 *
 * Transition names below assume a standard "To Do / In Progress / Done" workflow.
 * Adjust PASS_TRANSITION / FAIL_TRANSITION to match your project's actual workflow
 * (inspect available transitions via GET /rest/api/3/issue/{key}/transitions first).
 */
const fs = require('fs');
const axios = require('axios');

const PASS_TRANSITION = process.env.JIRA_PASS_TRANSITION || 'Done';
const FAIL_TRANSITION = process.env.JIRA_FAIL_TRANSITION || 'In Progress';

function jiraClient() {
  const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    throw new Error('JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN environment variables are required');
  }
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  return axios.create({
    baseURL: `${JIRA_BASE_URL.replace(/\/$/, '')}/rest/api/3`,
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
  });
}

function extractResults(playwrightJson) {
  // Playwright JSON reporter: suites[].specs[].tests[].results[]
  const results = [];
  function walk(suite) {
    for (const spec of suite.specs || []) {
      const match = spec.title.match(/\[TC-(\d+)\]/);
      if (!match) continue;
      const testCaseId = `TC-${match[1]}`;
      const outcome = spec.tests?.[0]?.results?.[0]?.status || spec.tests?.[0]?.status || 'unknown';
      results.push({ testCaseId, title: spec.title, outcome });
    }
    for (const child of suite.suites || []) walk(child);
  }
  for (const suite of playwrightJson.suites || []) walk(suite);
  return results;
}

async function transitionTo(jira, issueKey, targetStatusName, commentText) {
  await jira.post(`/issue/${issueKey}/comment`, {
    body: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: commentText }] }] },
  });

  const { data } = await jira.get(`/issue/${issueKey}/transitions`);
  const transition = data.transitions.find((t) => t.name.toLowerCase() === targetStatusName.toLowerCase());
  if (!transition) {
    console.warn(`  ! No transition named "${targetStatusName}" available for ${issueKey} (has: ${data.transitions.map((t) => t.name).join(', ')})`);
    return;
  }
  await jira.post(`/issue/${issueKey}/transitions`, { transition: { id: transition.id } });
}

async function main() {
  const [resultsPath, mappingPath] = process.argv.slice(2);
  if (!resultsPath || !mappingPath) {
    console.error('Usage: node scripts/report-to-jira.js <playwright-results.json> <jira_issue_mapping.json>');
    process.exit(1);
  }

  const playwrightJson = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
  const mappingFile = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
  const mapping = new Map(mappingFile.mapping.map((m) => [m.testCaseId, m.issueKey]));

  const results = extractResults(playwrightJson);
  const jira = jiraClient();
  const timestamp = new Date().toISOString();

  for (const r of results) {
    const issueKey = mapping.get(r.testCaseId);
    if (!issueKey) {
      console.warn(`No Jira mapping for ${r.testCaseId}, skipping`);
      continue;
    }

    const passed = r.outcome === 'passed';
    const comment = `Automated Playwright run (${timestamp}): ${r.outcome.toUpperCase()} — "${r.title}"`;
    console.log(`${issueKey} (${r.testCaseId}): ${r.outcome}`);

    try {
      await transitionTo(jira, issueKey, passed ? PASS_TRANSITION : FAIL_TRANSITION, comment);
    } catch (err) {
      console.error(`  ! Failed to update ${issueKey}: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
