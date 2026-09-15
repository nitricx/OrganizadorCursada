/**
 * init_personas.js
 * Minimal verification script for Personas and Subagents configuration.
 */
const fs = require('fs');
const path = require('path');

const SUBAGENTS_FILE = path.resolve(__dirname, '../subagents/subagents.json');
const PERSONAS_MD = path.resolve(__dirname, '../PERSONAS.md');

function runCheck() {
  if (!fs.existsSync(SUBAGENTS_FILE)) {
    console.error(`[ERROR] File ${SUBAGENTS_FILE} not found.`);
    process.exit(1);
  }

  if (!fs.existsSync(PERSONAS_MD)) {
    console.error(`[ERROR] File ${PERSONAS_MD} not found.`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(SUBAGENTS_FILE, 'utf-8');
  const data = JSON.parse(rawData);

  const personas = data.subagents.map((s) => s.name).join(', ');
  console.log(
    `[SUCCESS] Personas configuration valid (${data.subagents.length} personas: ${personas}).`,
  );
}

runCheck();
