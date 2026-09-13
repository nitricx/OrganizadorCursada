# Agent Collaboration & Task Lifecycle Protocol (`WORKFLOW.md`)

This document defines the standardized engineering lifecycle for AI agents and human developers collaborating on **OrganizadorCursada**, formalizing role transitions and hand-offs.

---

## 🔄 The 5-Phase Delivery Lifecycle

```
  [1. ANALYST]          [2. GITFLOW]         [3. DEVELOPER]              [4. QA]            [5. GITFLOW]
   Requirements  ----->  Create Branch ----->  Implementation     ----->  Verification ----->  Commit & PR
    & Gherkin              feature/*            & Service Tests            & Regression          to develop
```

---

### Phase 1: Specification & Requirements (Role: Analyst)

- **Objective**: Clarify requirements and verify domain boundaries before writing code.
- **Actions**:
  1. Break down user needs into User Stories (_As a... I want... So that..._).
  2. Define binary, testable Acceptance Criteria using **Gherkin** (_Given... When... Then..._).
  3. Analyze impact on subject states (`CourseStatus`), prerequisite trees, or student privacy.
  4. Identify authoritative services governing the state changes (`CourseService`, `PlanService`, `CareerService`).
- **Skill Reference**: [`.agents/skills/analista`](./skills/analista/SKILL.md).

---

### Phase 2: Version Control Setup (Role: GitFlow)

- **Objective**: Ensure a clean, isolated starting branch.
- **Actions**:
  1. Synchronize the local `develop` branch:
     ```bash
     git checkout develop && git pull origin develop
     ```
  2. Create a semantic working branch:
     - New capabilities: `feature/<descriptive-name>`
     - Defect fixes: `bugfix/<descriptive-name>`
     - Maintenance / Tooling: `chore/<descriptive-name>`
- **Skill Reference**: [`.agents/skills/gitflow`](./skills/gitflow/SKILL.md).

---

### Phase 3: Technical Implementation (Role: Developer)

- **Objective**: Build the solution with decoupled architecture and unit tests.
- **Actions**:
  1. **Service-First Logic**: Create or modify methods in `src/app/services/`.
     - Mutate Signals immutably (`set(new Map(...))`, `set([...list])`).
     - Expose public state as read-only via `.asReadonly()`.
  2. **Mandatory Service Unit Tests**: Author comprehensive specs in `*.service.spec.ts`.
  3. **Lean Presentation Components**: Create standalone components in `src/app/features/<domain>/`.
     - Use functional APIs: `inject()`, `input()`, `output()`, and native control flow `@if` / `@for`.
     - Consume centralized CSS Design Tokens (`var(--...)`) from `src/styles.css`.
- **Skill References**:
  - [`.agents/skills/desarrollador`](./skills/desarrollador/SKILL.md)
  - [`.agents/skills/angular`](./skills/angular/SKILL.md)
  - [`.agents/skills/ux-ui-design-system`](./skills/ux-ui-design-system/SKILL.md)

---

### Phase 4: Quality Assurance & Verification (Role: QA)

- **Objective**: Prevent regressions and certify acceptance criteria satisfaction.
- **Actions**:
  1. Execute unit test suites:
     ```bash
     npm test -- --watch=false
     ```
  2. Compile the application to validate TypeScript typing:
     ```bash
     npm run build
     ```
  3. Run E2E tests for modified user journeys:
     ```bash
     npm run test:e2e
     ```
  4. Verify that student progress remains strictly in `localStorage` (Airgap).
- **Skill References**:
  - [`.agents/skills/qa`](./skills/qa/SKILL.md)
  - [`.agents/skills/e2e-playwright`](./skills/e2e-playwright/SKILL.md)
  - [`.agents/skills/seguridad-privacidad`](./skills/seguridad-privacidad/SKILL.md)

---

### Phase 5: Integration & Delivery (Role: GitFlow)

- **Objective**: Safely integrate validated changes into version control.
- **Actions**:
  1. Inspect changes with `git status` and `git diff`.
  2. Stage and commit with **Conventional Commits**:
     ```bash
     git add <files>
     git commit -m "feat(scope): concise imperative description"
     ```
  3. Rebase onto `develop` if upstream changes occurred:
     ```bash
     git fetch origin && git rebase origin/develop
     ```
  4. Open a Pull Request targeting `develop` documenting:
     - Problem solved and technical approach.
     - Verification proof (unit tests and E2E runs in green).
- **Skill Reference**: [`.agents/skills/gitflow`](./skills/gitflow/SKILL.md).
