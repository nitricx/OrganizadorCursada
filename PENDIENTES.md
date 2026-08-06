# 📋 Lista de Pendientes (Backlog de Proyecto) - OrganizadorCursada

Este archivo documenta las características pendientes, mejoras de experiencia de usuario y refactorizaciones de deuda técnica para trabajar de forma ordenada.

---

## 🎯 Épica 1: Selección de Comisión / Docente por Materia
> **Objetivo**: Evitar que al marcar una materia como `coursing` se activen todas sus comisiones/docentes en el calendario semanal. El usuario debe ver únicamente la comisión que eligió cursar.

- [ ] **1.1 Modelo y Estado en `CourseService`**
  - Añadir soporte para comisión seleccionada por materia (`selectedLessonId` o mapeo `courseId -> lessonId`).
  - Modificar `toggleCourseStatus` para que no fuerce todas las `lessons` a `coursing` de forma masiva.
- [ ] **1.2 Componente Selector de Comisión (UI)**
  - Crear un modal / popover desplegable para elegir comisión cuando una materia tenga múltiples opciones de horario/docente.
  - Permitir cambiar la comisión elegida en cualquier momento desde la ficha de la materia o desde el calendario.
- [ ] **1.3 Filtrado en "Mi Semana" (`/myWeek`)**
  - Actualizar la vista del calendario semanal para mostrar **únicamente** la comisión activa seleccionada por el usuario.
- [ ] **1.4 Pruebas Unitarias**
  - Añadir tests en `course.service.spec.ts` y `calendar.spec.ts` verificando la selección de comisión única.

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

## 🧹 Épica 3: Refactorización de Deuda Técnica y Code Smells
> **Objetivo**: Mejorar la mantenibilidad, consistencia de estado y legibilidad del código.

- [ ] **3.1 Consolidación de Fuentes de Verdad de Estado**
  - Eliminar el desfasaje entre `courseStatusesSignal` y `lessonStatusesSignal`, creando una estructura reactiva unificada.
- [ ] **3.2 Normalización de IDs al Mover Materias**
  - Refactorizar `moveLessonToSemester()` en `CourseService` para evitar la generación de IDs sintéticos tipo `${id}-Y2Q1` que duplican materias en el mapa de correlatividades.
- [ ] **3.3 Correlatividades por ID Único**
  - Migrar `cursarReq` y `aprobarReq` para usar IDs de materia estables en lugar de coincidencia por strings de nombre plano.
- [ ] **3.4 Desacoplamiento de Lógica de Grilla de Calendario**
  - Extraer cálculos de solapamiento de horarios, conversión de tiempos y generación de franjas de `calendar.ts` hacia una utilidad pura `calendar-layout.utils.ts`.

---

## 🎨 Épica 4: Mejoras de UX, Accesibilidad y Feedback
> **Objetivo**: Elevar la calidad visual y la experiencia interactiva del usuario.

- [ ] **4.1 Drag & Drop Estándar**
  - Migrar el arrastre manual por eventos de puntero en `CalendarCard` hacia Angular CDK DragDrop o HTML5 Drag API para mejorar soporte táctil y accesibilidad por teclado.
- [ ] **4.2 Servicio Centralizado de Notificaciones (Toasts)**
  - Reemplazar el manejo manual de `setTimeout` fuera de NgZone en `AcademicCalendarComponent` por un `ToastService` inyectable y reutilizable.
