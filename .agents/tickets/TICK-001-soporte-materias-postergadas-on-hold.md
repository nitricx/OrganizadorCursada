# [TICK-001]: Soporte materias postergadas on-hold

---

## 📌 Metadatos del Ticket

- **ID**: `TICK-001`
- **Estado Actual**: `QA_VERIFIED` <!-- Opciones: DRAFT | READY_FOR_DEV | IN_DEVELOPMENT | READY_FOR_QA | QA_VERIFIED | REJECTED | CLOSED -->
- **Persona Asignada**: `qa` <!-- Opciones: analista | desarrollador | qa | gitflow -->
- **Rama Asociada**: `feature/TICK-001-soporte-materias-postergadas-on-hold`
- **Fecha de Creación**: 2026-09-13
- **Última Actualización**: 2026-09-13

---

## 📝 1. Especificación Funcional (Completado por: `analista`)

### Contexto y Problema

> Descripción clara del problema del estudiante o de la necesidad funcional que aborda este ticket.

### Historias de Usuario

```text
Como [rol del usuario: estudiante / asesor de carrera]
Quiero [capacidad o acción]
Para que [beneficio o resultado esperado]
```

### Criterios de Aceptación (Gherkin)

```gherkin
Escenario: Caso de éxito principal
  Dado que el estudiante se encuentra en la pantalla X
  Y tiene la materia "M" en estado "pending"
  Cuando realiza la acción Y
  Entonces el sistema responde con Z
  Y se persiste el cambio en el almacenamiento local.

Escenario: Caso de error o validación de correlatividad
  Dado que la materia dependiente "B" requiere a "A"
  Cuando el estudiante intenta cambiar "B" a "coursing" sin cumplir "A"
  Entonces el sistema bloquea la transición
  Y muestra una notificación de advertencia.
```

### Impacto en Servicios y Modelo de Dominio

- **Servicios afectados**: `CourseService` / `PlanService` / `CareerService` / etc.
- **Componentes afectados**: `course-card`, `calendar`, etc.
- **Impacto en CourseStatus**: ¿Afecta transiciones de estado? ¿Respeta la regla de downstream lock?
- **Impacto en Privacidad**: ¿Respeta el Local Airgap (`localStorage`)?

---

## 💻 2. Registro de Implementación (Completado por: `desarrollador`)

### Estado de Desarrollo: `PENDIENTE` | `EN_CURSO` | `COMPLETADO`

### Archivos Modificados / Creados

- [NEW] `src/app/services/.../nombre.service.ts`
- [NEW] `src/app/services/.../nombre.service.spec.ts`
- [MODIFY] `src/app/features/.../componente.ts`

### Enfoque Técnico y Decisiones de Diseño

- Breve resumen de cómo se implementó la solución.
- Uso de Signals reactivos (`signal()`, `computed()`).
- Emisión inmutable de colecciones (`set(new Map(...))`, `set([...list])`).

### Checklist Pre-QA del Desarrollador

- [ ] Todo el código de negocio reside en Servicios, no en Componentes.
- [ ] Se crearon/actualizaron tests unitarios en `*.service.spec.ts`.
- [ ] La suite de tests unitarios pasa limpia localmente (`npm test -- --watch=false`).
- [ ] No se utilizaron colores hexadecimales hardcodeados (solo CSS tokens de `src/styles.css`).
- [ ] No se inventaron datos dummy ni mocks ficticios.
- [ ] Los datos del estudiante se mantienen dentro del Privacy Airgap.

---

## 🔍 3. Certificación de Calidad (Completado por: `qa`)

### Estado de QA: `EN_REVISION` | `QA_VERIFIED` | `REJECTED`

### Registro de Pruebas Ejecutadas

| Tipo de Prueba               | Comando Ejecutado           |  Resultado  | Observaciones                  |
| :--------------------------- | :-------------------------- | :---------: | :----------------------------- |
| **Tests Unitarios (Vitest)** | `npm test -- --watch=false` | PASS / FAIL | N specs pasados, 0 fallidos    |
| **Compilación & Tipos**      | `npm run build`             | PASS / FAIL | Bundle generado sin errores TS |
| **Tests E2E (Playwright)**   | `npm run test:e2e`          | PASS / FAIL | Flujo verificado en navegador  |

### Validación de Criterios de Aceptación (Gherkin)

- [ ] Escenario 1: Cumplido satisfactoriamente.
- [ ] Escenario 2: Cumplido satisfactoriamente.

### Auditoría de Reglas Inviolables

- [ ] Regla 1 (Sin Dummy Data): Verificada.
- [ ] Regla 2 (Tests Unitarios de Servicios): Verificada.
- [ ] Regla 3 (Zero Hex Colors): Verificada.
- [ ] Regla 4 (Privacy Airgap): Verificada.

### Dictamen de QA

> **Veredicto**: `APROBADO (QA_VERIFIED)` / `RECHAZADO (REJECTED)`
>
> _Detalle o Bug Report (en caso de rechazo)_:
> (Describir los pasos para reproducir el fallo y el comportamiento inesperado para que el desarrollador lo subsane).

---

## 🚀 4. Cierre y Release (Completado por: `gitflow`)

- **Commit Hash**: `abc1234`
- **Mensaje de Commit**: `feat(scope): ...`
- **Pull Request**: `#XX` hacia `develop`
- **Estado Final**: `CLOSED`
