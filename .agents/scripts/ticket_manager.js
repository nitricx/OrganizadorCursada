#!/usr/bin/env node
/**
 * ticket_manager.js
 * Deterministic utility to manage ticket lifecycle using GitHub Issues via gh CLI.
 *
 * Usage:
 *   node ticket_manager.js new "<title>" [persona]
 *   node ticket_manager.js status <ISSUE-NUMBER> <NEW_STATUS> [persona]
 */
const { execSync } = require('child_process');

const VALID_STATUSES = [
  'DRAFT',
  'READY_FOR_DEV',
  'IN_DEVELOPMENT',
  'READY_FOR_QA',
  'QA_VERIFIED',
  'REJECTED',
  'CLOSED',
];

const STATUS_LABEL_MAP = {
  DRAFT: 'status:draft',
  READY_FOR_DEV: 'status:ready-for-dev',
  IN_DEVELOPMENT: 'status:in-development',
  READY_FOR_QA: 'status:ready-for-qa',
  QA_VERIFIED: 'status:qa-verified',
  REJECTED: 'status:rejected',
  CLOSED: 'status:qa-verified',
};

const PERSONA_LABEL_MAP = {
  analyst: 'persona:analista',
  developer: 'persona:desarrollador',
  analista: 'persona:analista',
  desarrollador: 'persona:desarrollador',
  qa: 'persona:qa',
  gitflow: 'persona:gitflow',
};

function createTicket(title, assignee = 'analyst') {
  if (!title) {
    console.error('[ERROR] You must provide a title for the ticket.');
    console.error('Usage: node ticket_manager.js new "<title>" [persona]');
    process.exit(1);
  }

  const personaLabel = PERSONA_LABEL_MAP[assignee] || 'persona:analyst';
  const statusLabel = 'status:draft';

  try {
    const cmd = `gh issue create --title "${title}" --label "${statusLabel},${personaLabel}" --body "## 1. Functional Specification (Analyst)\n\n### Context & Problem Statement\n\n### User Stories (English Format)\n\n### Acceptance Criteria (Gherkin Format)\n\n### Service & Domain Model Impact\n\n---\n## 2. Implementation Record (Developer)\n- Status: PENDING\n\n---\n## 3. Quality Certification (QA)\n- Status: PENDING\n\n---\n## 4. Closure & Release (GitFlow)\n- Status: PENDING"`;
    const output = execSync(cmd, { encoding: 'utf-8' }).trim();
    console.log(`[SUCCESS] GitHub Issue created: ${output}`);
  } catch (err) {
    console.error(`[ERROR] Creating GitHub issue: ${err.message}`);
    process.exit(1);
  }
}

function updateTicketStatus(issueNum, newStatus, assignee = null) {
  if (!issueNum || !newStatus) {
    console.error('[ERROR] You must specify the issue number and the new status.');
    console.error('Usage: node ticket_manager.js status <ISSUE-NUMBER> <NEW_STATUS> [persona]');
    process.exit(1);
  }

  const statusUpper = newStatus.toUpperCase().trim();
  if (!VALID_STATUSES.includes(statusUpper)) {
    console.error(`[ERROR] Invalid status '${newStatus}'.`);
    console.error(`Valid statuses: ${VALID_STATUSES.join(', ')}`);
    process.exit(1);
  }

  const num = issueNum.replace('#', '').replace('TICK-', '');

  try {
    const currentLabelsRaw = execSync(`gh issue view ${num} --json labels --jq ".labels[].name"`, {
      encoding: 'utf-8',
    });
    const currentLabels = currentLabelsRaw.split('\n').filter(Boolean);

    const removeLabels = currentLabels.filter((l) => l.startsWith('status:'));
    let removeCmd = removeLabels.map((l) => `--remove-label "${l}"`).join(' ');

    const newStatusLabel = STATUS_LABEL_MAP[statusUpper];
    let addCmd = `--add-label "${newStatusLabel}"`;

    if (assignee && PERSONA_LABEL_MAP[assignee]) {
      const removePersonaLabels = currentLabels.filter((l) => l.startsWith('persona:'));
      if (removePersonaLabels.length > 0) {
        removeCmd += ' ' + removePersonaLabels.map((l) => `--remove-label "${l}"`).join(' ');
      }
      addCmd += ` --add-label "${PERSONA_LABEL_MAP[assignee]}"`;
    }

    const editCmd = `gh issue edit ${num} ${removeCmd} ${addCmd}`;
    execSync(editCmd, { encoding: 'utf-8' });

    if (statusUpper === 'CLOSED') {
      execSync(`gh issue close ${num}`, { encoding: 'utf-8' });
      console.log(`[SUCCESS] Issue #${num} closed.`);
    } else {
      console.log(`[SUCCESS] Issue #${num} -> ${statusUpper}`);
    }
  } catch (err) {
    console.error(`[ERROR] Updating GitHub issue: ${err.message}`);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'new':
    createTicket(args[1], args[2]);
    break;
  case 'status':
    updateTicketStatus(args[1], args[2], args[3]);
    break;
  default:
    console.log('Ticket Manager (GitHub Issues) for OrganizadorCursada');
    console.log('Commands:');
    console.log('  node ticket_manager.js new "<title>" [persona]');
    console.log('  node ticket_manager.js status <ISSUE-NUM> <NEW_STATUS> [persona]');
    process.exit(0);
}
