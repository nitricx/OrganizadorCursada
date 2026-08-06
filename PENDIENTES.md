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


