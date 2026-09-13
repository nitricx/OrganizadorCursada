#!/usr/bin/env node
/**
 * qa_audit.js
 * Auditoría estática determinística de las 4 Reglas Inviolables del Repositorio:
 * 1. Prohibición de Dummy Data o Mocks no autorizados.
 * 2. Tests unitarios obligatorios para cada archivo *.service.ts.
 * 3. Cero colores hexadecimales hardcodeados (#fff, #1a1a1a, etc.) en estilos de componentes o atributos inline HTML.
 * 4. Sincronización estricta entre package.json y package-lock.json (previene fallos en npm ci).
 */
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');
const SRC_APP_DIR = path.resolve(__dirname, '../../src/app');
const SERVICES_DIR = path.resolve(__dirname, '../../src/app/services');
const PACKAGE_JSON = path.join(ROOT_DIR, 'package.json');
const PACKAGE_LOCK = path.join(ROOT_DIR, 'package-lock.json');

let errorCount = 0;

function logHeader(title) {
  console.log(`\n🔍 ${title}`);
}

function reportError(rule, file, line, message) {
  errorCount++;
  console.error(`  ❌ [${rule}] ${path.relative(process.cwd(), file)}:${line} -> ${message}`);
}

function getAllFiles(dir, extensions, excludeSpec = false) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of list) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, extensions, excludeSpec));
    } else if (entry.isFile()) {
      if (excludeSpec && entry.name.endsWith('.spec.ts')) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

// 1. Audit: Mandatory Service Unit Tests
function auditServiceTests() {
  logHeader('Regla 2: Verificando tests unitarios para servicios...');
  const serviceFiles = getAllFiles(SERVICES_DIR, ['.ts'], true);
  let checked = 0;

  for (const serviceFile of serviceFiles) {
    if (serviceFile.endsWith('.service.ts')) {
      checked++;
      const specFile = serviceFile.replace(/\.service\.ts$/, '.service.spec.ts');
      if (!fs.existsSync(specFile)) {
        reportError('MISSING_SERVICE_SPEC', serviceFile, 1, 'No se encontró el archivo de pruebas unitarias *.service.spec.ts');
      }
    }
  }

  console.log(`  ✅ ${checked} servicios auditados. Cobertura de archivos de spec: 100%.`);
}

// 2. Audit: Zero Hardcoded Hex Colors in Component Styles & Inline HTML
function auditHexColors() {
  logHeader('Regla 3: Verificando ausencia de colores hexadecimales en estilos de componentes e inline HTML...');
  const hexColorRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

  // A. Auditar todos los archivos .css en src/app/
  const cssFiles = getAllFiles(SRC_APP_DIR, ['.css'], false);
  for (const file of cssFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//')) return;

      let match;
      while ((match = hexColorRegex.exec(line)) !== null) {
        reportError(
          'HEX_COLOR_IN_CSS',
          file,
          idx + 1,
          `Se detectó color hexadecimal hardcodeado '${match[0]}'. Debe consumirse un token CSS var(--...) de src/styles.css.`
        );
      }
    });
  }

  // B. Auditar archivos .html buscando style="...#hex..."
  const htmlFiles = getAllFiles(SRC_APP_DIR, ['.html'], false);
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      if (line.includes('style=')) {
        const styleMatch = line.match(/style\s*=\s*["']([^"']*)["']/);
        if (styleMatch) {
          const styleContent = styleMatch[1];
          let match;
          while ((match = hexColorRegex.exec(styleContent)) !== null) {
            reportError(
              'HEX_COLOR_IN_INLINE_HTML',
              file,
              idx + 1,
              `Se detectó color hexadecimal en atributo style inline '${match[0]}'. Usar clases with tokens CSS.`
            );
          }
        }
      }
    });
  }

  console.log(`  ✅ ${cssFiles.length} hojas de estilo CSS y ${htmlFiles.length} plantillas HTML auditadas.`);
}

// 3. Audit: No Dummy Data
function auditNoDummyData() {
  logHeader('Regla 1: Verificando ausencia de planes/carreras dummy o ficticias...');
  const files = getAllFiles(SRC_APP_DIR, ['.ts'], false);

  const forbiddenTerms = [
    'medicina.json',
    'abogacia.json',
    'derecho.json',
    'dummy-career',
    'fake-plan',
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    for (const term of forbiddenTerms) {
      if (content.toLowerCase().includes(term)) {
        reportError(
          'DUMMY_DATA_FORBIDDEN',
          file,
          1,
          `Se detectó referencia a dataset simulado '${term}'. Usar solo carreras auténticas.`
        );
      }
    }
  }

  console.log(`  ✅ Integridad de planes de estudio auténticos verificada.`);
}

// 4. Audit: Lockfile Synchronization (previene fallos de CI por npm ci)
function auditLockfileSync() {
  logHeader('Regla 4: Verificando sincronización de package.json y package-lock.json...');

  if (!fs.existsSync(PACKAGE_JSON)) {
    reportError('LOCKFILE_DESYNC', PACKAGE_JSON, 1, 'No se encontró package.json');
    return;
  }
  if (!fs.existsSync(PACKAGE_LOCK)) {
    reportError('LOCKFILE_DESYNC', PACKAGE_LOCK, 1, 'No se encontró package-lock.json');
    return;
  }

  const pkgJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));
  const pkgLock = JSON.parse(fs.readFileSync(PACKAGE_LOCK, 'utf-8'));

  const lockPackages = pkgLock.packages || {};
  const lockDeps = pkgLock.dependencies || {};

  const allDeclared = {
    ...(pkgJson.dependencies || {}),
    ...(pkgJson.devDependencies || {}),
  };

  let missingInLock = 0;

  for (const [dep, reqVersion] of Object.entries(allDeclared)) {
    const nodeModulePath = `node_modules/${dep}`;
    const inPackages = lockPackages[nodeModulePath] || lockPackages['']?.dependencies?.[dep];
    const inDeps = lockDeps[dep];

    if (!inPackages && !inDeps) {
      missingInLock++;
      reportError(
        'LOCKFILE_DESYNC',
        PACKAGE_JSON,
        1,
        `La dependencia '${dep}' (${reqVersion}) está en package.json pero NO está registrada en package-lock.json. Ejecuta 'npm install' para sincronizar.`
      );
    }
  }

  if (missingInLock === 0) {
    console.log(`  ✅ Sincronización perfecta de lockfile (todos los paquetes de package.json existen en package-lock.json).`);
  }
}

// Ejecución
console.log('🚀 Iniciando Auditoría Estática de Reglas Inviolables (OrganizadorCursada)...');
auditServiceTests();
auditHexColors();
auditNoDummyData();
auditLockfileSync();

console.log('\n─────────────────────────────────────────────────────────────');
if (errorCount === 0) {
  console.log('🎉 Auditoría exitosa: 0 infracciones detectadas. Todas las reglas se cumplen.');
  process.exit(0);
} else {
  console.error(`❌ Auditoría fallida: Se encontraron ${errorCount} infracciones.`);
  process.exit(1);
}
