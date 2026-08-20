# Datos de Sembrado de Planes de Estudio (`scripts/seed-data`)

Este directorio contiene los archivos JSON que representan los planes de estudio iniciales cargados en la base de datos de la plataforma (**OrganizadorCursada**) a través de Firestore (`scripts/seed-firestore.js`).

---

## 🤖 Guía y Regla de Oro para Agentes IA

> [!IMPORTANT]
> **ESTRICTA FIDELIDAD DE DATOS (CERO INVENCIÓN):**
> Al procesar o crear planes mediante IA:
> 1. **NO inventar profesores, horarios ni comisiones ficticias.** Si el plan fuente provisto por el usuario no especifica horarios/comisiones, colocar `"lessons": []`.
> 2. **NO inferir ni adivinar correlativas.** Incluir únicamente las correlatividades estipuladas explícitamente en el plan oficial.
> 3. **Usar únicamente la información oficial proporcionada por el usuario.**

👉 **[Ver Guía Completa de Estructuración y Fidelidad de Datos (`docs/seed-data-guide.md`)](../../docs/seed-data-guide.md)**

---

## 📋 Resumen Rápido del Esquema JSON

```json
{
  "id": "slug-carrera-universidad",
  "name": "Nombre Oficial de la Carrera",
  "university": "Nombre Oficial de la Universidad",
  "faculty": "Facultad o Sede",
  "version": "Año o Código del Plan",
  "updatedAt": "YYYY-MM-DD",
  "courses": [
    {
      "id": 1,
      "name": "Nombre Exacto de la Materia",
      "year": 1,
      "q": 1,
      "cursarReqId": [],
      "aprobarReqId": [],
      "lessons": []
    }
  ]
}
```

### Reglas Clave:
1. `id` de la materia: Número entero positivo único (1, 2, 3...).
2. `cursarReqId` y `aprobarReqId`: Arreglos con los IDs numéricos de las materias correlativas exactas.
3. `lessons`: Arreglo vacío `[]` si no hay horarios provistos en la fuente oficial.
4. El grafo de correlatividades no debe contener ciclos (DAG acíclico).
