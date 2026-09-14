# [TICK-22]: Estandarizar anchos de contenedores entre rutas

- **Estado Actual**: `QA_VERIFIED`
- **Asignado**: `gitflow`

## 📝 1. Especificación Funcional (Analista)

### Contexto y Problema

Los contenedores principales de distintas rutas (`/home`, `/myWeek`, `/academicCalendar`, `/builder`) tenían inconsistencias de `max-width` (1080px vs 1100px vs 1150px) y anidamiento redundante de contenedores `.wrap`, generando saltos visuales al navegar entre pestañas.

### User Stories

- **Como** estudiante utilizando OrganizadorCursada
- **Quiero** que el ancho del contenedor principal de la aplicación se mantenga constante al navegar entre las distintas secciones
- **Para** tener una experiencia de usuario fluida y sin saltos visuales de interfaz.

### Criterios de Aceptación (Gherkin)

- **Given** que el usuario navega entre las rutas `/home`, `/myWeek`, `/academicCalendar` y `/builder`
- **When** se renderizan los contenedores principales de la página
- **Then** todos los contenedores respetan un ancho máximo unificado (`--layout-max-width: 1200px`) y no presentan saltos de layout.

## 💻 2. Registro de Implementación (Desarrollador)

- Se define el token `--layout-max-width: 1200px` en `src/styles.css`.
- Se eliminan valores `max-width` duplicados o superpuestos en `app.css` y `career-builder.component.css`.
- Se remueve la clase `.wrap` anidada en `career-builder.component.html`.
- Se ajusta `.empty-state-card` en `no-plan-selected.component.css` para alinearse al grid.

## 🔍 3. Certificación de Calidad (QA)

- Estado: `QA_VERIFIED`
- Auditoría estática: 0 infracciones de reglas.
- Tests unitarios: 196/196 aprobados.
- Build de producción: Exitoso.

## 🚀 4. Cierre y Release (GitFlow)

- Estado: `QA_VERIFIED`
