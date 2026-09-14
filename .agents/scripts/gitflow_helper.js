#!/usr/bin/env node
/**
 * gitflow_helper.js
 * Automatización determinística de ramas y commits para la persona GitFlow:
 * - branch <TICK-ID>: Sincroniza develop y crea la rama feature/<TICK-ID>-<nombre>.
 * - commit <TICK-ID>: Verifica que el ticket esté en QA_VERIFIED y genera commit convencional.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TICKETS_DIR = path.resolve(__dirname, '../tickets');

function runGit(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    const errorMsg = err.stderr ? err.stderr.toString() : err.message;
    throw new Error(`Fallo comando git '${cmd}': ${errorMsg}`);
  }
}

function findTicket(ticketId) {
  if (!fs.existsSync(TICKETS_DIR)) return null;
  const files = fs.readdirSync(TICKETS_DIR);
  const normalized = ticketId.toUpperCase().trim();

  for (const file of files) {
    if (file.toUpperCase().startsWith(normalized)) {
      const fullPath = path.join(TICKETS_DIR, file);
      const content = fs.readFileSync(fullPath, 'utf-8');

      const titleMatch = content.match(/^#\s+\[[^\]]+\]:\s*([^\n]+)/m);
      const statusMatch = content.match(/- \*\*Estado Actual\*\*:\s*`([^`]+)`/);

      return {
        fileName: file,
        fullPath,
        content,
        title: titleMatch ? titleMatch[1].trim() : file.replace('.md', ''),
        status: statusMatch ? statusMatch[1].trim().toUpperCase() : 'UNKNOWN',
      };
    }
  }
  return null;
}

function toSlug(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createBranch(ticketId) {
  if (!ticketId) {
    console.error('❌ Error: Debes especificar el ID del ticket.');
    console.error('Usage: node gitflow_helper.js branch <TICK-ID>');
    process.exit(1);
  }

  const ticket = findTicket(ticketId);
  if (!ticket) {
    console.error(`❌ Error: No se encontró el ticket ${ticketId} en ${TICKETS_DIR}`);
    process.exit(1);
  }

  const branchName = `feature/${ticketId.toUpperCase()}-${toSlug(ticket.title)}`;

  console.log(`🌿 Preparando rama GitFlow para: ${ticket.title}`);
  try {
    // Intentar checkout a develop
    try {
      runGit('git checkout develop');
      try {
        runGit('git pull origin develop');
      } catch {
        console.log(
          '  ℹ️ No se pudo hacer git pull de develop (modo local o sin upstream). Continuando...',
        );
      }
    } catch {
      console.log('  ℹ️ Rama develop no encontrada, creando desde rama actual.');
    }

    runGit(`git checkout -b ${branchName}`);
    console.log(`✅ Rama creada y activa: ${branchName}`);
  } catch (err) {
    console.error(`❌ Error al crear la rama: ${err.message}`);
    process.exit(1);
  }
}

function makeCommit(ticketId) {
  if (!ticketId) {
    console.error('❌ Error: Debes especificar el ID del ticket.');
    console.error('Usage: node gitflow_helper.js commit <TICK-ID>');
    process.exit(1);
  }

  const ticket = findTicket(ticketId);
  if (!ticket) {
    console.error(`❌ Error: No se encontró el ticket ${ticketId} en ${TICKETS_DIR}`);
    process.exit(1);
  }

  // Guardrail estricto: no commitear sin QA_VERIFIED
  if (ticket.status !== 'QA_VERIFIED') {
    console.error(
      `🚫 GUARDRAIL ACTIVADO: El ticket ${ticketId} está en estado '${ticket.status}'.`,
    );
    console.error('Solo los tickets con estado QA_VERIFIED pueden ser integrados por GitFlow.');
    process.exit(1);
  }

  const commitMsg = `feat(${ticketId.toUpperCase()}): ${ticket.title}`;
  console.log(`📦 Creando Conventional Commit: "${commitMsg}"`);

  try {
    const status = runGit('git status --porcelain');
    if (!status) {
      console.log('ℹ️ No hay cambios pendientes en el árbol de trabajo para commitear.');
      return;
    }

    runGit('git add -A');
    runGit(`git commit -m "${commitMsg}"`);
    console.log(`✅ Commit generado con éxito.`);
  } catch (err) {
    console.error(`❌ Error al crear el commit: ${err.message}`);
    process.exit(1);
  }
}

function createPR(ticketId) {
  if (!ticketId) {
    console.error('❌ Error: Debes especificar el ID del ticket.');
    process.exit(1);
  }

  const ticket = findTicket(ticketId);
  if (!ticket) {
    console.error(`❌ Error: No se encontró el ticket ${ticketId}`);
    process.exit(1);
  }

  if (ticket.status !== 'QA_VERIFIED') {
    console.error(`🚫 GUARDRAIL ACTIVADO: El ticket ${ticketId} debe estar en QA_VERIFIED para abrir un PR.`);
    process.exit(1);
  }

  const currentBranch = runGit('git branch --show-current');
  console.log(`🚀 Creando Pull Request desde '${currentBranch}' hacia 'develop'...`);

  try {
    const title = `feat(${ticketId.toUpperCase()}): ${ticket.title}`;
    const body = `## Ticket: ${ticketId}\n\n${ticket.title}\n\nCertificado por QA (\`QA_VERIFIED\`).`;
    const prUrl = runGit(`gh pr create --base develop --title "${title}" --body "${body}"`);
    console.log(`✅ Pull Request creado exitosamente: ${prUrl}`);
  } catch (err) {
    console.error(`⚠️ No se pudo crear el PR automáticamente vía 'gh': ${err.message}`);
  }
}

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'branch':
    createBranch(args[1]);
    break;
  case 'commit':
    makeCommit(args[1]);
    break;
  case 'pr':
    createPR(args[1]);
    break;
  default:
    console.log('📖 Ayudante de GitFlow para OrganizadorCursada');
    console.log('Comandos:');
    console.log('  node gitflow_helper.js branch <TICK-ID>');
    console.log('  node gitflow_helper.js commit <TICK-ID>');
    console.log('  node gitflow_helper.js pr <TICK-ID>');
    process.exit(0);
}
