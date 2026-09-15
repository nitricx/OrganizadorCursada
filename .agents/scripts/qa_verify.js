#!/usr/bin/env node
/**
 * qa_verify.js
 * Unified QA verification runner and token condenser.
 * 1. Runs qa_audit.js (Static repo rules).
 * 2. Runs Vitest (npm test -- --watch=false).
 * 3. Runs ng build (npm run build).
 */
const { spawnSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');
const QA_AUDIT_SCRIPT = path.join(__dirname, 'qa_audit.js');

function runStep(command, cwd = ROOT_DIR) {
  const result = spawnSync(command, {
    cwd,
    shell: true,
    encoding: 'utf-8',
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });

  return {
    success: result.status === 0,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
  };
}

function filterNoise(output) {
  return output
    .split('\n')
    .filter((line) => {
      if (line.includes('Amplify has not been configured')) return false;
      if (line.includes('ExperimentalWarning: localStorage')) return false;
      if (line.includes('(Use `node --trace-warnings')) return false;
      return true;
    })
    .join('\n');
}

function extractVitestSummary(stdout) {
  const matchFiles = stdout.match(/Test Files\s+([^\n]+)/);
  const matchTests = stdout.match(/Tests\s+([^\n]+)/);
  const filesInfo = matchFiles ? matchFiles[1].trim() : 'Passed';
  const testsInfo = matchTests ? matchTests[1].trim() : 'Passed';
  return `${filesInfo} | ${testsInfo}`;
}

function runVerification() {
  const auditRes = runStep(`node "${QA_AUDIT_SCRIPT}"`);
  if (!auditRes.success) {
    console.error('[ERROR] STATIC AUDIT FAILED:');
    console.error(auditRes.stdout || auditRes.stderr);
    process.exit(1);
  }

  const testRes = runStep('npm test -- --watch=false');
  if (!testRes.success) {
    console.error('[ERROR] UNIT TESTS FAILED:');
    console.error(filterNoise(testRes.stdout + '\n' + testRes.stderr));
    process.exit(1);
  }

  const buildRes = runStep('npm run build');
  if (!buildRes.success) {
    console.error('[ERROR] BUILD FAILED:');
    console.error(filterNoise(buildRes.stdout + '\n' + buildRes.stderr));
    process.exit(1);
  }

  const testSummary = extractVitestSummary(testRes.stdout);

  console.log('[SUCCESS] Repo rules: 0 violations');
  console.log(`[SUCCESS] Unit tests: ${testSummary}`);
  console.log('[SUCCESS] Build: Clean (Suggested verdict: QA_VERIFIED)');
}

runVerification();
