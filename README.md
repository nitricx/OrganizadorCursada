# OrganizadorCursada 🎓📅

**OrganizadorCursada** is a modern, privacy-first web application built with **Angular 21** designed to help university students plan, manage, and visualize their academic career. Supporting higher education curricula across multiple disciplines (such as *Tecnicatura en Edición Audiovisual*, *Ingeniería en Sistemas*, and custom user-created study plans), it enables students to track subject completion status, organize weekly class schedules, explore prerequisite dependencies, and publish or subscribe to community study plans.

---

## ✨ Features

- 📌 **Course Organizer Dashboard (`/home`)**:
  - View all subjects categorized by academic year and semester/quarter.
  - Interactive status progression: **Pendiente** → **Cursando** → **Cursada** → **Aprobada**.
  - Prerequisite validation highlighting required (`cursarReqId`) and final exam (`aprobarReqId`) requirements on hover.
  - Commission/Teacher selector (`selectedLessonId`) to pick specific class sessions without overloading weekly timetables.
  - Drag-and-drop course re-ordering across semesters with automated prerequisite position safety checks.
  - Multi-plan management: create, rename, fork, and switch between custom study plan variations.

- 🗓️ **Weekly Schedule Calendar (`/myWeek`)**:
  - Timetable view mapping enrolled lessons across days of the week (Monday – Saturday) and time slots.
  - Class details including instructor/professor, exact start/end times, and room allocation.
  - Automated schedule overlap and conflict detection.
  - **iCal / Google Calendar Export**: Export weekly timetable to `.ics` format or sync directly with calendar apps.

- 📆 **Academic Calendar Timeline (`/academicCalendar`)**:
  - Timeline view mapping academic semesters to real-world calendar start and end dates.
  - Customizable semester date ranges per plan.

- 🛒 **Privacy-Preserving Workshop Hub (`/workshop`)**:
  - Browse, upload, and subscribe to community study plans (*carreras*).
  - **Modular Architecture**: Decouples base degree curricula from elective packs and commission schedules to prevent cohort intersection fingerprinting.
  - **Pre-Flight Sanitizer & Linter**: Automated privacy sanitizer stripping personal metadata ($k$-anonymity enforcement) and structural plan linter.
  - **Anti-Sybil & Anonymous Voting**: Zero-knowledge rating and voting support via OHTTP client relays.

- 🎓 **Multi-Career Switcher**:
  - Header dropdown selector to seamlessly switch between multiple academic degree plans stored locally or fetched via Cloud Sync.

- 💾 **Air-Gapped State Persistence**:
  - Fully client-side state saved automatically in `localStorage`, maintaining plan layout changes, subject statuses, notes, and schedule selections across browser sessions without transmitting private progress over the network.

---

## 🛠️ Technology Stack

- **Framework**: [Angular 21](https://angular.dev/) (Standalone Components, Signals architecture, `@if`/`@for` control flow)
- **UI Components & Styling**: [Angular Material 21](https://material.angular.io/) & Angular CDK v21, Custom Glassmorphism CSS
- **Graph & Visualizations**: [Cytoscape.js](https://js.cytoscape.org/) v3.33 & [cytoscape-dagre](https://github.com/cytoscape/cytoscape.js-dagre) layout engine
- **Backend & Cloud Sync**: AWS Cloud Sync (Cognito Auth + API Gateway)
- **Privacy & Security**: Oblivious HTTP (OHTTP) client relay, $k$-Anonymity pre-flight sanitizer, Anti-Sybil scorer
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
├── docs/
│   └── system_design_workshop.md # Deep-dive privacy & workshop system architecture doc
├── scripts/
│   ├── seed-data/              # Standard JSON study plan datasets (audiovisual.json, sistemas.json)
│   └── seed-firestore.js       # Script to populate remote Firestore community plan database
├── src/
│   ├── app/
│   │   ├── components/         # 22 Feature components (dashboard, calendar, workshop, flow)
│   │   │   ├── academic-calendar/
│   │   │   ├── calendar/
│   │   │   ├── course-grid/
│   │   │   ├── course-organizer/
│   │   │   ├── workshop-hub/
│   │   │   └── ... (see components catalog)
│   │   ├── models/             # Domain TypeScript interfaces (course, career, plan-manifest)
│   │   ├── services/           # 17 Reactive state stores, sync, privacy & utility services
│   │   │   ├── course.service.ts
│   │   │   ├── plan.service.ts
│   │   │   ├── career.service.ts
│   │   │   ├── plan-sanitizer.service.ts
│   │   │   ├── aws-sync.service.ts
│   │   │   └── ... (see services catalog)
│   │   ├── app.routes.ts       # Application routes (/home, /myWeek, /academicCalendar, /workshop)
│   │   └── app.ts              # Root application component
│   └── styles.css              # Global design system & theme variables
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- `npm` (v10+ package manager)

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

## 📖 Architecture & Module Documentation

- [AI Agent Skill & Guidelines](file:///d:/Repositories/OrganizadorCursada/.agents/skills/organizador-cursada/SKILL.md)
- [Privacy-Preserving Workshop System Architecture](file:///d:/Repositories/OrganizadorCursada/docs/system_design_workshop.md)
- [Services Architecture Catalog](file:///d:/Repositories/OrganizadorCursada/src/app/services/README.md)
- [UI Components Catalog](file:///d:/Repositories/OrganizadorCursada/src/app/components/README.md)

---

## 📄 License

This project is open source and available under standard open source licensing.
