# Course Organizer Feature Module 📚

The **Course Organizer** (`/home`) is the primary dashboard of the application. It presents the entire curriculum organized by academic years and quarters/semesters, allowing students to plan their progression, check requirement rules, move subjects across terms, and manage study plans.

---

## 🔑 Key Functionalities

1. **Curriculum Grid (`course-grid`, `course-card`)**:
   - Renders courses grouped by `year` and quarter (`q`).
   - Cards display course status badges, subject titles, lesson commissions, and prerequisite count indicators.

2. **Status Progression**:
   - Clicking a course or lesson cycles through the status chain:
     `Pendiente` → `Cursando` → `Cursada` → `Aprobada`.
   - Automated prerequisite validation:
     - Changing status to `Cursando` or `Cursada` requires all subjects listed in `cursarReq` to be at least `cursed` or `approved`.
     - Changing status to `Aprobada` requires all subjects listed in `aprobarReq` to be `approved`.

3. **Drag & Drop Semester Relocation**:
   - Drag a course card to move it to a different year or semester slot.
   - Guarded by `canMoveLessonToSemester()`: prevents moving a subject into the same or earlier semester than its prerequisite, or after a subject that depends on it.

4. **Multi-Plan Management**:
   - Users can create multiple study plan layouts (e.g. *Plan Estándar*, *Plan Acelerado*, *Plan Nocturno*).
   - Powered by `PlanService` and `CourseService` signal synchronization.

---

## 🧩 Related Components & Services

- **Components**:
  - `CourseOrganizerComponent` (`course-organizer.component.ts`)
  - `CourseGridComponent` (`course-grid/`)
  - `CourseCardComponent` (`course-card/`)
  - `CourseOrganizerLegendComponent` (`course-organizer-legend/`)
- **Services**:
  - `CourseService` (`src/app/services/course.service.ts`)
  - `PlanService` (`src/app/services/plan.service.ts`)

---

## 💾 State & Persistence

Course statuses and layout placements are stored in `localStorage` under `course-organizer-state`. Status updates trigger reactive Angular signal updates across all active views simultaneously.
