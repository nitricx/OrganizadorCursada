# OrganizadorCursada — AI Agent Master Guide

Welcome to the **OrganizadorCursada** repository, a progressive web application for academic degree planning, prerequisite tree visualization, and university timetable organization.

---

## 🏛️ 1. Architecture & System Layers

The codebase enforces a strict separation of concerns across three layers:

1. **Domain & State Layer (`src/app/services/`)**:
   - Governs all business logic, state machines, and prerequisite calculations.
   - Powered by **Angular Signals** (`signal()`, `computed()`, `effect()`).
   - Private mutable state (`WritableSignal`) exposed immutably via `.asReadonly()`.
   - Always emits new collection instances to trigger reactivity (`set(new Map(...))`, `set([...list])`).

2. **Presentation Layer (`src/app/features/` and `src/app/shared/`)**:
   - Lean **Standalone Components**.
   - Zero domain logic or prerequisite computations: delegates actions to injected services via `inject()`.
   - Functional signal APIs: `input()`, `input.required()`, and `output()`.
   - Native block control flow in templates: `@if`, `@else`, `@for (item of items(); track item.id)`, `@switch`.

3. **Storage & Privacy Layer**:
   - **Local Airgap**: Student academic progress (`CourseStatus`, private notes, selected commissions) is stored **exclusively** on the local device (`localStorage`) via `UserProgressOverlay`.
   - **Workshop Hub**: Community-shared study plans are immutable, anonymous, and de-identified ($k$-anonymity).

---

## 🚫 2. The 4 Inviolable Repository Rules

> [!CAUTION]
>
> 1. **Prohibition of Dummy Data or Mocks**: NEVER fabricate fake degree plans (e.g., Law, Medicine) or truncated course catalogs. Always use authoritative data from `scripts/seed-data/sistemas.json` and `scripts/seed-data/audiovisual.json`.
> 2. **Mandatory Service Unit Tests**: Every change or addition in `src/app/services/**/*.service.ts` MUST include its corresponding test suite in `*.service.spec.ts`. UI components do NOT require unit tests.
> 3. **Zero Hardcoded Hexadecimal Colors**: NEVER use `#ffffff`, `#1a1a1a`, etc. in component styles or inline HTML attributes. Consume centralized CSS Design Tokens from `src/styles.css` supporting both light and dark themes (`[data-theme="dark"]`).
> 4. **Strict Privacy Airgap**: Personal student progress data must never be transmitted across public network boundaries without prior sanitization via `PlanSanitizerService`.

---

## 🧭 3. Directory of Available Skills (`.agents/skills/`)

Activate or consult the relevant skill for each task:

| Skill                         | Location                                                                                            | Trigger When                                                                                        |
| :---------------------------- | :-------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| **`organizador-cursada`**     | [`.agents/skills/organizador-cursada`](file:///.agents/skills/organizador-cursada/SKILL.md)         | Domain models (`Course`, `CareerPlan`, `PlanManifest`), component index, baseline rules.            |
| **`desarrollador`**           | [`.agents/skills/desarrollador`](file:///.agents/skills/desarrollador/SKILL.md)                     | Feature implementation, refactoring, service architecture, TDD workflows.                           |
| **`analista`**                | [`.agents/skills/analista`](file:///.agents/skills/analista/SKILL.md)                               | Requirements analysis, user stories, Gherkin acceptance criteria, domain rules.                     |
| **`qa`**                      | [`.agents/skills/qa`](file:///.agents/skills/qa/SKILL.md)                                           | Test strategy, status transition matrix, bug reports, pre-release checklists.                       |
| **`gitflow`**                 | [`.agents/skills/gitflow`](file:///.agents/skills/gitflow/SKILL.md)                                 | Branching strategy (`main`, `develop`, `feature/*`), Conventional Commits, Pull Requests.           |
| **`angular`**                 | [`.agents/skills/angular`](file:///.agents/skills/angular/SKILL.md)                                 | Angular 21, Signals, Standalone Components, `inject()`, `input()`, `output()`, modern control flow. |
| **`ux-ui-design-system`**     | [`.agents/skills/ux-ui-design-system`](file:///.agents/skills/ux-ui-design-system/SKILL.md)         | Centralized CSS tokens, dark theme support, responsive layouts, WCAG accessibility.                 |
| **`seguridad-privacidad`**    | [`.agents/skills/seguridad-privacidad`](file:///.agents/skills/seguridad-privacidad/SKILL.md)       | Local privacy airgap, $k$-anonymity, `PlanSanitizerService`, Anti-Sybil protection.                 |
| **`grafos-correlatividades`** | [`.agents/skills/grafos-correlatividades`](file:///.agents/skills/grafos-correlatividades/SKILL.md) | Prerequisite DAG modeling, Kahn's cycle detection (`PlanLinterService`), Cytoscape, Dagre.          |
| **`e2e-playwright`**          | [`.agents/skills/e2e-playwright`](file:///.agents/skills/e2e-playwright/SKILL.md)                   | Playwright E2E browser tests, `localStorage` fixtures, drag-and-drop verification.                  |
| **`devops-amplify`**          | [`.agents/skills/devops-amplify`](file:///.agents/skills/devops-amplify/SKILL.md)                   | Multi-stage Docker, Docker Compose, environment injection (`set-env.js`), AWS Amplify.              |

---

## ⚡ 4. Essential Verification Commands

```bash
# Run unit test suite (Vitest)
npm test -- --watch=false

# Configure environment and build production bundle
npm run config:env
npm run build

# Run Playwright End-to-End browser tests
npm run test:e2e

# Spin up Docker development environment
npm run docker:up
```
