# [TICK-006]: Filtro y búsqueda avanzada de planes en Workshop Hub

---

## 📌 Metadatos del Ticket

- **ID**: `TICK-006`
- **Estado Actual**: `READY_FOR_DEV`
- **Persona Asignada**: `desarrollador`
- **Rama Asociada**: `feature/TICK-006-filtro-y-busqueda-avanzada-de-planes-en-workshop-hub`
- **Fecha de Creación**: 2026-09-13
- **Última Actualización**: 2026-09-13

---

## 📝 1. Especificación Funcional (Completado por: `analista`)

### Contexto y Problema

> A medida que la comunidad de estudiantes comparte planes de estudio en el Workshop Hub, se dificulta encontrar planes de una facultad o universidad específica. Se requiere un mecanismo de búsqueda en tiempo real y filtrado por facetas (Universidad, Facultad, Popularidad/Calificaciones anónimas) sin vulnerar el anonimato ni la privacidad.

### Historias de Usuario (User Stories - English Format)

```text
As a student exploring community study plans
I want to search and filter plans in the Workshop Hub by university, faculty, degree program, and anonymous rating metrics
So that I can quickly discover verified, high-quality study plans tailored to my specific degree program
```

### Criterios de Aceptación (Gherkin)

```gherkin
Scenario: Filtering Workshop plans by university and faculty
  Given the student is on the Workshop Hub view
  When the student selects "Universidad Nacional de La Plata" in the university filter dropdown
  Then the plan grid filters dynamically to show only manifests originating from UNLP
  And empty result states prompt clear guidance to reset filters.

Scenario: Searching plans by keyword
  Given a list of community study plans in the catalog
  When the student types "Sistemas" into the search bar
  Then the view updates in real time to present plans whose degree title or tags match the search query.
```

### Impacto en Servicios y Modelo de Dominio

- **Servicios afectados**: `CareerService`, `PlanSanitizerService`.
- **Componentes afectados**: `workshop-hub.component`, `plan-search-filters.component`.
- **Impacto en Privacidad**: $k$-anonymity mantenido durante búsquedas y agregados de calificación.

---

## 💻 2. Registro de Implementación (Completado por: `desarrollador`)

### Estado de Desarrollo: `PENDIENTE`

### Archivos Modificados / Creados

- [NEW] `src/app/features/workshop/plan-search-filters/plan-search-filters.component.ts`
- [MODIFY] `src/app/services/career.service.ts`
- [NEW] `src/app/services/career.service.spec.ts`

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
