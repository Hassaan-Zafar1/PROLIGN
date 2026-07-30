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

if (!EMAIL || !TOKEN || !SITE) {
  console.error('Missing required credentials. Set JIRA_EMAIL, JIRA_TOKEN, JIRA_SITE either as env vars or in qa/scripts/.env.jira (see .env.jira.example).');
  process.exit(1);
}

const AUTH = 'Basic ' + Buffer.from(`${EMAIL}:${TOKEN}`).toString('base64');

const [, , issueKey, ...filePaths] = process.argv;

if (!issueKey || filePaths.length === 0) {
  console.error('Usage: node attach_jira_files.mjs <ISSUE-KEY> <file1> [file2 ...]');
  process.exit(1);
}

// The Atlassian MCP tool set has no attachment-upload tool — this fills that one gap via
// real Jira REST. The attachments endpoint requires X-Atlassian-Token: no-check (it rejects
// requests without it as a CSRF precaution) and returns 200 with a JSON array on success,
// unlike issue creation's 201.
async function attachFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { ok: false, filePath, error: 'File not found' };
  }
  const buffer = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  const form = new FormData();
  form.append('file', new Blob([buffer]), filename);

  const res = await fetch(`${SITE}/rest/api/3/issue/${issueKey}/attachments`, {
    method: 'POST',
    headers: {
      Authorization: AUTH,
      Accept: 'application/json',
      'X-Atlassian-Token': 'no-check',
    },
    body: form,
  });

  if (res.status !== 200) {
    const errBody = await res.text().catch(() => '');
    return { ok: false, filePath, status: res.status, error: errBody };
  }
  const body = await res.json().catch(() => []);
  return { ok: true, filePath, status: res.status, attachmentId: body[0]?.id, filename: body[0]?.filename };
}

async function main() {
  console.log(`Attaching ${filePaths.length} file(s) to ${issueKey}...`);
  const results = [];
  for (const filePath of filePaths) {
    const r = await attachFile(filePath);
    results.push(r);
    console.log(r.ok
      ? `OK — ${filePath} (attachment id ${r.attachmentId})`
      : `FAIL — ${filePath} — ${r.error || r.status}`);
  }

  const failed = results.filter(r => !r.ok);
  if (failed.length) {
    console.error(`\n${failed.length}/${filePaths.length} attachment(s) failed.`);
    process.exit(1);
  }
  console.log(`\nAll ${filePaths.length} file(s) attached successfully to ${issueKey}.`);
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
