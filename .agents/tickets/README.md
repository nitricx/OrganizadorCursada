# 🎟️ Sistema de Tickets para Agentes de IA (`.agents/tickets/`)

Este directorio aloja los tickets de trabajo que articulan el flujo de desarrollo entre las distintas Personas de IA (**Analista**, **Desarrollador**, **QA**, **GitFlow**).

---

## 🧭 Convención de Nombres de Archivo

Cada ticket debe crearse a partir de [`TEMPLATE.md`](./TEMPLATE.md) con el siguiente formato:

```text
TICK-<NÚMERO>-<nombre-descriptivo-kebab-case>.md
```

Ejemplos:

- `TICK-001-estado-on-hold-materias.md`
- `TICK-002-validacion-solapamiento-comisiones.md`
- `TICK-003-plan-diff-viewer-workshop.md`

---

## 🔄 Máquina de Estados del Ticket

```
[DRAFT]
   │ (Analista define contexto, US y Gherkin)
   ▼
[READY_FOR_DEV]
   │ (Desarrollador toma la tarea)
   ▼
[IN_DEVELOPMENT]
   │ (Desarrollador implementa código + tests)
   ▼
[READY_FOR_QA]
   │ (QA ejecuta validaciones y audita)
   ├────────────────────────┐
   ▼ (Fallo)                ▼ (Éxito)
[REJECTED]            [QA_VERIFIED]
   │                        │
   │ (Vuelve a Dev)         ▼ (GitFlow integra)
   └────────────────>   [CLOSED]
```

| Estado           |            Responsable Actual            | Acción Requerida                                                           |
| :--------------- | :--------------------------------------: | :------------------------------------------------------------------------- |
| `DRAFT`          |                `analista`                | Redacción de requerimientos y criterios Gherkin.                           |
| `READY_FOR_DEV`  | `analista` $\rightarrow$ `desarrollador` | Ticket listo para que un desarrollador inicie la implementación.           |
| `IN_DEVELOPMENT` |             `desarrollador`              | Desarrollo activo de servicios, componentes y tests unitarios.             |
| `READY_FOR_QA`   |    `desarrollador` $\rightarrow$ `qa`    | Código y tests completados; listo para auditoría y certificación.          |
| `REJECTED`       |    `qa` $\rightarrow$ `desarrollador`    | Se detectaron fallas o regresiones. Requiere corrección por parte del dev. |
| `QA_VERIFIED`    |       `qa` $\rightarrow$ `gitflow`       | Certificación aprobada. Listo para commit y PR hacia `develop`.            |
| `CLOSED`         |                `gitflow`                 | Rama integrada y ticket archivado/cerrado.                                 |

---

## 🚫 Reglas de Handoff

1. **Un desarrollador NUNCA debe comenzar una tarea sin un ticket en `READY_FOR_DEV`**.
2. **Un desarrollador NUNCA debe pasar un ticket a `CLOSED`**. Solo `gitflow` puede cerrar tras la aprobación de `qa`.
3. **QA es la ÚNICA persona con autoridad para emitir `QA_VERIFIED`**.
