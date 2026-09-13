# [TICK-005]: Visualizador de diferencias de plan Plan Diff Viewer en Workshop Hub

---

## 📌 Metadatos del Ticket

- **ID**: `TICK-005`
- **Estado Actual**: `READY_FOR_DEV`
- **Persona Asignada**: `desarrollador`
- **Rama Asociada**: `feature/TICK-005-visualizador-de-diferencias-de-plan-plan-diff-viewer-en-workshop-hub`
- **Fecha de Creación**: 2026-09-13
- **Última Actualización**: 2026-09-13

---

## 📝 1. Especificación Funcional (Completado por: `analista`)

### Contexto y Problema

> Los estudiantes que están suscritos a un plan de estudio en el Workshop Hub necesitan visualizar exactamente qué asignaturas, correlatividades o cuatrimestres cambiaron cuando se publica una actualización upstream de un plan de estudios, para decidir con total claridad si aceptan o rechazan los cambios sin perder su progreso académico local.

### Historias de Usuario (User Stories - English Format)

```text
As a community plan subscriber
I want to view a visual diff comparison when an updated version of a shared study plan is available in the Workshop Hub
So that I can inspect changes in subjects, prerequisites, and terms before accepting or merging upstream updates into my local plan
```

### Criterios de Aceptación (Gherkin)

```gherkin
Scenario: Comparing local plan version against updated Workshop manifest
  Given an upstream plan update is detected for the active degree plan
  When the student opens the Plan Diff Viewer modal
  Then the system highlights added subjects in green, removed subjects in red, and modified prerequisites in amber
  And displays a side-by-side breakdown of changes per term.

Scenario: Merging plan update while preserving student progress
  Given the student reviews diffs in the Plan Diff Viewer
  When the student confirms "Aplicar Actualización"
  Then the plan structure updates to the latest manifest version
  And all existing subject completion states ("coursing", "coursed", "approved") are preserved without data loss.
```

### Impacto en Servicios y Modelo de Dominio

- **Servicios afectados**: `PlanService`, `PlanSanitizerService`, `PlanLinterService`.
- **Componentes afectados**: `plan-diff-viewer.component`, `workshop-hub.component`.
- **Impacto en CourseStatus**: Preservación inmutable de la capa de progreso del usuario (`UserProgressOverlay`).
- **Impacto en Privacidad**: $k$-anonymity mantenido durante la deserialización del manifiesto.

---

## 💻 2. Registro de Implementación (Completado por: `desarrollador`)

### Estado de Desarrollo: `PENDIENTE`

### Archivos Modificados / Creados

- [NEW] `src/app/features/workshop/plan-diff-viewer/plan-diff-viewer.component.ts`
- [MODIFY] `src/app/services/plan.service.ts`
- [NEW] `src/app/services/plan.service.spec.ts`

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
