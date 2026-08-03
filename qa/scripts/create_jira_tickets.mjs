import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load qa/scripts/.env.jira if present — never overrides real env vars that are already set.
const envFile = path.join(__dirname, '.env.jira');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

const EMAIL = process.env.JIRA_EMAIL;
const TOKEN = process.env.JIRA_TOKEN;
const SITE = process.env.JIRA_SITE;
const PROJECT_KEY = process.env.JIRA_PROJECT_KEY || 'PRO';
const CSV_PATH = process.env.BUGS_CSV || path.join(__dirname, '..', 'bugs_jira_import.csv');
const RESULTS_OUT = process.env.RESULTS_OUT || path.join(__dirname, '..', 'jira_create_results.json');

if (!EMAIL || !TOKEN || !SITE) {
  console.error('Missing required credentials. Set JIRA_EMAIL, JIRA_TOKEN, JIRA_SITE either as env vars or in qa/scripts/.env.jira (see .env.jira.example).');
  process.exit(1);
}

const AUTH = 'Basic ' + Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64');

const SEVERITY_TO_PRIORITY = {
  Critical: 'Highest',
  High: 'High',
  Medium: 'Medium',
  Low: 'Low',
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows[0];
  return rows.slice(1).filter(r => r.length === header.length && r.some(v => v !== '')).map(r => {
    const obj = {};
    header.forEach((h, idx) => { obj[h] = r[idx]; });
    return obj;
  });
}

function buildDescriptionADF(bug) {
  const section = (heading, text) => ([
    { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: heading }] },
    { type: 'paragraph', content: [{ type: 'text', text: text || 'N/A' }] },
  ]);
  return {
    type: 'doc',
    version: 1,
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: bug.description || 'N/A' }] },
      ...section('Steps to Reproduce', bug.steps_to_reproduce),
      ...section('Expected', bug.expected),
      ...section('Actual', bug.actual),
    ],
  };
}

function buildLabels(bug) {
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return [norm(bug.component), norm(bug.severity), 'qa-bulk-import-2026-07'];
}

async function createIssue(bug) {
  const payload = {
    fields: {
      project: { key: PROJECT_KEY },
      issuetype: { name: 'Bug' },
      summary: bug.title,
      description: buildDescriptionADF(bug),
      priority: { name: SEVERITY_TO_PRIORITY[bug.severity] || 'Medium' },
      labels: buildLabels(bug),
    },
  };
  const res = await fetch(`${SITE}/rest/api/3/issue`, {
    method: 'POST',
    headers: { Authorization: AUTH, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status !== 201) {
    return { ok: false, title: bug.title, status: res.status, error: JSON.stringify(body) };
  }
  return { ok: true, title: bug.title, key: body.key, id: body.id, status: bug.status };
}

async function transitionToDone(issueKey) {
  const res = await fetch(`${SITE}/rest/api/3/issue/${issueKey}/transitions`, {
    headers: { Authorization: AUTH, Accept: 'application/json' },
  });
  const data = await res.json();
  const match = (data.transitions || []).find(t => /^(done|resolved|closed)$/i.test(t.name));
  if (!match) return { ok: false, reason: 'no matching transition', available: (data.transitions || []).map(t => t.name) };
  const tRes = await fetch(`${SITE}/rest/api/3/issue/${issueKey}/transitions`, {
    method: 'POST',
    headers: { Authorization: AUTH, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ transition: { id: match.id } }),
  });
  return { ok: tRes.status === 204, transitionName: match.name, status: tRes.status };
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const csvText = fs.readFileSync(CSV_PATH, 'utf-8');
  const bugs = parseCsv(csvText);
  console.log(`Parsed ${bugs.length} bug rows from CSV.`);

  const results = [];
  for (let i = 0; i < bugs.length; i++) {
    const bug = bugs[i];
    try {
      const r = await createIssue(bug);
      results.push(r);
      console.log(`[${i + 1}/${bugs.length}] ${r.ok ? 'OK ' + r.key : 'FAIL'} — ${bug.title}`);
    } catch (e) {
      results.push({ ok: false, title: bug.title, error: String(e) });
      console.log(`[${i + 1}/${bugs.length}] FAIL (exception) — ${bug.title}`);
    }
    await sleep(250);
  }

  const created = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);

  console.log(`\nCreated: ${created.length}/${bugs.length}. Failed: ${failed.length}.`);
  if (failed.length) {
    console.log('\n--- FAILURES ---');
    failed.forEach(f => console.log(f.title, '->', f.error || f.status));
  }

  const resolvedOnes = created.filter(r => r.status === 'Resolved');
  console.log(`\nTransitioning ${resolvedOnes.length} Resolved-tagged tickets...`);
  const transitionResults = [];
  for (const r of resolvedOnes) {
    const t = await transitionToDone(r.key);
    transitionResults.push({ key: r.key, ...t });
    console.log(`${r.key}: ${t.ok ? 'moved to ' + t.transitionName : 'left as-is (' + (t.reason || t.status) + ')'}`);
    await sleep(250);
  }

  fs.writeFileSync(RESULTS_OUT, JSON.stringify({ results, transitionResults }, null, 2));
  console.log(`\nFull results written to ${RESULTS_OUT}`);
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
