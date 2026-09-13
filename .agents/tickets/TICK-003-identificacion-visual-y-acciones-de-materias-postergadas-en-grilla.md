# [TICK-003]: Identificación visual y acciones de materias postergadas en grilla

---

## 📌 Metadatos del Ticket

- **ID**: `TICK-003`
- **Estado Actual**: `READY_FOR_DEV`
- **Persona Asignada**: `desarrollador`
- **Rama Asociada**: `feature/TICK-003-identificacion-visual-y-acciones-de-materias-postergadas-en-grilla`
- **Fecha de Creación**: 2026-09-13
- **Última Actualización**: 2026-09-13

---

## 📝 1. Especificación Funcional (Completado por: `analista`)

### Contexto y Problema

> Al incorporar el estado `on-hold` en la máquina de estados del dominio, el estudiante necesita identificar rápidamente en la vista principal (`/home`) cuáles materias han sido postergadas o puestas en pausa, y poder cambiar este estado de forma intuitiva a través de controles visuales sin afectar negativamente la accesibilidad.

### Historias de Usuario (User Stories - English Format)

```text
As a university student planning my academic semester
I want subjects marked as "on-hold" to feature a distinct visual badge and contextual action controls on the course grid
So that I can clearly distinguish paused courses from active ones and easily toggle their status without cluttering my study dashboard
```

### Criterios de Aceptación (Gherkin)

```gherkin
Scenario: Visual badge rendering for on-hold courses
  Given the student views the course grid on "/home"
  And a subject has status set to "on-hold"
  When the course card renders
  Then the system displays an "En Pausa" badge using theme design tokens
  And dimmed card styling indicates the paused condition.

Scenario: Toggling course status to on-hold from context menu
  Given a subject with status "pending" fulfills all prerequisite requirements
  When the student selects "Pausar Materia" from the card action menu
  Then the subject status updates to "on-hold"
  And the state change persists in local storage under the Privacy Airgap.

Scenario: Resuming an on-hold course
  Given a subject currently in "on-hold" status
  When the student clicks the action button "Reanudar"
  Then the subject returns to "pending" (or eligible active state)
  And prerequisite validation recalculates downstream dependencies.
```

### Impacto en Servicios y Modelo de Dominio

- **Servicios afectados**: `CourseService` (Signals de estado e inmutabilidad).
- **Componentes afectados**: `course-card.component`, `course-grid.component`, `course-organizer-legend.component`.
- **Impacto en CourseStatus**: Renderizado de estado `'on-hold'`.
- **Impacto en Privacidad**: Persistencia exclusiva en `localStorage` (`UserProgressOverlay`).

---

## 💻 2. Registro de Implementación (Completado por: `desarrollador`)

### Estado de Desarrollo: `PENDIENTE`

### Archivos Modificados / Creados

- [MODIFY] `src/app/features/dashboard/course-card/course-card.component.ts`
- [MODIFY] `src/app/features/dashboard/course-card/course-card.component.html`
- [MODIFY] `src/app/services/course.service.ts`
- [NEW] `src/app/services/course.service.spec.ts`

### Checklist Pre-QA del Desarrollador

- [ ] Todo el código de negocio reside en Servicios, no en Componentes.
- [ ] Se crearon/actualizaron tests unitarios en `*.service.spec.ts`.
- [ ] La suite de tests unitarios pasa limpia localmente (`npm test -- --watch=false`).
- [ ] No se utilizaron colores hexadecimales hardcodeados (solo CSS tokens de `src/styles.css`).
- [ ] No se inventaron datos dummy ni mocks ficticios.
- [ ] Los datos del estudiante se mantienen dentro del Privacy Airgap.

---

## 🔍 3. Certificación de Calidad (Completado por: `qa`)

### Estado de QA: `EN_REVISION`

---

## 🚀 4. Cierre y Release (Completado por: `gitflow`)

- **Estado Final**: `READY_FOR_DEV`
