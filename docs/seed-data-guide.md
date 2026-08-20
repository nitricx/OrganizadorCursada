# Guía de Estructura y Generación de Planes de Estudio (`scripts/seed-data`)

Este documento sirve de guía técnica para **agentes de IA y desarrolladores** que necesiten crear, formatear y validar nuevos archivos JSON de planes de estudio (carreras) en el directorio `scripts/seed-data/`.

---

## 1. Visión General y Regla de Oro de Fidelidad de Datos

> [!IMPORTANT]
> **REGLA DE ORO DE FIDELIDAD:** El agente **NO DEBE inventar ni suponer ningún dato** que no esté explícitamente especificado en la fuente de información o plan oficial provisto por el usuario.
> - Si el plan de estudios no especifica comisiones, docentes u horarios, el campo `lessons` debe ser un arreglo vacío: `"lessons": []`. **NO inventar profesores ni horarios ficticios.**
> - Si una materia no exige correlativas en la fuente, `cursarReqId` y `aprobarReqId` deben ser arreglos vacíos `[]`. **NO deducir correlativas no reglamentadas.**
> - Respetar estrictamente los nombres oficiales de materias, años y cuatrimestres tal como figuran en el documento fuente.

---

## 2. Esquema de Datos JSON (JSON Schema)

Cada archivo en `scripts/seed-data/<id-carrera>.json` debe ser un objeto JSON válido con la siguiente estructura:

### Objeto Raíz (`CareerPlan`)

| Campo | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | **Sí** | Identificador único en formato kebab-case (URN/slug). | `"ing-informatica-fiuba"` |
| `name` | `string` | **Sí** | Nombre oficial completo de la carrera. | `"Ingeniería en Informática"` |
| `university` | `string` | **Sí** | Universidad de origen. | `"Universidad de Buenos Aires"` |
| `faculty` | `string` | **Sí** | Facultad o Unidad Académica. | `"Facultad de Ingeniería"` |
| `version` | `string` | **Sí** | Año o código del plan de estudios oficial. | `"2020"`, `"2023"` |
| `updatedAt` | `string` | **Sí** | Fecha de creación/actualización en formato `YYYY-MM-DD`. | `"2026-08-20"` |
| `courses` | `Array` | **Sí** | Lista de asignaturas/materias (`RawCourseData[]`). | `[...]` |

---

## 3. Estructura de Asignaturas (`courses` / `RawCourseData`)

Cada elemento dentro del arreglo `courses` representa una materia o asignatura del plan de estudios:

```json
{
  "id": 1,
  "name": "Análisis Matemático I",
  "year": 1,
  "q": 3,
  "cursarReqId": [],
  "aprobarReqId": [],
  "lessons": []
}
```

### Detalle de Campos de Asignatura

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `number` | **Sí** | Número entero positivo único dentro del plan (e.g. `1`, `2`, `3`...). |
| `name` | `string` | **Sí** | Nombre oficial exacto de la materia según la fuente. |
| `year` | `number` | **Sí** | Año académico en la cursada recomendado (`1`, `2`, `3`, `4`, `5`, etc.). |
| `q` | `number` | **Sí** | Período lectivo según plan: `1` = 1° Cuatrimestre, `2` = 2° Cuatrimestre, `3` = Anual. |
| `cursarReqId` | `Array<number>` | **Sí** | Arreglo de IDs numéricos de las materias requeridas para **cursar**. Dejar `[]` si no posee. |
| `aprobarReqId` | `Array<number>` | **Sí** | Arreglo de IDs numéricos de las materias requeridas para **aprobar / final**. Dejar `[]` si no posee. |
| `lessons` | `Array<Object>` | **Sí** | Comisiones u horarios oficiales. **Si no están en la fuente, colocar `[]`**. |

---

## 4. Estructura de Comisiones y Horarios (`lessons`)

**Únicamente completar si la fuente oficial provista por el usuario incluye datos reales de comisiones y horarios.** En caso contrario, dejar `lessons: []`.

```json
{
  "id": "AMI-L1",
  "professor": "Dr. Jorge Rossi",
  "day": 0,
  "startTime": "08:00",
  "endTime": "12:00"
}
```

### Detalle de Campos de Lección/Comisión (Si existen en la fuente)

| Campo | Tipo | Requerido | Valores Permitidos / Formato |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Sí** | Código único de comisión según fuente. |
| `professor` | `string` | **Sí** | Nombre del docente o cátedra oficial según fuente. |
| `day` | `number` | **Sí** | Día de la semana (índice 0): `0` = Lunes, `1` = Martes, `2` = Miércoles, `3` = Jueves, `4` = Viernes, `5` = Sábado. |
| `startTime` | `string` | **Sí** | Hora de inicio en formato `"HH:MM"` (24 hs). |
| `endTime` | `string` | **Sí** | Hora de finalización en formato `"HH:MM"` (24 hs). |

---

## 5. Reglas de Validación de Integridad (Checklist para el Agente)

Al generar un nuevo plan mediante IA, el agente **DEBE** verificar que se cumplan las siguientes reglas:

1. **Cero Invención de Datos**: No crear materias ficticias, docentes inventados, horarios asumidos ni correlativas que no figuren explícitamente en la documentación provista.
2. **IDs Únicos Numéricos**: Cada materia del plan debe poseer un `id` entero único e incremental (1, 2, 3, ...). No usar strings para el `id` de las materias.
3. **Grafo Acíclico Dirigido (DAG)**: Una materia $A$ no puede tener como correlativa a una materia $B$ si $B$ a su vez requiere a $A$ (directa o transitivamente).
4. **Referencias de Correlativas Válidas**: Todos los números presentes en `cursarReqId` y `aprobarReqId` **deben existir** como `id` de alguna materia en el mismo archivo JSON.
5. **Formato JSON Estricto**: Archivo JSON válido (sin comas sobrantes / trailing commas, sin comentarios, con comillas dobles en todas las llaves y cadenas).

---

## 6. Procedimiento Paso a Paso para que un Agente IA Genere un Nuevo Plan

1. **Recibir Documentación Oficial**: El usuario proporciona el plan de estudios o grilla curricular oficial.
2. **Enumerar Materias**: El agente extrae las materias exactas y les asigna `id: 1`, `id: 2`, etc.
3. **Mapear Correlatividades Exactas**: Convertir los nombres de correlativas expresadas en la fuente a sus correspondientes `id` numéricos.
4. **Procesar Horarios/Comisiones (`lessons`)**:
   - Si el documento contiene comisiones/horarios reales $\rightarrow$ mapear a `lessons`.
   - Si el documento **no contiene** comisiones/horarios $\rightarrow$ usar `"lessons": []`.
5. **Guardar el Archivo**: Guardar en `scripts/seed-data/<id-carrera>.json`.
6. **Validar Sintaxis**:
   ```bash
   node -e "console.log(JSON.parse(fs.readFileSync('scripts/seed-data/<id-carrera>.json')) ? 'OK' : 'Error')"
   ```

---

## 7. Ejemplo Mínimo Basado Únicamente en Datos Oficiales (`ejemplo-carrera.json`)

```json
{
  "id": "ing-software-utn",
  "name": "Ingeniería en Software",
  "university": "Universidad Tecnológica Nacional",
  "faculty": "Facultad Regional Buenos Aires",
  "version": "2024",
  "updatedAt": "2026-08-20",
  "courses": [
    {
      "id": 1,
      "name": "Programación I",
      "year": 1,
      "q": 1,
      "cursarReqId": [],
      "aprobarReqId": [],
      "lessons": []
    },
    {
      "id": 2,
      "name": "Programación II",
      "year": 1,
      "q": 2,
      "cursarReqId": [1],
      "aprobarReqId": [1],
      "lessons": []
    }
  ]
}
```
