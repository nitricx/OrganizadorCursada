---
name: organizador-cursada
description: Architecture guidelines, domain conventions, multi-career models, and state management rules for the OrganizadorCursada project. Trigger when adding features, modifying course/career models, adjusting prerequisite rules, updating study plans, or working on the Workshop privacy layer.
---

# OrganizadorCursada Agent Skill & Architecture Guide

This skill provides complete, up-to-date technical context, domain models, architecture patterns, and guidelines for AI agents working on the **OrganizadorCursada** codebase.

---

## 1. Domain Models & Data Structures

### Course & Lesson Entity Definitions (`src/app/models/course.ts`)
- **`CourseStatus`**: `'pending' | 'coursing' | 'coursed' | 'approved'`
- **`DayOfWeek`**: Enum (`Monday = 0` through `Saturday = 5`)
- **`Lesson`**: Commission schedule slot.
  - `id`: Unique lesson identifier string (e.g., `'PA1-L1'`).
  - `professor`: Instructor / professor name.
  - `day`: `DayOfWeek` numeric enum.
  - `startTime` / `endTime`: String in `"HH:MM"` format.
  - `status?`: Optional individual lesson status override (`CourseStatus`).
- **`Course`**: Represents an academic subject.
  - `id`: Unique **numeric** ID (e.g. `101`, `1`).
  - `name`: Subject title (string).
  - `year`: Academic year (`1, 2, 3, ...`).
  - `q`: Quarter / Semester (`1` = 1st Semester, `2` = 2nd Semester, `3` = Annual/Special).
  - `status`: Active `CourseStatus`.
  - `cursarReqId`: `number[]` array of course IDs required to *enroll/course* this subject.
  - `aprobarReqId`: `number[]` array of course IDs required to *pass final exam / approve* this subject.
  - `lessons`: Array of `Lesson` objects (available commission choices).
  - `selectedLessonId?: string | null`: Selected commission ID for the student's schedule.

### Multi-Career Models (`src/app/models/career.model.ts`)
- **`CareerIndexEntry`**: Metadata entry in career catalogs (`id`, `name`, `university`, `file`).
- **`RawCourseData`**: Serialized JSON structure for course definitions (`cursarReqId: number[]`, `aprobarReqId: number[]`).
- **`CareerPlan`**: Full study plan container (`id`, `name`, `university`, `faculty`, `version`, `courses: RawCourseData[]`).
- **`parseCareerPlanToCourses(plan: CareerPlan): Course[]`**: Utility converting raw plan JSON into operational `Course[]` models initialized with `'pending'` status.

### Decentralized Workshop & Privacy Models (`src/app/models/plan-manifest.model.ts`)
- **`PlanManifest`**: Public, immutable base degree module stripped of personal user progress (`id` URN, `name`, `university`, `faculty`, `version`, `courses: CourseManifest[]`).
- **`CourseManifest`**: Minimal subject definition in public manifests (`id`, `name`, `year`, `q`, `cursarReq: string[]`, `aprobarReq: string[]`).
- **`CommissionPack`**: Independent public schedule pack (`planId`, `term`, `professors`, `lessons`).
- **`UserProgressOverlay`**: Private local-only progress overlay (`courseStatuses`, `semesterOverrides`, `selectedLessons`, `userNotes`, `customPrereqDeltas`). Stored exclusively in `localStorage` and NEVER transmitted across network boundaries.
- **`RebaseConflict`**: Conflict descriptor when updating upstream plan manifests (`courseId`, `type`, `description`).

---

## 2. Course Status Lifecycle & Prerequisite Rules

### Status Machine Progression
```
[pending] ---> [coursing] ---> [coursed] ---> [approved]
   ^                                               |
   +-----------------------------------------------+
```
1. **`pending` (Pendiente)**: Default state. Subject not yet taken.
2. **`coursing` (Cursando)**: Currently attending classes in the active term.
   - Requires direct `cursarReqId` subjects to be at least `coursed` or `approved`.
   - Requires nested prior prerequisites (`aprobarReqId` of direct `cursarReqId` subjects) to be `approved`.
3. **`coursed` (Cursada / Regular)**: Passed continuous assessment, pending final exam. Same prerequisite requirements as `coursing`.
4. **`approved` (Aprobada / Promocionada / Final Aprobado)**: Subject credited. Requires direct `aprobarReqId` subjects to be `approved`.

### Downstream Lock Safety Rule
A prerequisite subject (e.g. *Math 1*) **cannot be demoted to a lower state** if an active downstream dependent subject (e.g. *Math 2* marked as `approved` or `coursing`) relies on *Math 1* remaining in its current state. Users must demote dependent subjects first.

---

## 3. Reactive State Management & Store Architecture

### Angular Signals Pattern (`@injectable({ providedIn: 'root' })`)
All application state is managed via reactive Signal Stores in `src/app/services/`:

1. **`CourseService` (`src/app/services/course.service.ts`)**:
   - Manages active plan's `Course[]` list, subject status map (`courseStatusesSignal`), selected commission IDs, and drag-and-drop semester moves.
   - Enforces prerequisite validation (`canChangeStatusTo`, `canMoveLessonToSemester`).
   - Exposes readonly signals: `courses`, `activePlanCourses`, `coursingLessons`, etc.

2. **`PlanService` (`src/app/services/plan.service.ts`)**:
   - Manages user-created plans, plan cloning, renaming, deletion, and semester date range definitions (`plan-semesters-{planId}`).

3. **`CareerService` (`src/app/services/career.service.ts`)**:
   - Multi-career catalog switcher. Reads local bundles (`audiovisual.json`, `sistemas.json`), custom user plans from `localStorage`, and remote community plans via Firebase Firestore.

4. **`FirestoreSyncService`**:
   - Handles community workshop publication and remote plan fetching via Firebase Firestore.

5. **Quality, Privacy & Security Services**:
   - **`PlanSanitizerService`**: Strips identifying metadata ($k$-anonymity enforcement) before publishing plans.
   - **`PlanLinterService`**: Audits study plan schemas for circular prerequisites and structural errors.
   - **`AntiSybilService` / `VotingNullifierService` / `OhttpClientService`**: Enables anonymous zero-knowledge community rating and voting on workshop plans.

6. **Utility Services**:
   - **`CalendarExportService`**: Generates iCal (`.ics`) files and Google Calendar import links from `coursingLessons`.
   - **`ThemeService` & `ToastService`**: UI theme state and toast notification handling.

---

## 4. UI Components Catalog (22 Standalone Components)

The codebase is organized under `src/app/components/`:

- **Main Dashboard Views**:
  - `course-organizer`: Main dashboard `/home`. Host for course grid, search, and plan header controls.
  - `course-grid`: Semester-based grid container for rendering `course-card` components.
  - `course-card`: Interactive subject card displaying status toggle buttons, prerequisite alerts, and commission info.
  - `course-organizer-legend`: Visual legend for subject statuses.
- **Weekly Schedule (`/myWeek`)**:
  - `calendar`: Weekly timetable matrix mapping Monday - Saturday classes.
  - `calendar-card`: Session card placed on time grid with professor/room details.
  - `calendar-legend`: Schedule filter legend.
  - `lesson-selector-modal`: Modal dialog for selecting specific commissions/teachers per course.
  - `export-calendar-modal`: Modal for exporting schedule to iCal / Google Calendar.
- **Prerequisites Flow (`/requisites`)**:
  - `requisites-flow`: Cytoscape.js & Dagre directional dependency graph visualization.
- **Academic Calendar (`/academicCalendar`)**:
  - `academic-calendar`: Date range timeline for academic terms.
- **Workshop Hub (`/workshop`)**:
  - `workshop-hub`: Steam-Workshop-like community catalog for browsing and subscribing to study plans.
  - `plan-publisher-modal`: Modal for sanitizing and publishing local custom plans.
  - `plan-diff-viewer`: Structural visual diff tool for comparing upstream plan versions.
  - `career-selector`: Header dropdown selector for switching between careers.
- **Global & Layout Components**:
  - `sidebar`: Main app navigation sidebar.
  - `user-menu`: User authentication / profile menu.
  - `toast-container`: Global toast alert renderer.
  - `advisory-badge`, `lineage-indicator`, `no-plan-selected`, `onboarding-welcome`.

---

## 5. Key Rules for AI Code Generation

1. **Standalone Components**: All components MUST be Angular standalone (`standalone: true` or standard Angular 21 component declarations).
2. **Modern Control Flow**: Use `@if`, `@for`, `@switch` control flow blocks in HTML templates.
3. **Signal Mutability**: When updating Signals holding `Map` or `Set` instances, assign a new copy to trigger reactivity:
   ```ts
   this.courseStatusesSignal.set(new Map(updatedMap));
   ```
4. **Id-Based Prerequisite Check**: Always use `cursarReqId` and `aprobarReqId` numeric array matching instead of course names.
5. **Privacy Airgap**: User progress data (`CourseStatus`, personal notes, selected lessons) MUST remain strictly in `localStorage` and never be uploaded to remote services.
6. **Lean Components & Service Unit Tests**: UI Components (`src/app/components/`) MUST contain minimal logic, acting strictly as presentation layers that delegate state and business logic to Services (`src/app/services/`). Because domain logic resides in Services, every new feature or modification in a Service file MUST include its corresponding unit test (`*.spec.ts`). UI Components do NOT require unit tests. Always run the Vitest suite before concluding tasks:
   ```bash
   npx ng test --watch=false
   ```
7. **Modern Dependency Injection**: Always use `private service = inject(Service);` instead of constructor parameter injection.
8. **Signal-Based Inputs & Outputs**: Use `input()` / `input.required()` and `output()` functional APIs instead of `@Input()` and `@Output()` decorators.
9. **Readonly Service Signals**: Services must expose internal WritableSignal state using `.asReadonly()` to enforce unidirectional data flow.
10. **Strict TypeScript (No `any`)**: Do NOT use `any`. Always use explicit interfaces, types, or `unknown` with type guards.
11. **RxJS Cleanup**: Use `takeUntilDestroyed()` from `@angular/core/rxjs-interop` or template `async` pipe to clean up subscriptions.
12. **Feature-Based Project Organization**: Do NOT place new UI components flat inside `src/app/components/`. All new components must be categorized into feature/domain directories (`features/<domain>/` or `shared/` if global). Organize services into clear layers (`domain`, `sync`, `security`, `utils`).
13. **Strict No-Fake-Data & Full Real Catalog Rule**: NEVER insert fake or dummy placeholder careers (e.g. Abogacía, Medicina, etc.), artificial version numbers in user UI, or truncated 2-course snippets. Always load full real career JSON files (`scripts/seed-data/sistemas.json` and `scripts/seed-data/audiovisual.json`).
14. **Strict Centralized Color Palette & Design Tokens Rule**: NEVER hardcode static hexadecimal color strings (`#ffffff`, `#1f1f1f`, `#00897b`, `#3b82f6`, etc.) in component CSS files or HTML `style="..."` bindings. All color definitions MUST consume centralized CSS Design Tokens defined in `src/styles.css` using `var(--color-text-primary)`, `var(--color-background-primary)`, `var(--brand-primary)`, `var(--status-approved-bg)`, `var(--color-danger-text)`, `var(--color-warning-bg)`, etc. Ensure all newly introduced color tokens have complete light and dark theme definitions in `src/styles.css` (`:root` and `[data-theme="dark"]`).




