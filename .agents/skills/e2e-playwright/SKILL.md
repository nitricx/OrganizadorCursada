---
name: e2e-playwright
description: End-to-end (E2E) automated browser testing with Playwright for OrganizadorCursada. Trigger when creating, debugging, or running browser tests, localStorage fixtures, navigation specs, drag-and-drop interactions, or modal dialog workflows. Triggers: playwright, e2e, end-to-end, test e2e, browser test, integration tests, ui test, fixture, page object.
---

# Playwright E2E Testing Skill

This skill defines the guidelines, design patterns, and CLI commands for automated End-to-End testing with **Playwright** in **OrganizadorCursada**.

---

## 1. Directory Structure & Configuration

E2E tests reside under `e2e/` and are configured in `playwright.config.ts`:

```text
e2e/
├── course-navigation.spec.ts       # Navigation between /home, /myWeek, /requisites, and /workshop
├── course-status-workflow.spec.ts  # Status change cycle and downstream prerequisite lock checks
├── no-plan-selected-state.spec.ts  # Empty states and initial career selection workflows
└── workshop-hub.spec.ts            # Searching, filtering, and subscribing to community plans
```

### Execution Commands

| Objective                        | Command                                                  |
| :------------------------------- | :------------------------------------------------------- |
| **Run all E2E tests (Headless)** | `npm run test:e2e`                                       |
| **Interactive UI Mode**          | `npm run test:e2e:ui`                                    |
| **Step-by-step Debug Mode**      | `npm run test:e2e:debug`                                 |
| **Run a single test spec**       | `npx playwright test e2e/course-status-workflow.spec.ts` |
| **View the HTML test report**    | `npx playwright show-report`                             |

---

## 2. Fast State Initialization via `localStorage` Fixtures

To avoid repetitive manual UI steps (such as picking a university and degree on every test run), seed the initial application state into `localStorage` before page load using `page.addInitScript()`:

```typescript
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Pre-seed active career and course statuses into localStorage
  await page.addInitScript(() => {
    window.localStorage.setItem('active-career-id', 'sistemas');
    window.localStorage.setItem(
      'course-statuses-sistemas',
      JSON.stringify({
        101: 'approved', // Algebra 1 approved
        102: 'coursed', // Calculus 1 regularized
      }),
    );
  });

  await page.goto('/home');
});
```

---

## 3. Robust Locator Best Practices

> [!TIP]
> Prioritize locators based on **accessibility roles**, **visible text**, or **dedicated test IDs**, avoiding brittle hierarchical DOM selectors like `div > div:nth-child(2) > span`.

```typescript
// RECOMMENDED: Semantic role and accessible name
await page.getByRole('button', { name: /approve/i }).click();
await page.getByRole('heading', { name: 'Organizador de Cursada' }).toBeVisible();

// RECOMMENDED: Dedicated test ID attributes
const courseCard = page.locator('[data-testid="course-card-101"]');
await expect(courseCard).toHaveClass(/status-approved/);

// DISCOURAGED: Brittle CSS structure
await page.locator('.main-grid > div:nth-child(3) > .btn').click();
```

---

## 4. Critical E2E Scenarios to Verify

### 1. Course Status Transitions & Downstream Lock

- Verify clicking a status toggle updates sequentially (`pending` -> `coursing` -> `coursed` -> `approved`).
- Attempt to demote a prerequisite subject that has active dependents; verify the system blocks the demotion and surfaces an advisory alert.

### 2. Commission Selection & Timetable Matrix (`lesson-selector-modal`)

- Open the commission selector modal from a subject in `coursing` status.
- Select a specific commission with scheduled day and time slots.
- Navigate to `/myWeek` and verify the lesson block is rendered in the correct weekday column and hour row.

### 3. Drag-and-Drop Semester Reassignment

- Drag a subject card across semester containers using Playwright's drag API:
  ```typescript
  await page.locator('#course-card-105').dragTo(page.locator('#semester-container-2'));
  ```

### 4. Persistence Across Page Reloads

- Alter statuses for multiple subjects.
- Reload the page with `await page.reload()`.
- Assert that all subjects retain their exact altered statuses.

---

## 5. E2E Verification Checklist

- [ ] Are test specs independent and capable of running in parallel without state collisions?
- [ ] Was `addInitScript` utilized for efficient state seeding where appropriate?
- [ ] Do assertions verify genuine visual updates (`toBeVisible()`, `toHaveClass()`, `toHaveText()`)?
- [ ] Do all tests pass cleanly in headless mode (`npm run test:e2e`)?
