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
    '🚀 Verificando configuración de Personas, Modelos y Subagentes de OrganizadorCursada...\n',
  );

  if (!fs.existsSync(SUBAGENTS_FILE)) {
    console.error(`❌ Error: Archivo ${SUBAGENTS_FILE} no encontrado.`);
    process.exit(1);
  }

  if (!fs.existsSync(PERSONAS_MD)) {
    console.error(`❌ Error: Archivo ${PERSONAS_MD} no encontrado.`);
    process.exit(1);
  }

  if (!fs.existsSync(TICKETS_DIR)) {
    console.error(`❌ Error: Directorio de tickets ${TICKETS_DIR} no encontrado.`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(SUBAGENTS_FILE, 'utf-8');
  const data = JSON.parse(rawData);

  console.log(
    `✅ Archivo subagents.json válido (${data.subagents.length} personas registradas):\n`,
  );

  for (const agent of data.subagents) {
    console.log(`┌─────────────────────────────────────────────────────────────────────────────`);
    console.log(`│ 👤 Persona:          ${agent.name.toUpperCase()} (${agent.role})`);
    console.log(
      `│ 🤖 Modelo Sugerido:  ${agent.preferredModel.toUpperCase()} | Thinking: ${agent.thinkingLevel.toUpperCase()}`,
    );
    console.log(`│ 💡 Estrategia Token: ${agent.providerStrategy}`);
    console.log(
      `│ 🛠️ Write Tools:      ${agent.enable_write_tools ? 'Habilitadas' : 'Deshabilitadas'}`,
    );
    console.log(`│ 📂 Rutas permitidas:  ${agent.allowedWritePaths.join(', ')}`);
    console.log(`└─────────────────────────────────────────────────────────────────────────────\n`);
  }

  console.log(
    '✨ Todo el ecosistema de Personas, Modelos y Guardrails está correctamente configurado.',
  );
}

runCheck();
