#!/usr/bin/env node
/**
 * ticket_manager.js
 * Utilidad determinística para gestionar el ciclo de vida de tickets en .agents/tickets/
 *
 * Uso:
 *   node ticket_manager.js new "<titulo>" [persona]
 *   node ticket_manager.js status <TICK-ID> <NUEVO_ESTADO> [persona]
 */
const fs = require('fs');
const path = require('path');

const TICKETS_DIR = path.resolve(__dirname, '../tickets');
const TEMPLATE_FILE = path.join(TICKETS_DIR, 'TEMPLATE.md');

const VALID_STATUSES = [
  'DRAFT',
  'READY_FOR_DEV',
  'IN_DEVELOPMENT',
  'READY_FOR_QA',
  'QA_VERIFIED',
  'REJECTED',
  'CLOSED',
];

function getNextTicketId() {
  if (!fs.existsSync(TICKETS_DIR)) {
    fs.mkdirSync(TICKETS_DIR, { recursive: true });
  }

  const files = fs.readdirSync(TICKETS_DIR);
  let maxId = 0;

  for (const file of files) {
    const match = file.match(/^TICK-(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxId) {
        maxId = num;
      }
    }
  }

  const nextNum = maxId + 1;
  return `TICK-${String(nextNum).padStart(3, '0')}`;
}

function toKebabCase(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createTicket(title, assignee = 'analista') {
  if (!title) {
    console.error('❌ Error: Debes proporcionar un título para el ticket.');
    console.error('Uso: node ticket_manager.js new "<titulo>" [persona]');
    process.exit(1);
  }

  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.error(`❌ Error: No se encontró la plantilla en ${TEMPLATE_FILE}`);
    process.exit(1);
  }

  const ticketId = getNextTicketId();
  const slug = toKebabCase(title);
  const fileName = `${ticketId}-${slug}.md`;
  const targetPath = path.join(TICKETS_DIR, fileName);
  const today = new Date().toISOString().split('T')[0];

  let content = fs.readFileSync(TEMPLATE_FILE, 'utf-8');

  content = content
    .replace(/\[TICK-XXX\]: Título Descriptivo de la Tarea o Feature/g, `[${ticketId}]: ${title}`)
    .replace(/\*\*ID\*\*: `TICK-XXX`/g, `**ID**: \`${ticketId}\``)
    .replace(/\*\*Estado Actual\*\*: `DRAFT`/g, `**Estado Actual**: \`DRAFT\``)
    .replace(/\*\*Persona Asignada\*\*: `analista`/g, `**Persona Asignada**: \`${assignee}\``)
    .replace(/feature\/<nombre-de-la-rama>/g, `feature/${ticketId}-${slug}`)
    .replace(/\*\*Fecha de Creación\*\*: YYYY-MM-DD/g, `**Fecha de Creación**: ${today}`)
    .replace(/\*\*Última Actualización\*\*: YYYY-MM-DD/g, `**Última Actualización**: ${today}`);

  fs.writeFileSync(targetPath, content, 'utf-8');

  console.log(`✅ Ticket creado exitosamente: ${fileName}`);
  console.log(`📌 ID: ${ticketId}`);
  console.log(`👤 Asignado: ${assignee}`);
  console.log(`📂 Ruta: ${targetPath}`);
}

function findTicketFile(ticketId) {
  if (!fs.existsSync(TICKETS_DIR)) {
    return null;
  }

  const normalizedId = ticketId.toUpperCase().trim();
  const files = fs.readdirSync(TICKETS_DIR);

  for (const file of files) {
    if (file.toUpperCase().startsWith(normalizedId)) {
      return path.join(TICKETS_DIR, file);
    }
  }

  return null;
}

function updateTicketStatus(ticketId, newStatus, assignee = null) {
  if (!ticketId || !newStatus) {
    console.error('❌ Error: Debes especificar el ID del ticket y el nuevo estado.');
    console.error('Uso: node ticket_manager.js status <TICK-ID> <NUEVO_ESTADO> [persona]');
    process.exit(1);
  }

  const statusUpper = newStatus.toUpperCase().trim();
  if (!VALID_STATUSES.includes(statusUpper)) {
    console.error(`❌ Error: Estado '${newStatus}' inválido.`);
    console.error(`Estados válidos: ${VALID_STATUSES.join(', ')}`);
    process.exit(1);
  }

  const filePath = findTicketFile(ticketId);
  if (!filePath) {
    console.error(`❌ Error: No se encontró ningún ticket con ID ${ticketId} en ${TICKETS_DIR}`);
    process.exit(1);
  }

  const today = new Date().toISOString().split('T')[0];
  let content = fs.readFileSync(filePath, 'utf-8');

  // Reemplazar Estado
  const statusRegex = /- \*\*Estado Actual\*\*: `[^`]+`/;
  if (statusRegex.test(content)) {
    content = content.replace(statusRegex, `- **Estado Actual**: \`${statusUpper}\``);
  }

  // Reemplazar Fecha de actualización
  const dateRegex = /- \*\*Última Actualización\*\*: \d{4}-\d{2}-\d{2}/;
  if (dateRegex.test(content)) {
    content = content.replace(dateRegex, `- **Última Actualización**: ${today}`);
  }

  // Reemplazar Asignado si se indicó
  if (assignee) {
    const assigneeRegex = /- \*\*Persona Asignada\*\*: `[^`]+`/;
    if (assigneeRegex.test(content)) {
      content = content.replace(assigneeRegex, `- **Persona Asignada**: \`${assignee}\``);
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8');

  console.log(`✅ Ticket ${path.basename(filePath)} actualizado a: ${statusUpper}`);
  if (assignee) {
    console.log(`👤 Reasignado a: ${assignee}`);
  }
}

// Dispatcher de CLI
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
    console.log('📖 Gestor de Tickets de OrganizadorCursada');
    console.log('Comandos:');
    console.log('  node ticket_manager.js new "<titulo>" [persona]');
    console.log('  node ticket_manager.js status <TICK-ID> <NUEVO_ESTADO> [persona]');
    process.exit(0);
}
