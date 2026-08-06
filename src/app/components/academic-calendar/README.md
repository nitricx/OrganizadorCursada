# Academic Calendar Feature Module 📆

The **Academic Calendar** module (`/academicCalendar` and `/academicCalendar/plan/:id`) manages real-world start and end date ranges for each academic semester in a study plan.

---

## 🔑 Key Functionalities

1. **Semester Date Range Management**:
   - Computes default semester start and end dates based on standard academic term dates:
     - **1st Quarter (Q1)**: Starts closest Monday to April 1st, ends closest Friday to June 15th.
     - **2nd Quarter (Q2)**: Starts closest Monday to July 15th, ends closest Friday to November 30th.
   - Allows users to customize and override start/end dates for individual terms.

2. **Timeline View**:
   - Visual timeline mapping course blocks into their corresponding calendar start/end date ranges.
   - Dynamic semester insertion between academic years.

3. **Plan Syncing**:
   - Integrates with `PlanService` to store date configurations per plan under `plan-semesters-{planId}` and `plan-starting-year-{planId}` keys in `localStorage`.

---

## 🧩 Related Components & Services

- **Component**:
  - `AcademicCalendarComponent` (`academic-calendar.component.ts`)
- **Services**:
  - `PlanService` (`src/app/services/plan.service.ts`)
  - `CourseService` (`src/app/services/course.service.ts`)
