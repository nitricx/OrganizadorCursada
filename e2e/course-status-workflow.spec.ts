import { test, expect } from '@playwright/test';

test.describe('Course State Transition and Interaction Flow', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Clear storage and load app in a clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 2. Click "Cargar Demo" to start interactive experience
    const loadDemoBtn = page.getByRole('button', { name: /Cargar Demo/i });
    await expect(loadDemoBtn).toBeVisible();
    await loadDemoBtn.click();

    // 3. Confirm welcome screen disappeared and career selector is visible
    await expect(page.locator('.welcome-title')).not.toBeVisible();
    await expect(page.locator('app-career-selector')).toBeVisible();
  });

  test('should display the grid of years and semesters', async ({ page }) => {
    // Verify academic year columns are displayed on screen
    const yearCols = page.locator('.year-col');
    await expect(yearCols.first()).toBeVisible();
    expect(await yearCols.count()).toBeGreaterThan(0);
  });
});
