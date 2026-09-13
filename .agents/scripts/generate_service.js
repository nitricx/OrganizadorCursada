#!/usr/bin/env node
/**
 * generate_service.js
 * Generador de boilerplate determinístico para Servicios de OrganizadorCursada.
 * Genera el par *.service.ts y *.service.spec.ts con arquitectura obligatoria de Signals:
 * - Signal privado WritableSignal.
 * - Signal público readonly via .asReadonly().
 * - Spec con TestBed y Vitest.
 *
 * Uso:
 *   node generate_service.js <nombre>
 *   Ejemplo: node generate_service.js course-reminder
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
    console.error('❌ Error: Debes especificar el nombre del servicio.');
    console.error('Uso: node generate_service.js <nombre>');
    process.exit(1);
  }

  // Quitar sufijo .service si el usuario lo puso
  const cleanName = name.replace(/\.service(\.ts)?$/, '');
  const kebabName = toKebabCase(cleanName);
  const className = `${toPascalCase(kebabName)}Service`;

  const serviceFileName = `${kebabName}.service.ts`;
  const specFileName = `${kebabName}.service.spec.ts`;

  const servicePath = path.join(SERVICES_DIR, serviceFileName);
  const specPath = path.join(SERVICES_DIR, specFileName);

  if (fs.existsSync(servicePath)) {
    console.error(`❌ Error: El servicio ${serviceFileName} ya existe.`);
    process.exit(1);
  }

  // Plantilla del Servicio con Signals
  const serviceContent = `import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ${className} {
  // Estado privado mutable mediante Signals
  private readonly _state = signal<string[]>([]);

  // Estado público expuesto exclusivamente como solo lectura
  public readonly state = this._state.asReadonly();

  /**
   * Actualiza el estado emitiendo siempre una nueva instancia para garantizar reactividad.
   */
  addItem(item: string): void {
    if (!item) return;
    this._state.set([...this._state(), item]);
  }

  /**
   * Limpia el estado.
   */
  clear(): void {
    this._state.set([]);
  }
}
`;

  // Plantilla del Spec con Vitest
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

  console.log(`✅ Par de Servicio + Spec generado con éxito:`);
  console.log(`  📄 Servicio: src/app/services/${serviceFileName}`);
  console.log(`  🧪 Test:     src/app/services/${specFileName}`);
  console.log(`💡 Arquitectura de Signals y TestBed configurada automáticamente.`);
}

const args = process.argv.slice(2);
generateService(args[0]);
