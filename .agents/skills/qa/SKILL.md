---
name: qa
description: Quality assurance (QA), test planning, regression validation, and automated test execution for OrganizadorCursada. Trigger when planning tests, auditing features, writing test specs, executing Vitest or Playwright suites, or filing bug reports. Triggers: qa, quality assurance, tester, testing, test plan, test cases, regression, bug report, vitest, playwright.
---

# Quality Assurance & Test Engineering Skill

This skill defines the quality assurance strategy, verification methodologies, and audit checklists for **OrganizadorCursada**.

---

## 1. Testing Strategy & Pyramid

The project maintains a focused two-tier testing strategy:

```
          / \
         /   \
        / E2E \       Playwright (@playwright/test)
       /       \      Critical end-user browser workflows
      /---------\
     /           \
    /   Unit      \   Vitest + Angular Builder (ng test)
   /   (Services)  \  Domain logic, prerequisite rules, state stores
  /-----------------\
```

1. **Mandatory Service Unit Tests**:
   - All domain logic, prerequisite calculations, course filtering, and state mutations live in `src/app/services/`.
   - Every service must have an accompanying `.service.spec.ts` file.
   - Lean presentation components do not require individual unit tests unless they contain complex UI rendering logic.
2. **End-to-End (E2E) Browser Tests**:
   - Automated via Playwright.
   - Validates end-to-end user journeys: navigation, catalog selection, commission scheduling, drag-and-drop moves, and `localStorage` persistence.

---

## 2. Test Execution Commands

| Objective                        | Command                     |
| :------------------------------- | :-------------------------- |
| **Run full unit test suite**     | `npm test -- --watch=false` |
| **Run all Playwright E2E tests** | `npm run test:e2e`          |
| **Interactive E2E UI Mode**      | `npm run test:e2e:ui`       |
| **Debug E2E Mode**               | `npm run test:e2e:debug`    |
| **Compile & type-check**         | `npm run build`             |

---

## 3. Critical Verification Matrix

When validating features or performing regression sweeps, verify:

### 1. Course State Machine Transitions

- [ ] Valid transition: `pending` -> `coursing` (with all required prerequisites satisfied).
- [ ] Valid transition: `coursing` -> `coursed`.
- [ ] Valid transition: `coursed` -> `approved`.
- [ ] Attempting to course without direct prerequisites: system must block the transition.
- [ ] Attempting to course with direct prerequisites coursed but nested prerequisites unapproved: system must block enrollment.

### 2. Downstream Lock Safety Rule

- [ ] If Course B is `coursing` or `approved` and requires Course A (`approved`), verify that Course A **CANNOT** be demoted to `pending` or `coursed` until Course B is demoted first.

### 3. Semester Drag-and-Drop

- [ ] Moving a subject to a semester preceding its prerequisite subjects must trigger an advisory warning or be blocked.

### 4. Schedule & Weekly Timetable (`/myWeek`)

- [ ] Exactly one commission selectable per subject.
- [ ] Time overlap detection and clear visual flagging of conflicting sessions.
- [ ] Correct iCal (`.ics`) generation and Google Calendar deep-links with accurate dates/times.

### 5. Privacy & Airgap Integrity

- [ ] User progress (`courseStatuses`, notes, commission selections) remains strictly in `localStorage`.
- [ ] Exported and published Workshop manifests contain no identifying user progress ($k$-anonymity).

### 6. Themes & Responsive Layout

- [ ] Interface renders cleanly in both light and dark themes without unreadable text or invisible borders.
- [ ] No visual element consumes hardcoded hexadecimal colors outside design tokens in `src/styles.css`.

---

## 4. Bug Report Template

Report defects using this structured template:

````markdown
### [BUG] Concise summary of the defect

**Severity**: Critical | High | Medium | Low
**Area / Module**: (e.g., CourseService / Prerequisites / Timetable)

#### Steps to Reproduce

1. Load the "Sistemas" study plan.
2. Mark "Algebra 1" as "Approved".
3. Mark "Algebra 2" as "Coursing".
4. Attempt to change "Algebra 1" to "Pending".

#### Expected Behavior

The system must display an advisory alert blocking the change because "Algebra 2" depends on "Algebra 1".

#### Actual Behavior

"Algebra 1" reverts to "Pending", leaving the prerequisite graph in an inconsistent state.

#### Console Logs / Traceback

```text
[Error traceback or inspection details if applicable]
```
````

```

---

## 5. QA Pre-Release Certification Checklist

- [ ] All unit tests pass with zero failures (`npm test -- --watch=false`).
- [ ] TypeScript compilation succeeds with zero errors (`npm run build`).
- [ ] Playwright E2E suites pass cleanly (`npm run test:e2e`).
- [ ] Browser developer console contains zero unhandled exceptions across `/home`, `/myWeek`, and `/workshop`.
- [ ] `localStorage` accurately persists state and recovers after a browser reload (`F5`).
```
