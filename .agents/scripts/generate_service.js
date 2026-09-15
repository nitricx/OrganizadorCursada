#!/usr/bin/env node
/**
 * generate_service.js
 * Deterministic boilerplate generator for OrganizadorCursada Services.
 */
const fs = require('fs');
const path = require('path');

const SERVICES_DIR = path.resolve(__dirname, '../../src/app/services');

function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function toPascalCase(str) {
  return str
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function generateService(name) {
  if (!name) {
    console.error('[ERROR] You must specify the service name.');
    process.exit(1);
  }

  const cleanName = name.replace(/\.service(\.ts)?$/, '');
  const kebabName = toKebabCase(cleanName);
  const className = `${toPascalCase(kebabName)}Service`;

  const serviceFileName = `${kebabName}.service.ts`;
  const specFileName = `${kebabName}.service.spec.ts`;

  const servicePath = path.join(SERVICES_DIR, serviceFileName);
  const specPath = path.join(SERVICES_DIR, specFileName);

  if (fs.existsSync(servicePath)) {
    console.error(`[ERROR] Service ${serviceFileName} already exists.`);
    process.exit(1);
  }

  const serviceContent = `import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ${className} {
  private readonly _state = signal<string[]>([]);
  public readonly state = this._state.asReadonly();

  addItem(item: string): void {
    if (!item) return;
    this._state.set([...this._state(), item]);
  }

  clear(): void {
    this._state.set([]);
  }
}
`;

  const specContent = `import { TestBed } from '@angular/core/testing';
import { ${className} } from './${kebabName}.service';

describe('${className}', () => {
  let service: ${className};

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(${className});
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty state signal', () => {
    expect(service.state()).toEqual([]);
  });

  it('should update state reactively and immutably when adding items', () => {
    service.addItem('sample-item');
    expect(service.state()).toEqual(['sample-item']);
  });

  it('should reset state cleanly on clear()', () => {
    service.addItem('sample-item');
    service.clear();
    expect(service.state()).toEqual([]);
  });
});
`;

  fs.writeFileSync(servicePath, serviceContent, 'utf-8');
  fs.writeFileSync(specPath, specContent, 'utf-8');

  console.log(`[SUCCESS] Generated: src/app/services/${serviceFileName} (+ spec)`);
}

const args = process.argv.slice(2);
generateService(args[0]);
