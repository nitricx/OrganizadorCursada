# [TICK-23]: Convertir Workshop Hub y Publicador de Planes en rutas completas

- **Estado Actual**: `QA_VERIFIED`
- **Asignado**: `analista`

## 📝 1. Especificación Funcional (Analista)

### Contexto y Problema

Actualmente, el Hub Comunitario (Workshop) y la pantalla de Publicación/Compartir Plan se despliegan como modales flotantes emergentes. Para mejorar la usabilidad, navegación web y coherencia con la arquitectura del sistema, se deben convertir en rutas completas (`/workshop` y `/publish`).

### User Stories

- **Como** estudiante de la universidad
- **Quiero** navegar al Workshop Hub (`/workshop`) y a la pantalla de Publicación de Plan (`/publish`) como páginas completas dentro de la aplicación
- **Para** consultar el catálogo comunitario y compartir mis planes sin estar limitado por una ventana modal emergente.

### Criterios de Aceptación (Gherkin)

- **Given** que el usuario hace clic en "Explorar Workshop" o "Publicar Plan" en el menú o toolbar
- **When** se activa la navegación
- **Then** la aplicación navega a `/workshop` o `/publish` respectivamente, mostrando la vista completa integrada en el layout general de la aplicación (`.app-page-wrap`).
- **And** incluye un botón "Volver" para retornar al plan de cursada `/home`.

## 💻 2. Registro de Implementación (Desarrollador)

- Estado: PENDING

## 🔍 3. Certificación de Calidad (QA)

- Estado: PENDING

## 🚀 4. Cierre y Release (GitFlow)

- Estado: PENDING
