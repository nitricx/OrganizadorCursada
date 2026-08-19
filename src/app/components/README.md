# 🧱 UI Components Catalog (`src/app/components`)

This directory contains the 22 Angular standalone feature components comprising **OrganizadorCursada**.

---

## 🗺️ Component Catalog by View / Route

### 📌 Course Organizer Dashboard (`/home`)
- **`course-organizer`**: Main host view for the course planner dashboard. Contains header search, plan controls, and course grid container.
- **`course-grid`**: Renders course cards organized by academic year and semester/quarter.
- **`course-card`**: Individual subject card displaying status toggle buttons (`pending` → `coursing` → `coursed` → `approved`), prerequisite hover highlights, and commission selection badge.
- **`course-organizer-legend`**: Status color legend for the dashboard grid.

### 🗓️ Weekly Schedule Calendar (`/myWeek`)
- **`calendar`**: Weekly timetable matrix mapping Monday to Saturday class sessions across time slots.
- **`calendar-card`**: Timetable block representing an enrolled class session with professor name and room info.
- **`calendar-legend`**: Color legend and status filters for the weekly schedule view.
- **`lesson-selector-modal`**: Modal dialog permitting students to select specific commission sessions/professors for a subject.
- **`export-calendar-modal`**: Modal dialog for exporting weekly schedules to `.ics` / iCal / Google Calendar.

### 🕸️ Prerequisites Flow Diagram (`/requisites`)
- **`requisites-flow`**: Interactive Cytoscape.js visual graph rendering directional prerequisite dependencies (`cursarReqId` vs `aprobarReqId`) with color-coded nodes.

### 📆 Academic Calendar Timeline (`/academicCalendar`)
- **`academic-calendar`**: Timeline component mapping academic terms to real-world calendar start and end dates.

### 🛒 Community Workshop Hub (`/workshop`)
- **`workshop-hub`**: Steam-Workshop-like community catalog for browsing, searching, and subscribing to university study plans.
- **`plan-publisher-modal`**: Pre-flight modal for auditing, sanitizing, and publishing custom plans to the community hub.
- **`plan-diff-viewer`**: Visual diff tool for comparing upstream plan manifest updates with local progress overlays.
- **`career-selector`**: Header dropdown component for switching between active careers (*Tecnicatura en Edición Audiovisual*, *Ingeniería en Sistemas*, etc.).

### 🌐 Global & Navigation
- **`sidebar`**: Primary app navigation menu.
- **`user-menu`**: User profile and authentication dropdown.
- **`toast-container`**: Global toast notification banner host.
- **`advisory-badge`**: Warning indicator for prerequisite violations or downstream lock alerts.
- **`lineage-indicator`**: Displays plan fork lineage and parent URN relationship.
- **`no-plan-selected`**: Fallback placeholder view when no career plan is active.
- **`onboarding-welcome`**: Initial onboarding wizard for first-time users.
