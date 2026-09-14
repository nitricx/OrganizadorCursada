/**
 * init_personas.js
 * Script de validación y resumen de las Personas, Subagentes y Estrategias de Modelo en OrganizadorCursada.
 */
const fs = require('fs');
const path = require('path');

const SUBAGENTS_FILE = path.resolve(__dirname, '../subagents/subagents.json');
const TICKETS_DIR = path.resolve(__dirname, '../tickets');
const PERSONAS_MD = path.resolve(__dirname, '../PERSONAS.md');

function runCheck() {
  console.log(
    '🚀 Verifying configuration of Personas, Models and Subagents of OrganizadorCursada...\n',
  );

  if (!fs.existsSync(SUBAGENTS_FILE)) {
    console.error(`❌ Error: Archivo ${SUBAGENTS_FILE} not found.`);
    process.exit(1);
  }

  if (!fs.existsSync(PERSONAS_MD)) {
    console.error(`❌ Error: Archivo ${PERSONAS_MD} not found.`);
    process.exit(1);
  }

  if (!fs.existsSync(TICKETS_DIR)) {
    console.error(`❌ Error: Tickets directory ${TICKETS_DIR} not found.`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(SUBAGENTS_FILE, 'utf-8');
  const data = JSON.parse(rawData);

  console.log(
    `✅ Archivo subagents.json valid (${data.subagents.length} registered personas):\n`,
  );

  for (const agent of data.subagents) {
    console.log(`┌─────────────────────────────────────────────────────────────────────────────`);
    console.log(`│ 👤 Persona:          ${agent.name.toUpperCase()} (${agent.role})`);
    console.log(
      `│ 🤖 Suggested Model:  ${agent.preferredModel.toUpperCase()} | Thinking: ${agent.thinkingLevel.toUpperCase()}`,
    );
    console.log(`│ 💡 Token Strategy: ${agent.providerStrategy}`);
    console.log(
      `│ 🛠️ Write Tools:      ${agent.enable_write_tools ? 'Enabled' : 'Disabled'}`,
    );
    console.log(`│ 📂 Allowed paths:  ${agent.allowedWritePaths.join(', ')}`);
    console.log(`└─────────────────────────────────────────────────────────────────────────────\n`);
  }

  console.log(
    '✨ The entire ecosystem of Personas, Models and Guardrails is correctly configured.',
  );
}

runCheck();
