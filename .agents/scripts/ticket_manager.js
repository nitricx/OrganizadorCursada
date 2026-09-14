#!/usr/bin/env node
/**
 * ticket_manager.js
 * Utilidad determinística para gestionar el ciclo de vida de tickets usando GitHub Issues via gh CLI.
 *
 * Uso:
 *   node ticket_manager.js new "<titulo>" [persona]
 *   node ticket_manager.js status <ISSUE-NUMBER> <NUEVO_ESTADO> [persona]
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
  analista: 'persona:analista',
  desarrollador: 'persona:desarrollador',
  qa: 'persona:qa',
  gitflow: 'persona:gitflow',
};

function createTicket(title, assignee = 'analista') {
  if (!title) {
    console.error('❌ Error: Debes proporcionar un título para el ticket.');
    console.error('Uso: node ticket_manager.js new "<titulo>" [persona]');
    process.exit(1);
  }

  const personaLabel = PERSONA_LABEL_MAP[assignee] || 'persona:analista';
  const statusLabel = 'status:draft';

  try {
    const cmd = `gh issue create --title "${title}" --label "${statusLabel},${personaLabel}" --body "## 📝 1. Especificación Funcional (Analista)\n\n### Contexto y Problema\n\n### Historias de Usuario (English Format)\n\n### Criterios de Aceptación (Gherkin)\n\n### Impacto en Servicios\n\n---\n## 💻 2. Registro de Implementación (Desarrollador)\n- Estado: PENDIENTE\n\n---\n## 🔍 3. Certificación de Calidad (QA)\n- Estado: PENDIENTE\n\n---\n## 🚀 4. Cierre y Release (GitFlow)\n- Estado: PENDIENTE"`;
    const output = execSync(cmd, { encoding: 'utf-8' }).trim();
    console.log(`✅ GitHub Issue creado exitosamente: ${output}`);
  } catch (err) {
    console.error(`❌ Error creando issue en GitHub: ${err.message}`);
    process.exit(1);
  }
}

function updateTicketStatus(issueNum, newStatus, assignee = null) {
  if (!issueNum || !newStatus) {
    console.error('❌ Error: Debes especificar el número de issue y el nuevo estado.');
    console.error('Uso: node ticket_manager.js status <ISSUE-NUMBER> <NUEVO_ESTADO> [persona]');
    process.exit(1);
  }

  const statusUpper = newStatus.toUpperCase().trim();
  if (!VALID_STATUSES.includes(statusUpper)) {
    console.error(`❌ Error: Estado '${newStatus}' inválido.`);
    console.error(`Estados válidos: ${VALID_STATUSES.join(', ')}`);
    process.exit(1);
  }

  const num = issueNum.replace('#', '').replace('TICK-', '');

  try {
    // Remove old status labels
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
      console.log(`🔒 Issue #${num} cerrado.`);
    }

    console.log(`✅ Issue #${num} actualizado a estado: ${statusUpper}`);
  } catch (err) {
    console.error(`❌ Error actualizando issue en GitHub: ${err.message}`);
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
    console.log('📖 Gestor de Tickets (GitHub Issues) de OrganizadorCursada');
    console.log('Comandos:');
    console.log('  node ticket_manager.js new "<titulo>" [persona]');
    console.log('  node ticket_manager.js status <ISSUE-NUM> <NUEVO_ESTADO> [persona]');
    process.exit(0);
}
