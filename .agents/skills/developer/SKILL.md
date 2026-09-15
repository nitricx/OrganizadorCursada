---
name: developer
description: Engineering methodology and architectural patterns for software developers working on OrganizadorCursada. Trigger when implementing features, fixing bugs, refactoring domain logic, writing services, or building components. Triggers: desarrollador, developer, software engineer, implement, feature, refactor, bugfix, backend logic, frontend logic, service, unit test.
---

# Software Engineer Skill

This skill defines the development workflow, architectural patterns, and quality standards for software engineers working on the **OrganizadorCursada** repository.

---

## 1. Architectural Principles

The application enforces a strict separation of concerns between the **Domain & State Layer (Services)** and the **Presentation Layer (UI Components)**:

```
+-----------------------------------------------------------+
|               Presentation Layer (UI)                    |
|  Lean Standalone Components                               |
|  - Modern control flow (@if, @for, @switch)               |
|  - Functional inputs (input(), input.required())          |
|  - Functional outputs (output())                          |
|  - Zero domain logic, zero prerequisite calculations      |
+-----------------------------+-----------------------------+
                              | Injected via inject()
                              v
+-----------------------------------------------------------+
|             Domain & State Layer (Services)               |
|  Root-provided Services (@Injectable)                     |
|  - State machines & prerequisite validation rules         |
|  - Angular Signals (private WritableSignal,               |
|    public asReadonly())                                   |
|  - Local storage persistence & Privacy Airgap             |
|  - Mandatory unit tests in *.service.spec.ts              |
+-----------------------------------------------------------+
```

---

## 2. Step-by-Step Developer Workflow

### Step 1: Scope & Domain Model Review

- Review existing models in `src/app/models/` (`course.ts`, `career.model.ts`, `plan-manifest.model.ts`).
- Identify the authoritative service governing state:
  - `CourseService`: Subjects, enrollment statuses, prerequisite validation, and drag-and-drop moves.
  - `PlanService`: Custom user plans, cloning, deletion, and semester date ranges.
  - `CareerService`: Multi-career catalog and official study plans.
  - `AwsSyncService`: Cloud sync respecting student privacy constraints.

### Step 2: Service-First Implementation

- Implement business logic, mutations, or calculations inside `src/app/services/`.
- **Signal Immutability**: Always emit a new instance when mutating collections:
  ```typescript
  // For Maps
  this._courseStatuses.set(new Map(updatedMap));
  // For Arrays
  this._courses.set([...newCourses]);
  ```
- **Encapsulation**: Expose internal state exclusively as read-only signals:
  ```typescript
  private readonly _courses = signal<Course[]>([]);
  public readonly courses = this._courses.asReadonly();
  ```

### Step 3: Mandatory Unit Tests for Services

> [!IMPORTANT]
> Every new feature, modification, or bugfix in a Service file (`src/app/services/**/*.service.ts`) **MUST** include its corresponding unit test suite in `*.service.spec.ts`.
> UI Presentation Components do **NOT** require unit tests to avoid brittle visual test maintenance.

- Write specs with Vitest (`describe`, `it`, `expect`).
- Verify that tests pass cleanly:
  ```bash
  npm test -- --watch=false
  ```

### Step 4: Lean UI Component Implementation

- Place new components under the feature-based directory structure (`src/app/features/<domain>/` or `src/app/shared/`).
- Keep components **lean**: delegate user actions and state queries directly to injected services.
- Use `inject()` instead of constructor parameters:
  ```typescript
  private readonly courseService = inject(CourseService);
  ```
- Use functional inputs and outputs:
  ```typescript
  public readonly course = input.required<Course>();
  public readonly statusChanged = output<CourseStatus>();
  ```
- Use modern template control flow: `@if`, `@else`, `@for (c of courses(); track c.id)`, `@switch`.

### Step 5: Design Token Compliance

> [!WARNING]
> Hardcoded hexadecimal color strings (`#ffffff`, `#00897b`, `#3b82f6`, etc.) in component CSS or inline styles are strictly forbidden.
> Always consume **CSS Design Tokens** defined in `src/styles.css`:
>
> - `var(--color-text-primary)`, `var(--color-text-secondary)`
> - `var(--color-background-primary)`, `var(--color-background-secondary)`
> - `var(--brand-primary)`, `var(--status-approved-bg)`, `var(--color-danger-text)`

### Step 6: Authentic Data Integrity

> [!CAUTION]
> NEVER introduce dummy or mock degree plans (e.g. placeholder Law or Medicine programs) or truncated 2-course catalogs. Always load authentic career data from `scripts/seed-data/sistemas.json` and `scripts/seed-data/audiovisual.json`.

---

## 3. Developer Pre-Completion Checklist

- [ ] Was the `any` type completely avoided in favor of explicit interfaces?
- [ ] Does all business logic reside in Services rather than Components?
- [ ] Does every modified Service file have an accompanying test in `*.service.spec.ts`?
- [ ] Does the test suite pass with zero failures (`npm test -- --watch=false`)?
- [ ] Does the application compile without errors (`npm run build`)?
- [ ] Do all component styles consume CSS variables (`var(--...)`) supporting both light and dark themes?
- [ ] Is student data protected within the local storage privacy airgap?
