# 📋 Registro de Tareas y Features del Proyecto (Single Source of Truth)

> [!IMPORTANT]
> **Aviso de Arquitectura de Tareas**: De acuerdo con las reglas operativas de la Persona `analista`, la lista de pendientes informal (TODO list) ha sido desestimada en favor del **Sistema de Tickets Estructurados** alojado en [`.agents/tickets/`](file:///.agents/tickets/README.md).
>
> Todas las características faltantes, refactorizaciones y mejoras de experiencia de usuario son especificadas por el Analista mediante historias de usuario estructuradas obligatoriamente en **inglés** siguiendo el patrón **Who / What / Why** (`As a... I want... So that...`) y escenarios de aceptación **Gherkin**.

---

## 🎟️ Catálogo Activo de Issues y Tickets (`.agents/tickets/`)

| ID Ticket                                                                                                              | Título del Feature / Issue                                           | Estado Actual   | Responsable     | Historia de Usuario (User Story)                                                                                                                                  |
| :--------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------- | :-------------- | :-------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`TICK-001`](file:///.agents/tickets/TICK-001-soporte-materias-postergadas-on-hold.md)                                 | Soporte de materias postergadas (`on-hold`) en modelo de dominio     | `QA_VERIFIED`   | `qa`            | Domain state machine & status transition rules for paused courses                                                                                                 |
| [`TICK-002`](file:///.agents/tickets/TICK-002-estrategia-obligatoria-de-squash-and-merge-para-pull-requests.md)        | Estrategia obligatoria de Squash and Merge para Pull Requests        | `CLOSED`        | `gitflow`       | Mandatory PR merge strategy policy                                                                                                                                |
| [`TICK-003`](file:///.agents/tickets/TICK-003-identificacion-visual-y-acciones-de-materias-postergadas-en-grilla.md)   | Identificación visual y acciones de materias postergadas en grilla   | `READY_FOR_DEV` | `desarrollador` | _As a university student planning my academic semester, I want subjects marked as "on-hold" to feature a distinct visual badge and contextual action controls..._ |
| [`TICK-004`](file:///.agents/tickets/TICK-004-reglas-de-calendario-y-flujo-correlativo-para-materias-postergadas.md)   | Reglas de calendario y flujo correlativo para materias postergadas   | `READY_FOR_DEV` | `desarrollador` | _As a university student scheduling my weekly classes, I want subjects marked as "on-hold" to be automatically excluded from my weekly timetable..._              |
| [`TICK-005`](file:///.agents/tickets/TICK-005-visualizador-de-diferencias-de-plan-plan-diff-viewer-en-workshop-hub.md) | Visualizador de diferencias de plan Plan Diff Viewer en Workshop Hub | `READY_FOR_DEV` | `desarrollador` | _As a community plan subscriber, I want to view a visual diff comparison when an updated version of a shared study plan is available..._                          |
| [`TICK-006`](file:///.agents/tickets/TICK-006-filtro-y-busqueda-avanzada-de-planes-en-workshop-hub.md)                 | Filtro y búsqueda avanzada de planes en Workshop Hub                 | `READY_FOR_DEV` | `desarrollador` | _As a student exploring community study plans, I want to search and filter plans in the Workshop Hub by university, faculty, degree program..._                   |

---

## 🔄 Flujo Operativo para Nuevas Solicitudes

Para agregar una nueva tarea o feature al proyecto:

1. La persona `analista` ejecuta:
   ```bash
   npm run ticket:new -- "<Nombre descriptivo de la tarea>"
   ```
2. Completa la sección de **Historias de Usuario** en inglés (`As a... I want... So that...`).
3. Define los Criterios de Aceptación en formato **Gherkin**.
4. Pasa el ticket a estado `READY_FOR_DEV`:
   ```bash
   npm run ticket:status -- TICK-XXX READY_FOR_DEV
   ```
