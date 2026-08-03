import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..', '..');

// Cross-platform wrapper: run a test command, and only if it FAILS, invoke Claude
// Code headlessly to run the test-failure-triage skill against the fresh report.
// Skips triage entirely on a clean pass — no need to spend a Claude Code call
// analyzing a report with nothing to triage.
const [, , layer, testCmd, ...testArgs] = process.argv;

if (!layer || !testCmd) {
  console.error('Usage: node run_tests_and_triage.mjs <layer> <test-command> [args...]');
  console.error('Example: node run_tests_and_triage.mjs e2e npx playwright test');
  process.exit(1);
}

console.log(`\n> Running: ${testCmd} ${testArgs.join(' ')}\n`);
const testResult = spawnSync(testCmd, testArgs, { stdio: 'inherit', shell: true });

if (testResult.status === 0) {
  console.log('\nAll tests passed — skipping triage.');
  process.exit(0);
}

console.log(`\nTest failures detected in the ${layer} suite — invoking automated triage (test-failure-triage skill)...\n`);

const prompt = `Use the /test-failure-triage skill to analyze the latest ${layer} test run failures and, for any confirmed bugs, file Jira tickets per the skill's procedure.`;

// Pass the prompt via stdin, not as a CLI arg — passing a long, punctuation-
// containing string through spawnSync's shell:true on Windows gets word-split
// by cmd.exe before "claude" ever sees it as one argument (only the first word
// arrives). Piping it in sidesteps shell quoting entirely, cross-platform.
//
// cwd MUST be the repo root, not wherever this was invoked from (e.g. npm runs
// this script with cwd=frontend/, one level below .claude/settings.json) — a
// nested session launched from a subdirectory never discovers the project's
// settings file, so --permission-mode dontAsk has nothing on its allow-list
// and silently denies everything (Bash, MCP tools, all of it). --settings is
// passed explicitly too, so loading doesn't depend on cwd-based discovery at all.
const settingsPath = path.join(repoRoot, '.claude', 'settings.json');
const claudeResult = spawnSync(
  'claude',
  ['-p', '--permission-mode', 'dontAsk', '--settings', settingsPath],
  {
    input: prompt,
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
    cwd: repoRoot,
  },
);

if (claudeResult.error) {
  console.error('\nCould not invoke the claude CLI for triage:', claudeResult.error.message);
  console.error('(Is it installed and on PATH? npm install -g @anthropic-ai/claude-code)');
}

// Exit with the ORIGINAL test command's status — triage is a side effect, it
// shouldn't mask a real test failure from whatever invoked this script (CI, a
// developer's shell, etc.).
process.exit(testResult.status ?? 1);
