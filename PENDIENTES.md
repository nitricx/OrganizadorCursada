# 📋 Lista de Pendientes (Backlog de Proyecto) - OrganizadorCursada

Este archivo documenta las características pendientes, mejoras de experiencia de usuario y refactorizaciones de deuda técnica para trabajar de forma ordenada.

---

## 🎯 Épica 1: Selección de Comisión / Docente por Materia
> **Objetivo**: Evitar que al marcar una materia como `coursing` se activen todas sus comisiones/docentes en el calendario semanal. El usuario debe ver únicamente la comisión que eligió cursar.

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

---

## 🎨 Épica 4: Mejoras de UX, Accesibilidad y Feedback
> **Objetivo**: Elevar la calidad visual y la experiencia interactiva del usuario.

- [x] **4.1 Drag & Drop Estándar**
  - Migrar el arrastre manual por eventos de puntero en `CalendarCard` hacia Angular CDK DragDrop o HTML5 Drag API para mejorar soporte táctil y accesibilidad por teclado.
- [x] **4.2 Servicio Centralizado de Notificaciones (Toasts)**
  - Reemplazar el manejo manual de `setTimeout` fuera de NgZone en `AcademicCalendarComponent` por un `ToastService` inyectable y reutilizable.

---

## 🎓 Épica 5: Soporte Multicarrera y Carga Dinámica vía JSON
> **Objetivo**: Permitir cambiar de carrera y mostrar el nuevo conjunto de materias dinámicamente desde archivos `.json` sin recompilar la aplicación.

- [x] **5.1 Modelo de Datos y Servicio de Carga (`CareerService`)**
  - Crear modelo `CareerPlan` y `CareerService` utilizando Angular `HttpClient` para cargar planes desde `/assets/careers/` o archivos `.json` locales importados por el usuario.
- [x] **5.2 Catálogo Inicial JSON**
  - Migrar `courses.data.ts` a `public/careers/audiovisual.json` y crear el índice `careers.json`.
- [x] **5.3 Reactividad en `CourseService` y `PlanService`**
  - Asociar cada plan de estudio a una carrera activa y aislar el almacenamiento de `localStorage` por carrera/plan.
- [x] **5.4 UI Selector de Carrera y Carga de Archivos**
  - Implementar selector de carreras e importador de archivos `.json` en la interfaz.
- [x] **5.5 Pruebas Unitarias**
  - Añadir suite de pruebas en `career.service.spec.ts` y validar el cambio reactivo de materias.


