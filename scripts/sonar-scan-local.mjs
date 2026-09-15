#!/usr/bin/env node

/**
 * Local SonarQube Scanner Runner
 * Checks if local SonarQube instance is reachable, runs test coverage, and executes the scanner.
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { scan } from 'sonarqube-scanner';

const SONAR_HOST = process.env.SONAR_HOST_URL || 'http://localhost:9000';

async function isSonarRunning() {
  try {
    const res = await fetch(`${SONAR_HOST}/api/system/status`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'UP';
  } catch {
    return false;
  }
}

async function getOrGenerateLocalToken() {
  if (process.env.SONAR_TOKEN) return process.env.SONAR_TOKEN;

  try {
    const auth = Buffer.from('admin:admin').toString('base64');
    const tokenName = 'local-prepush-token';

    await fetch(`${SONAR_HOST}/api/user_tokens/revoke?name=${tokenName}`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}` },
    });

    const res = await fetch(`${SONAR_HOST}/api/user_tokens/generate?name=${tokenName}`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}` },
    });

    if (res.ok) {
      const data = await res.json();
      return data.token;
    }
  } catch {}

  return '';
}

async function main() {
  console.log(`[SonarQube] Checking local instance status at ${SONAR_HOST}...`);
  const isUp = await isSonarRunning();

  if (!isUp) {
    console.warn(`[WARN] Local SonarQube instance is not reachable at ${SONAR_HOST}.`);
    console.warn('   To run local security analysis and quality checks:');
    console.warn('     1. Start the container: npm run sonar:up');
    console.warn(`     2. Wait until ready (~30-60s) at ${SONAR_HOST}`);
    console.warn('\n   (To push without local verification once, use: git push --no-verify)\n');
    process.exit(1);
  }

  console.log('[INFO] Local server is healthy and UP.');
  console.log('[INFO] Generating unit test coverage with Vitest...');

  const ngCliPath = path.resolve('node_modules', '@angular', 'cli', 'bin', 'ng.js');

  try {
    execFileSync(
      process.execPath,
      [ngCliPath, 'test', '--watch=false', '--coverage', '--coverage-reporters=lcov'],
      { stdio: 'inherit' },
    );
  } catch (err) {
    console.error('[ERROR] Unit tests failed! Aborting push.');
    process.exit(1);
  }

  console.log('[INFO] Running SonarScanner with Quality Gate wait...');

  const token = await getOrGenerateLocalToken();

  try {
    await scan({
      serverUrl: SONAR_HOST,
      token: token || undefined,
      options: {
        'sonar.qualitygate.wait': 'true',
      },
    });
    console.log('[SUCCESS] Local Quality Gate passed successfully!');
  } catch (err) {
    console.error(`[ERROR] Quality Gate failed! Review issues at ${SONAR_HOST}.`);
    process.exit(1);
  }
}

main();
