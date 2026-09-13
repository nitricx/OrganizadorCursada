#!/usr/bin/env node
/**
 * qa_verify.js
 * Runner unificado y condensador de tokens para el proceso de QA en OrganizadorCursada:
 * 1. Ejecuta qa_audit.js (Reglas invariantes).
 * 2. Ejecuta Vitest (npm test -- --watch=false).
 * 3. Ejecuta ng build (npm run build).
 *
 * Filtra el ruido innecesario de logs para que el agente reciba solo un resumen de 5 líneas
 * o el bloque de error puntual si algo falla, ahorrando miles de tokens de contexto.
 */
const { execSync, spawnSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');
const QA_AUDIT_SCRIPT = path.join(__dirname, 'qa_audit.js');

function runStep(name, command, cwd = ROOT_DIR) {
  console.log(`⏳ Ejecutando ${name}...`);
  const result = spawnSync(command, {
    cwd,
    shell: true,
    encoding: 'utf-8',
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });

  return {
    name,
    success: result.status === 0,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    code: result.status,
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
  console.log('🚀 Iniciando Suite de Verificación QA (OrganizadorCursada)...\n');

  // Paso 1: Auditoría de Reglas
  const auditRes = runStep('Auditoría Estática de Reglas', `node "${QA_AUDIT_SCRIPT}"`);
  if (!auditRes.success) {
    console.error('\n❌ FALLO EN AUDITORÍA DE REGLAS:');
    console.error(auditRes.stdout);
    process.exit(1);
  }

  // Paso 2: Tests Unitarios Vitest
  const testRes = runStep('Tests Unitarios (Vitest)', 'npm test -- --watch=false');
  if (!testRes.success) {
    console.error('\n❌ FALLO EN TESTS UNITARIOS:');
    console.error(filterNoise(testRes.stdout + '\n' + testRes.stderr));
    process.exit(1);
  }

  // Paso 3: Build & Type-check
  const buildRes = runStep('Compilación & Build', 'npm run build');
  if (!buildRes.success) {
    console.error('\n❌ FALLO EN COMPILACIÓN (BUILD):');
    console.error(filterNoise(buildRes.stdout + '\n' + buildRes.stderr));
    process.exit(1);
  }

  // Resumen Condensado de Éxito
  const testSummary = extractVitestSummary(testRes.stdout);

  console.log('\n======================================================');
  console.log('🎉 QA VERIFICATION SUITE PASSED (ALL CHECKS GREEN)');
  console.log('------------------------------------------------------');
  console.log('✅ Reglas del Repo:  0 infracciones (Hex, Mocks, Specs)');
  console.log(`✅ Tests Unitarios:  ${testSummary}`);
  console.log('✅ Build Producción: Compilación limpia sin errores');
  console.log('======================================================\n');
  console.log('💡 Dictamen sugerido para QA: QA_VERIFIED');
}

runVerification();
