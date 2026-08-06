# OrganizadorCursada 🎓📅

**OrganizadorCursada** is a modern, interactive web application built with **Angular 21** designed to help university students plan, manage, and visualize their academic career. Tailored for higher education curricula (such as *Tecnicatura en Edición Audiovisual*), it allows students to track subject completion status, organize weekly class schedules, explore prerequisite dependencies, and manage multiple study plans.

---

## ✨ Features

- 📌 **Course Organizer Dashboard (`/home`)**:
  - View all subjects categorized by academic year and semester/quarter.
  - Interactive status progression: **Pendiente** → **Cursando** → **Cursada** → **Aprobada**.
  - Prerequisite validation highlighting required (`cursarReq`) and final exam (`aprobarReq`) requirements on hover.
  - Drag-and-drop course re-ordering across semesters with automated prerequisite position safety checks.
  - Multi-plan management: create, rename, and switch between custom study plan variations.

- 🗓️ **Weekly Schedule Calendar (`/myWeek`)**:
  - Timetable view mapping enrolled lessons across days of the week (Monday - Saturday) and time slots.
  - Filter classes by status (e.g. show only *Cursando* or selected subjects).
  - Class details including instructor/professor, exact start/end times, and room allocation.
  - Automated schedule overlap and conflict detection.

- 🕸️ **Prerequisites Flow Diagram (`/requisites`)**:
  - Visual dependency graph powered by **Cytoscape.js** and **Dagre** layout engine.
  - Color-coded nodes reflecting real-time subject completion status.
  - Clear directional arrows differentiating prerequisite types (*requisito para cursar* vs *requisito para rendir examen final*).

- 📆 **Academic Calendar Timeline (`/academicCalendar`)**:
  - Timeline view mapping academic semesters to real-world calendar start and end dates.
  - Date calculation helpers with customizable semester date ranges per plan.

- 💾 **State Persistence**:
  - Fully client-side state saved automatically in `localStorage`, maintaining plan layout changes, subject statuses, and schedule selections across browser sessions.

---

## 🛠️ Technology Stack

- **Framework**: [Angular 21](https://angular.dev/) (Standalone Components, Signals architecture)
- **UI Components & Styling**: [Angular Material](https://material.angular.io/) v21 & Angular CDK v21
- **Graph & Visualizations**: [Cytoscape.js](https://js.cytoscape.org/) v3.33 & [cytoscape-dagre](https://github.com/cytoscape/cytoscape.js-dagre) layout, [Mermaid](https://mermaid.js.org/)
- **Testing Runner**: [Vitest](https://vitest.dev/) v4 & Angular CLI Testbed
- **State Management**: Angular `signal`, `computed`, `effect` reactive primitives
- **Language & Tooling**: TypeScript 5.9, RxJS 7.8, Node.js / npm

---

## 📁 Project Structure

```
OrganizadorCursada/
├── .agents/                    # Agent skills & repository guidelines
│   └── skills/
│       └── organizador-cursada/
│           └── SKILL.md        # Technical guidelines for AI agent workflows
├── src/
│   ├── app/
│   │   ├── components/         # Feature components & visual modules
│   │   │   ├── academic-calendar/
│   │   │   ├── calendar/       # Weekly timetable view ("myWeek")
│   │   │   ├── course-organizer/
│   │   │   ├── requisites-flow/ # Cytoscape dependency graph
│   │   │   └── sidebar/
│   │   ├── data/               # Curricular study plan datasets
│   │   │   └── courses.data.ts
│   │   ├── models/             # Domain TypeScript interfaces (Course, Lesson, etc.)
│   │   │   └── course.ts
│   │   ├── services/           # Reactive state stores & logic
│   │   │   ├── course.service.ts
│   │   │   └── plan.service.ts
│   │   ├── app.routes.ts       # Application routes
│   │   └── app.ts              # Root application component
│   └── styles.css              # Global styles & design system rules
├── legacy/                     # Historical reference materials & static HTML source data
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- `npm` (v10+ or `npm@11` package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nitricx/OrganizadorCursada.git
   cd OrganizadorCursada
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

To start the local development server:

```bash
npm start
```
Or:
```bash
npx ng serve
```

Open your browser and navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

---

## 🧪 Testing

To execute unit tests with Vitest runner:

```bash
npm test
```

Or run single execution without watch mode:

```bash
npx ng test --watch=false
```

---

## 📦 Building for Production

To compile the application and emit production artifacts to the `dist/` directory:

```bash
npm run build
```

---

## 📖 Module Documentation

Detailed documentation for individual feature modules can be found in their respective directories:
- [Course Organizer Module](file:///d:/Repositories/OrganizadorCursada/src/app/components/course-organizer/README.md)
- [Weekly Calendar Module](file:///d:/Repositories/OrganizadorCursada/src/app/components/calendar/README.md)
- [Requisites Flow Diagram Module](file:///d:/Repositories/OrganizadorCursada/src/app/components/requisites-flow/README.md)
- [Academic Calendar Module](file:///d:/Repositories/OrganizadorCursada/src/app/components/academic-calendar/README.md)

---

## 📄 License

This project is open source and available under standard open source licensing.
