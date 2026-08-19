# 📋 Lista de Pendientes (Backlog de Proyecto) - OrganizadorCursada

Este archivo documenta las características pendientes, mejoras de experiencia de usuario y refactorizaciones de deuda técnica para trabajar de forma ordenada.

---

## ✅ Épica 1: Selección de Comisión / Docente por Materia (COMPLETADA)
> **Objetivo**: Evitar que al marcar una materia como `coursing` se activen todas sus comisiones/docentes en el calendario semanal. El usuario debe ver únicamente la comisión que eligió cursar.

- [x] **1.1 Modelo de Datos**: Campo `selectedLessonId?: string | null` en `Course` (`src/app/models/course.ts`).
- [x] **1.2 Modal de Selección**: Componente `lesson-selector-modal` para elegir comisión/docente al cursar.
- [x] **1.3 Integración con Calendario**: Filtrado en `CalendarService`/`CourseService` para proyectar únicamente la comisión seleccionada en el horario semanal (`/myWeek`).

---

## ⏸️ Épica 2: Gestión de Materias "En Pausa" / Postergadas
> **Objetivo**: Permitir al usuario poner en pausa materias que cumple correlatividades para cursar pero que decide no realizar en el cuatrimestre vigente.

- [ ] **2.1 Extensión de Estados de Cursada**
  - Incorporar el estado `'on-hold'` (En Pausa / Postergada) en `CourseStatus` (`pending` | `coursing` | `coursed` | `approved` | `on-hold`).
  - Adaptar la máquina de estados y las funciones de validación de correlatividades (`canChangeStatusTo`).
- [ ] **2.2 Identificación Visual en Grilla (`/home`)**
  - Diseñar badge y estilos CSS para indicar visualmente que una materia está "En Pausa".
  - Agregar botón de acción / menú contextual para pausar o reanudar una materia.
- [ ] **2.3 Reglas en Calendario y Siguientes Niveles**
  - Asegurar que materias en pausa no se consideren activas en "Mi Semana" y no bloqueen incorrectamente flujo de materias dependientes.

---

## 🛒 Épica 3: Mejoras en Workshop Hub & Visualización de Cambios (Plan Diff Viewer)
> **Objetivo**: Mejorar la experiencia de suscripción a planes comunitarios y resolución de conflictos al actualizar planes upstream.

- [ ] **3.1 Visualizador de Diferencias (Plan Diff Viewer)**
  - Mejorar componente `plan-diff-viewer` para resaltar diferencias entre versiones de un mismo plan (nuevas materias, cambios de correlatividades o cuatrimestre).
- [ ] **3.2 Filtro y Búsqueda Avanzada en Workshop**
  - Filtrado por Universidad, Facultad y popularidad/calificaciones anónimas.
