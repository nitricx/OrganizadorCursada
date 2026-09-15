#!/usr/bin/env node
/**
 * auto_close_issue.js
 * Automatically closes or syncs linked issues when a Pull Request is closed or merged.
 *
 * Usage:
 *   node .agents/scripts/auto_close_issue.js <PR_NUMBER_OR_URL>
 *   PR_NUMBER=123 PR_MERGED=true PR_BODY="Closes #36" node .agents/scripts/auto_close_issue.js
 */
const { execSync } = require('child_process');

const LABEL_STATUS_MAP = {
  DRAFT: 'status:draft',
  READY_FOR_DEV: 'status:ready-for-dev',
  IN_DEVELOPMENT: 'status:in-development',
  READY_FOR_QA: 'status:ready-for-qa',
  QA_VERIFIED: 'status:qa-verified',
  REJECTED: 'status:rejected',
  CLOSED: 'status:qa-verified',
};

function parseLinkedIssues(text) {
  if (!text) return [];
  const issueNumbers = new Set();
  const keywordRegex = /(?:closes|close|closed|fixes|fix|fixed|resolves|resolve|resolved)\s+#(\d+)/gi;
  let match;
  while ((match = keywordRegex.exec(text)) !== null) {
    if (match[1]) issueNumbers.add(match[1]);
  }
  const branchRegex = /(?:feature|bugfix|hotfix)\/(\d+)-/gi;
  while ((match = branchRegex.exec(text)) !== null) {
    if (match[1]) issueNumbers.add(match[1]);
  }
  return Array.from(issueNumbers);
}

function processPR(prArg) {
  let prNumber = prArg || process.env.PR_NUMBER;
  let isMerged = process.env.PR_MERGED !== undefined ? process.env.PR_MERGED === 'true' : null;
  let body = process.env.PR_BODY;
  let title = process.env.PR_TITLE;
  let branch = process.env.PR_BRANCH;

  if (prNumber) {
    prNumber = prNumber.toString().replace('#', '').trim();
    try {
      const raw = execSync(
        `gh pr view ${prNumber} --json number,title,body,headRefName,state,mergedAt`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
      ).trim();
      const prData = JSON.parse(raw);
      if (isMerged === null) {
        isMerged = Boolean(prData.mergedAt);
      }
      body = body || prData.body || '';
      title = title || prData.title || '';
      branch = branch || prData.headRefName || '';
    } catch (err) {
      console.warn(`[WARN] Could not fetch PR #${prNumber} details via gh CLI: ${err.message}`);
    }
  }

  const fullText = `${body || ''}\n${title || ''}\n${branch || ''}`;
  const linkedIssues = parseLinkedIssues(fullText);

  if (linkedIssues.length === 0) {
    console.log('[INFO] No linked issues found for PR.');
    return;
  }

  console.log(`[INFO] Found linked issue(s): ${linkedIssues.join(', ')}`);

  for (const issueNum of linkedIssues) {
    if (isMerged) {
      console.log(`[INFO] PR is merged. Closing issue #${issueNum} and updating status label...`);
      try {
        const currentLabelsRaw = execSync(
          `gh issue view ${issueNum} --json labels --jq ".labels[].name"`,
          { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
        );
        const currentLabels = currentLabelsRaw.split('\n').filter(Boolean);
        const removeLabels = currentLabels.filter((l) => l.startsWith('status:'));
        let removeCmd = removeLabels.map((l) => `--remove-label "${l}"`).join(' ');
        let addCmd = `--add-label "${LABEL_STATUS_MAP.QA_VERIFIED}"`;

        const editCmd = `gh issue edit ${issueNum} ${removeCmd} ${addCmd}`;
        execSync(editCmd, { encoding: 'utf-8' });
        execSync(`gh issue close ${issueNum}`, { encoding: 'utf-8' });
        console.log(`[SUCCESS] Issue #${issueNum} closed with status label '${LABEL_STATUS_MAP.QA_VERIFIED}'.`);
      } catch (err) {
        console.error(`[ERROR] Failed to close issue #${issueNum}: ${err.message}`);
      }
    } else {
      console.log(`[INFO] PR closed without merging. Keeping issue #${issueNum} open...`);
      try {
        execSync(`gh issue reopen ${issueNum}`, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        console.log(`[SUCCESS] Issue #${issueNum} is open and available for re-assignment.`);
      } catch (err) {
        console.log(`[INFO] Issue #${issueNum} remains open.`);
      }
    }
  }
}

const args = process.argv.slice(2);
processPR(args[0]);
