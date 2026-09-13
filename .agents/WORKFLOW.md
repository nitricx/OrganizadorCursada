# Agent Collaboration & Task Lifecycle Protocol (`WORKFLOW.md`)

This document defines the standardized engineering lifecycle for AI agents and human developers collaborating on **OrganizadorCursada**, formalizing role transitions, ticket-based hand-offs, and persona guardrails.

Detailed persona profiles and strict limitations are documented in [`.agents/PERSONAS.md`](./PERSONAS.md).
Active and completed tickets reside in [`.agents/tickets/`](./tickets/README.md).

> [!IMPORTANT]
> **Mandatory Automatic Persona Hand-Off**:
> AI agents MUST NOT pause execution after ticket specification (Phase 1) or QA verification (Phase 4) waiting for user prompt reminders. The agent must automatically transition personas to complete the hand-off chain:
>
> 1. When `analista` advances a ticket to `READY_FOR_DEV`, the agent MUST immediately invoke `gitflow` to create the feature branch (`npm run gitflow:branch -- <TICK-ID>`).
> 2. When `qa` certifies a ticket (`QA_VERIFIED`), the agent MUST immediately invoke `gitflow` to generate the Conventional Commit (`npm run gitflow:commit -- <TICK-ID>`) and prepare/open the Pull Request towards `develop`.

---

## 🔄 The 5-Phase Delivery Lifecycle & Ticket Machine

```
  [1. ANALISTA]          [2. GITFLOW]         [3. DESARROLLADOR]          [4. QA TESTER]         [5. GITFLOW]
   Ticket & Gherkin  ---> Create Branch --->   Implementation     --->    Verification    --->    Commit & PR
   DRAFT->READY_FOR_DEV   feature/*            IN_DEV->READY_FOR_QA       QA_VERIFIED/REJECTED    to develop (CLOSED)
```

---

### Phase 1: Specification & Ticket Creation (Persona: `analista`)

- **Objective**: Clarify requirements, verify domain boundaries, and generate an actionable ticket before writing code.
- **Ticket Transition**: `DRAFT` $\rightarrow$ `READY_FOR_DEV`.
- **Deterministic Automation**:
  - Scaffold ticket: `npm run ticket:new -- "<title>"`
  - Set ready for dev: `npm run ticket:status -- <TICK-ID> READY_FOR_DEV`
- **Actions**:
  1. Instantiate ticket with `npm run ticket:new -- "<descriptive title>"`.
  2. Complete User Stories (_As a... I want... So that..._).
  3. Define binary, testable Acceptance Criteria using **Gherkin** (_Given... When... Then..._).
  4. Analyze impact on subject states (`CourseStatus`), prerequisite trees, or student privacy.
  5. Identify authoritative services governing state changes (`CourseService`, `PlanService`, `CareerService`).
  6. Advance ticket to `READY_FOR_DEV`: `npm run ticket:status -- <TICK-ID> READY_FOR_DEV`.
- **Strict Limitation**: PROHIBITED from editing source files in `src/app/` or executing build/test commands.
- **References**:
  - [`.agents/PERSONAS.md`](./PERSONAS.md)
  - [`.agents/skills/analista`](./skills/analista/SKILL.md)

---

### Phase 2: Version Control Setup (Persona: `gitflow`)

- **Objective**: Ensure a clean, isolated working branch for the ticket.
- **Deterministic Automation**:
  - Create feature branch: `npm run gitflow:branch -- <TICK-ID>`
- **Actions**:
  1. Create semantic branch automatically synced with `develop`:
     ```bash
     npm run gitflow:branch -- <TICK-ID>
     ```
- **Strict Limitation**: Never commit or branch unverified code directly into `main` or `develop`.
- **References**:
  - [`.agents/skills/gitflow`](./skills/gitflow/SKILL.md)

---

### Phase 3: Technical Implementation (Persona: `desarrollador`)

- **Objective**: Build the solution with decoupled architecture and mandatory unit tests.
- **Ticket Transition**: `READY_FOR_DEV` $\rightarrow$ `IN_DEVELOPMENT` $\rightarrow$ `READY_FOR_QA`.
- **Deterministic Automation**:
  - Generate Service + Spec: `npm run gen:service -- <service-name>`
  - Quick Rule Audit: `npm run qa:audit`
  - Send to QA: `npm run ticket:status -- <TICK-ID> READY_FOR_QA`
- **Actions**:
  1. Pick up ticket and mark in progress: `npm run ticket:status -- <TICK-ID> IN_DEVELOPMENT desarrollador`.
  2. If creating a new service, scaffold with: `npm run gen:service -- <name>`.
  3. **Service-First Logic**: Create or modify methods in `src/app/services/` with immutable Signals (`set(new Map(...))`, `set([...list])`).
  4. **Mandatory Service Unit Tests**: Author comprehensive specs in `*.service.spec.ts`.
  5. **Lean Presentation Components**: Standalone components consuming CSS tokens (`var(--...)`).
  6. Audit rules locally: `npm run qa:audit`.
  7. Transition state: `npm run ticket:status -- <TICK-ID> READY_FOR_QA`.
- **Strict Limitations**:
  - PROHIBITED from marking tickets as `QA_VERIFIED` or `CLOSED`.
  - PROHIBITED from omitting unit tests for modified services.
  - PROHIBITED from using dummy/mock data or hardcoded hex colors.
- **References**:
  - [`.agents/PERSONAS.md`](./PERSONAS.md)
  - [`.agents/skills/desarrollador`](./skills/desarrollador/SKILL.md)
  - [`.agents/skills/angular`](./skills/angular/SKILL.md)
  - [`.agents/skills/ux-ui-design-system`](./skills/ux-ui-design-system/SKILL.md)

---

### Phase 4: Quality Assurance & Certification (Persona: `qa`)

- **Objective**: Prevent regressions and certify acceptance criteria satisfaction as an impartial auditor.
- **Ticket Transition**: `READY_FOR_QA` $\rightarrow$ `QA_VERIFIED` (or `REJECTED`).
- **Deterministic Automation**:
  - Unified Verification & Token Condenser: `npm run qa:verify`
  - Static Rule Audit: `npm run qa:audit`
  - Update ticket: `npm run ticket:status -- <TICK-ID> QA_VERIFIED` _(or `REJECTED`)_
- **Actions**:
  1. Pick up ticket in `READY_FOR_QA` state.
  2. Execute unified verification runner:
     ```bash
     npm run qa:verify
     ```
  3. If relevant, run E2E browser tests:
     ```bash
     npm run test:e2e
     ```
  4. Audit that Gherkin criteria are fulfilled.
  5. **Decision Gate**:
     - **Pass**: Run `npm run ticket:status -- <TICK-ID> QA_VERIFIED qa`.
     - **Fail**: Document Bug Report in the ticket and run `npm run ticket:status -- <TICK-ID> REJECTED qa`.
- **Strict Limitations**:
  - PROHIBITED from editing source code in `src/app/` to fix bugs. QA audits and reports; dev fixes.
  - PROHIBITED from approving tickets with failing tests or compile errors.
- **References**:
  - [`.agents/PERSONAS.md`](./PERSONAS.md)
  - [`.agents/skills/qa`](./skills/qa/SKILL.md)
  - [`.agents/skills/e2e-playwright`](./skills/e2e-playwright/SKILL.md)
  - [`.agents/skills/seguridad-privacidad`](./skills/seguridad-privacidad/SKILL.md)

---

### Phase 5: Integration & Delivery (Persona: `gitflow`)

- **Objective**: Safely integrate validated changes into version control.
- **Ticket Transition**: `QA_VERIFIED` $\rightarrow$ `CLOSED`.
- **Deterministic Automation**:
  - Conventional Commit: `npm run gitflow:commit -- <TICK-ID>`
  - Close Ticket: `npm run ticket:status -- <TICK-ID> CLOSED`
- **Actions**:
  1. Verify the ticket is marked `QA_VERIFIED`.
  2. Generate Conventional Commit automatically:
     ```bash
     npm run gitflow:commit -- <TICK-ID>
     ```
  3. Rebase onto `develop` if upstream changes occurred (`git pull --rebase origin develop`).
  4. Open Pull Request targeting `develop` (MUST ALWAYS use **Squash and Merge**).
  5. Close ticket: `npm run ticket:status -- <TICK-ID> CLOSED`.
- **Strict Limitation**: Never commit or open PR without prior `QA_VERIFIED` certification.
- **References**:
  - [`.agents/PERSONAS.md`](./PERSONAS.md)
  - [`.agents/skills/gitflow`](./skills/gitflow/SKILL.md)
