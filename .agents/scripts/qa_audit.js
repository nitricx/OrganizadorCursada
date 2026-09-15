#!/usr/bin/env node
/**
 * qa_audit.js
 * Deterministic static audit of Repository Inviolable Rules.
 */
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');
const SRC_APP_DIR = path.resolve(__dirname, '../../src/app');
const SERVICES_DIR = path.resolve(__dirname, '../../src/app/services');
const PACKAGE_JSON = path.join(ROOT_DIR, 'package.json');
const PACKAGE_LOCK = path.join(ROOT_DIR, 'package-lock.json');

let errorCount = 0;

function reportError(rule, file, line, message) {
  errorCount++;
  console.error(`[ERROR] [${rule}] ${path.relative(process.cwd(), file)}:${line} -> ${message}`);
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

function auditServiceTests() {
  const serviceFiles = getAllFiles(SERVICES_DIR, ['.ts'], true);
  for (const serviceFile of serviceFiles) {
    if (serviceFile.endsWith('.service.ts')) {
      const specFile = serviceFile.replace(/\.service\.ts$/, '.service.spec.ts');
      if (!fs.existsSync(specFile)) {
        reportError(
          'MISSING_SERVICE_SPEC',
          serviceFile,
          1,
          'Unit test file missing (*.service.spec.ts)',
        );
      }
    }
  }
}

function auditHexColors() {
  const hexColorRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

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
          `Hardcoded hex color '${match[0]}'. Use CSS design token var(--...)`,
        );
      }
    });
  }

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
              `Hex color in inline style '${match[0]}'. Use CSS token classes`,
            );
          }
        }
      }
    });
  }
}

function auditNoDummyData() {
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
        reportError('DUMMY_DATA_FORBIDDEN', file, 1, `Forbidden dummy dataset reference '${term}'`);
      }
    }
  }
}

function auditLockfileSync() {
  if (!fs.existsSync(PACKAGE_JSON) || !fs.existsSync(PACKAGE_LOCK)) return;

  const pkgJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));
  const pkgLock = JSON.parse(fs.readFileSync(PACKAGE_LOCK, 'utf-8'));

  const lockPackages = pkgLock.packages || {};
  const lockDeps = pkgLock.dependencies || {};

  const allDeclared = {
    ...(pkgJson.dependencies || {}),
    ...(pkgJson.devDependencies || {}),
  };

  for (const [dep, reqVersion] of Object.entries(allDeclared)) {
    const nodeModulePath = `node_modules/${dep}`;
    const inPackages = lockPackages[nodeModulePath] || lockPackages['']?.dependencies?.[dep];
    const inDeps = lockDeps[dep];

    if (!inPackages && !inDeps) {
      reportError(
        'LOCKFILE_DESYNC',
        PACKAGE_JSON,
        1,
        `Dependency '${dep}' (${reqVersion}) missing in package-lock.json. Run 'npm install'.`,
      );
    }
  }
}

function auditNoEmojis() {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  const docsDir = path.resolve(ROOT_DIR, 'docs');
  const scriptsDir = path.resolve(ROOT_DIR, 'scripts');

  const filesToAudit = [
    ...getAllFiles(SRC_APP_DIR, ['.ts', '.html', '.css'], false),
    ...getAllFiles(path.resolve(__dirname, '../'), ['.js', '.json', '.md'], false),
    ...getAllFiles(docsDir, ['.md', '.txt'], false),
    ...getAllFiles(scriptsDir, ['.js', '.mjs', '.ts', '.md', '.json'], false),
  ];

  const rootFiles = ['README.md', 'AGENTS.md'];
  for (const rf of rootFiles) {
    const fullPath = path.join(ROOT_DIR, rf);
    if (fs.existsSync(fullPath)) {
      filesToAudit.push(fullPath);
    }
  }

  for (const file of filesToAudit) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (emojiRegex.test(line)) {
        reportError('NO_EMOJIS', file, idx + 1, 'Emoji detected. Emojis are strictly prohibited.');
      }
    });
  }
}

auditServiceTests();
auditHexColors();
auditNoDummyData();
auditLockfileSync();
auditNoEmojis();

if (errorCount === 0) {
  console.log('[SUCCESS] Static audit passed: 0 violations.');
  process.exit(0);
} else {
  console.error(`[ERROR] Static audit failed: ${errorCount} violations found.`);
  process.exit(1);
}
