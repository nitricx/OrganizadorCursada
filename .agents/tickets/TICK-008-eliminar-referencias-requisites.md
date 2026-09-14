# [TICK-008]: Eliminación de toda referencia a la ruta `/requisites` y al componente `requisites-flow`

---

## 📌 Metadatos del Ticket

- **ID**: `TICK-008`
- **Estado Actual**: `READY_FOR_DEV`
- **Persona Asignada**: `desarrollador`
- **Rama Asociada**: `feature/TICK-008-eliminar-referencias-requisites`
- **Fecha de Creación**: 2026-09-13
- **Última Actualización**: 2026-09-13

---

## 📝 1. Especificación Funcional (Completado por: `analista`)

### Contexto y Problema

> The `/requisites` route and `requisites-flow` component were planned but never implemented and will NOT be implemented. The feature does not exist and should not exist. All phantom references across the codebase must be purged to maintain clean documentation and code.

### Historias de Usuario (User Stories - English Format)

```text
As a developer contributing to OrganizadorCursada
I want all phantom references to the never-implemented `/requisites` route and `requisites-flow` component to be removed from the codebase
So that the documentation, tests, and route configuration accurately reflect the application's actual capabilities
```

### Criterios de Aceptación (Gherkin)

```gherkin
Scenario: Route cleanup
  Given the codebase contains phantom references to "/requisites"
  When the developer removes the route entry from "app.routes.ts"
  Then navigating to "/requisites" should NOT be a defined route (or redirect)
  And the route should simply not exist.

Scenario: E2E test cleanup
  Given E2E tests currently attempt to navigate to "/requisites"
  When the developer deletes or rewrites these tests
  Then all E2E tests should pass without referencing "/requisites"
  And without clicking non-existent "Correlatividades" sidebar links.

Scenario: Documentation accuracy
  Given documentation files mention "/requisites" and "requisites-flow"
  When the developer updates "README.md" and all ".agents/skills/" files
  Then these files should not mention "/requisites" or "requisites-flow" as an existing feature.
```

### Impacto en Servicios y Modelo de Dominio

- **Servicios afectados**: N/A (Cleanup only).
- **Componentes afectados**: `no-plan-selected`
- **Archivos específicos a limpiar**:
  - `src/app/app.routes.ts` (línea 13)
  - `src/app/shared/components/no-plan-selected/no-plan-selected.component.ts` (línea 28)
  - `e2e/course-navigation.spec.ts` (líneas 40-42)
  - `e2e/course-status-workflow.spec.ts` (línea 34)
  - `e2e/no-plan-selected-state.spec.ts` (líneas 3, 37-38, 66-67)
  - `README.md` (líneas 23-26, 79, 90)
  - `docs/aws_deployment_guide.md` (línea 112)
  - `.agents/rules/project-structure.md` (línea 9)
  - `.agents/skills/analista/SKILL.md` (línea 97)
  - `.agents/skills/qa/SKILL.md` (línea 129)
  - `.agents/skills/e2e-playwright/SKILL.md` (línea 18)
  - `.agents/skills/organizador-cursada/SKILL.md` (líneas 114-115)
- **Impacto en CourseStatus**: Ninguno.
- **Impacto en Privacidad**: Ninguno.

---

## 💻 2. Registro de Implementación (Completado por: `desarrollador`)

### Estado de Desarrollo: `PENDIENTE`

### Archivos Modificados / Creados

- [MODIFY] `src/app/app.routes.ts`
- [MODIFY] `src/app/shared/components/no-plan-selected/no-plan-selected.component.ts`
- [MODIFY] `e2e/course-navigation.spec.ts`
- [MODIFY] `e2e/course-status-workflow.spec.ts`
- [MODIFY] `e2e/no-plan-selected-state.spec.ts`
- [MODIFY] `README.md`
- [MODIFY] `docs/aws_deployment_guide.md`
- [MODIFY] `.agents/rules/project-structure.md`
- [MODIFY] `.agents/skills/analista/SKILL.md`
- [MODIFY] `.agents/skills/qa/SKILL.md`
- [MODIFY] `.agents/skills/e2e-playwright/SKILL.md`
- [MODIFY] `.agents/skills/organizador-cursada/SKILL.md`

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
