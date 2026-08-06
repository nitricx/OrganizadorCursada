---
name: organizador-cursada
description: Architecture guidelines, domain conventions, and state management rules for the OrganizadorCursada project. Trigger when adding features, modifying course models, adjusting prerequisite rules, or updating university study plans.
---

# OrganizadorCursada Agent Skill & Architecture Guide

This skill provides context, rules, and guidelines for AI agents working on the **OrganizadorCursada** codebase.

## 1. Domain Model & Terminology

### Course & Lesson Entity Definitions
- **`Course`** (`src/app/models/course.ts`): Represents a university subject (e.g. *Introducción al Lenguaje Audiovisual*).
  - `id`: Unique identifier (string).
  - `name`: Human readable subject title used in prerequisite matching (`cursarReq` / `aprobarReq`).
  - `year`: Academic year (1, 2, 3, etc.).
  - `q`: Semester / Quarter (1 = 1st Semester, 2 = 2nd Semester, 3 = Annual/Special).
  - `cursarReq`: String array of course names required to *enroll/course* this subject.
  - `aprobarReq`: String array of course names required to *pass the final exam / approve* this subject.
  - `status`: State of the course (`'pending' | 'coursing' | 'coursed' | 'approved'`).
  - `lessons`: Array of scheduled class sessions (`Lesson[]`).

- **`Lesson`**: Represents a specific commission / schedule slot for a course.
  - `id`: E.g., `'PA1-L1'`, `'PA1-L2'`.
  - `professor`: Instructor name.
  - `day`: Day of week (`DayOfWeek`: `0 = Monday` through `5 = Saturday`).
  - `startTime` / `endTime`: Time format string (`"HH:MM"`).
  - `status`: Individual status override for this lesson session.

### Course Status Lifecycle State Machine
```
[pending] ---> [coursing] ---> [coursed] ---> [approved]
   ^                                               |
   +-----------------------------------------------+
```
1. **`pending` (Pendiente)**: Default state. Not yet enrolled or taken.
2. **`coursing` (Cursando)**: Currently attending classes in the active term.
   - Requires direct `cursarReq` subjects to be at least `coursed` or `approved`.
   - Requires nested prior prerequisites (`aprobarReq` of direct `cursarReq` subjects) to be `approved` (e.g. to course Math 3, Math 2 must be `coursed` AND Math 1 must be `approved`).
3. **`coursed` (Cursada / Regular)**: Passed continuous assessment / attendance, pending final exam. Same prerequisite constraints as `coursing`.
4. **`approved` (Aprobada / Promocionada / Final Aprobado)**: Subject completed and credited. Requires direct `aprobarReq` subjects to be `approved`.

---

## 2. State Management & Architecture Rules

### Angular Signals Pattern
- **Service as Store**: All state logic resides inside injectable root services (`CourseService`, `PlanService`).
- Components consume state via **`computed()`** signals or `asReadonly()` properties.
- State updates MUST go through service methods (e.g., `toggleCourseStatus`, `toggleLessonStatus`, `moveLessonToSemester`).

### Persistence Layer
- All user selections, status choices, moved semesters, and custom study plans are stored in **`localStorage`**:
  - `course-organizer-state`: Serialized courses by plan ID, course statuses map, lesson statuses map.
  - `plans`: Array of active academic plans (`Plan[]`).
  - `plan-semesters-{planId}`: Semester list date definitions per plan.

### Rules for Modifying Data & Prerequisites
- **Subject Name Matching**: Prerequisites (`cursarReq`, `aprobarReq`) reference target courses by **exact string name** matching `Course.name`. Do not alter course names in `courses.data.ts` without updating requirement lists.
- **Drag & Drop Placement Rules**: When moving a course to another semester slot (`moveLessonToSemester`), validate placement using `canMoveLessonToSemester()` to ensure prerequisite ordering constraints are preserved.

---

## 3. Directory Structure

- `src/app/models/`: Domain TypeScript interfaces (`course.ts`).
- `src/app/services/`: Core reactive state management (`course.service.ts`, `plan.service.ts`).
- `src/app/data/`: Default study plan dataset (`courses.data.ts`).
- `src/app/components/`: Feature components (`course-organizer`, `calendar`, `academic-calendar`, `requisites-flow`, `sidebar`).

---

## 4. Key Guidelines for AI Code Generation

1. **Standalone Components**: Always use Angular standalone components (`standalone: true` or standard Angular 19/21 component declarations).
2. **Control Flow Syntax**: Use modern `@if`, `@for`, `@switch` control flow blocks in component HTML templates.
3. **Immutability**: When updating Signals containing Maps or Sets, create new instances:
   ```ts
   this.courseStatusesSignal.set(new Map(updatedMap));
   ```
4. **Testing**: Run unit tests after making changes:
   ```bash
   npx ng test --watch=false
   ```
