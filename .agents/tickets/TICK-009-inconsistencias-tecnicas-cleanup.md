# [TICK-009]: Corrección de inconsistencias técnicas: hex colors, sidebar dead events, y E2E phantoms

---

## 📌 Metadatos del Ticket

- **ID**: `TICK-009`
- **Estado Actual**: `READY_FOR_DEV`
- **Persona Asignada**: `desarrollador`
- **Rama Asociada**: `feature/TICK-009-inconsistencias-tecnicas-cleanup`
- **Fecha de Creación**: 2026-09-13
- **Última Actualización**: 2026-09-13

---

## 📝 1. Especificación Funcional (Completado por: `analista`)

### Contexto y Problema

> This is a technical debt cleanup ticket addressing 3 categories of inconsistencies:
> - **Category A**: Hardcoded hex colors in `src/styles.css` violating the Zero Hex Colors rule.
> - **Category B**: Sidebar dead event bindings in `sidebar.component.ts`. The events `onOpenWorkshop` and `onOpenPublisher` exist but no sidebar items trigger them. Missing items for Workshop Hub and Plan Publisher should be added to the sidebar.
> - **Category C**: CSS budget warning in `career-builder.component.css` exceeding the 12 kB limit.

### Historias de Usuario (User Stories - English Format)

```text
As a developer
I want all technical inconsistencies (hex color violations, dead sidebar events, and CSS budget warnings) resolved
So that the codebase complies with the 4 Inviolable Repository Rules and the build produces zero warnings
```

### Criterios de Aceptación (Gherkin)

```gherkin
Scenario: Hex colors rule compliance
  Given there are hardcoded hex colors outside CSS custom property definitions
  When the developer replaces them with design tokens in "src/styles.css"
  Then running "npm run qa:audit" should detect zero hardcoded hex color usages.

Scenario: Sidebar dead event bindings fix
  Given the sidebar has outputs for "onOpenWorkshop" and "onOpenPublisher" but no triggering items
  When the developer adds the missing sidebar items for Workshop Hub and Plan Publisher
  Then Workshop Hub and Plan Publisher should be accessible from the sidebar navigation.

Scenario: CSS budget warning resolution
  Given "career-builder.component.css" exceeds the 12 kB component style budget
  When the developer optimizes the CSS to reduce its size
  Then running "npm run build" should produce zero budget warnings.
```

### Impacto en Servicios y Modelo de Dominio

- **Servicios afectados**: Ninguno.
- **Componentes afectados**: `sidebar.component.ts`, `career-builder.component`
- **Archivos específicos a modificar**:
  - `src/styles.css` (líneas 617, 630): Reemplazar colores hex por tokens `var(--color-danger-text)` y un token para background/hover.
  - `src/app/shared/components/sidebar/sidebar.component.ts` (líneas 25-29): Añadir items de sidebar para disparar `open_workshop` y `open_publisher`.
  - `src/app/features/career-builder/career-builder.component.css` (or equivalent): Reducir tamaño y evitar budget warning.
- **Impacto en CourseStatus**: Ninguno.
- **Impacto en Privacidad**: Ninguno.

---

## 💻 2. Registro de Implementación (Completado por: `desarrollador`)

### Estado de Desarrollo: `PENDIENTE`

### Archivos Modificados / Creados

- [MODIFY] `src/styles.css`
- [MODIFY] `src/app/shared/components/sidebar/sidebar.component.ts`
- [MODIFY] `src/app/features/career-builder/career-builder.component.css` (or equivalent)

### Checklist Pre-QA del Desarrollador

- [ ] Todo el código de negocio reside en Servicios, no en Componentes.
- [ ] Se crearon/actualizaron tests unitarios en `*.service.spec.ts`.
- [ ] La suite de tests unitarios pasa limpia localmente (`npm test -- --watch=false`).
- [ ] No se utilizaron colores hexadecimales hardcodeados (solo CSS tokens de `src/styles.css`).
- [ ] No se inventaron datos dummy ni mocks ficticios.
- [ ] Los datos del estudiante se mantienen dentro del Privacy Airgap.

---

## 🔍 3. Certificación de Calidad (Completado por: `qa`)

### Estado de QA: `PENDIENTE`

---

## 🚀 4. Cierre y Release (Completado por: `gitflow`)

- **Estado Final**: `READY_FOR_DEV`
