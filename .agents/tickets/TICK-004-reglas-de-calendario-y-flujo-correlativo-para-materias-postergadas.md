# [TICK-004]: Reglas de calendario y flujo correlativo para materias postergadas

---

## 📌 Metadatos del Ticket

- **ID**: `TICK-004`
- **Estado Actual**: `READY_FOR_DEV`
- **Persona Asignada**: `desarrollador`
- **Rama Asociada**: `feature/TICK-004-reglas-de-calendario-y-flujo-correlativo-para-materias-postergadas`
- **Fecha de Creación**: 2026-09-13
- **Última Actualización**: 2026-09-13

---

## 📝 1. Especificación Funcional (Completado por: `analista`)

### Contexto y Problema

> Cuando una materia entra en estado `on-hold` (En Pausa), sus comisiones no deben incluirse en la grilla semanal del calendario ("Mi Semana") ni generar conflictos de horario. Asimismo, las materias en pausa no se consideran cursadas ni aprobadas a los fines de desbloquear correlativas posteriores, pero tampoco deben distorsionar las sugerencias del organizador.

### Historias de Usuario (User Stories - English Format)

```text
As a university student scheduling my weekly classes
I want subjects marked as "on-hold" to be automatically excluded from my weekly timetable and prevent blocking downstream prerequisite calculations
So that my weekly schedule remains clear of paused subjects and I am not restricted from taking independent available courses
```

### Criterios de Aceptación (Gherkin)

```gherkin
Scenario: Exclusion of on-hold subjects from weekly calendar
  Given a student has assigned commissions for a subject
  When the student changes the subject status to "on-hold"
  Then the calendar timetable view removes all scheduled slots for that subject from "Mi Semana"
  And exportable calendar files (.ics) exclude the paused subject.

Scenario: Prerequisite validation for downstream subjects when prerequisite is on-hold
  Given subject "Algebra 2" requires subject "Algebra 1" in "coursed" or "approved" state
  And "Algebra 1" is set to "on-hold"
  When the student attempts to set "Algebra 2" to "coursing"
  Then the system blocks the transition
  And prompts a clear alert that prerequisite "Algebra 1" is paused and not completed.
```

### Impacto en Servicios y Modelo de Dominio

- **Servicios afectados**: `CourseService`, `CalendarExportService`.
- **Componentes afectados**: `calendar.component`, `calendar-card.component`.
- **Impacto en CourseStatus**: Reglas de validación para `canChangeStatusTo`.
- **Impacto en Privacidad**: Persistencia local estricta en `localStorage`.

---

## 💻 2. Registro de Implementación (Completado por: `desarrollador`)

### Estado de Desarrollo: `PENDIENTE`

### Archivos Modificados / Creados

- [MODIFY] `src/app/services/course.service.ts`
- [MODIFY] `src/app/services/calendar-export.service.ts`
- [MODIFY] `src/app/services/course.service.spec.ts`

### Checklist Pre-QA del Desarrollador

- [ ] Todo el código de negocio reside en Servicios, no en Componentes.
- [ ] Se crearon/actualizaron tests unitarios en `*.service.spec.ts`.
- [ ] La suite de tests unitarios pasa limpia localmente (`npm test -- --watch=false`).
- [ ] No se utilizaron colores hexadecimales hardcodeados.
- [ ] Los datos del estudiante se mantienen dentro del Privacy Airgap.

---

## 🔍 3. Certificación de Calidad (Completado por: `qa`)

### Estado de QA: `EN_REVISION`

---

## 🚀 4. Cierre y Release (Completado por: `gitflow`)

- **Estado Final**: `READY_FOR_DEV`
