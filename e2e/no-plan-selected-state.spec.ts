import { test, expect } from '@playwright/test';

test.describe('Validation of "No Plan Selected" State on /home and /myWeek', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to simulate state with no career/plan selected
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should display app-no-plan-selected component on /home when no plan is selected', async ({ page }) => {
    await page.goto('/home');
    const noPlanComponent = page.locator('app-no-plan-selected');
    await expect(noPlanComponent).toBeVisible();

    const title = noPlanComponent.locator('.empty-state-title');
    await expect(title).toContainText('Plan de Cursada');

    // Verify action buttons are visible
    await expect(page.getByRole('button', { name: /Explorar Planes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cargar Demo/i })).toBeVisible();
  });

  test('should display app-no-plan-selected component on /myWeek when no plan is selected', async ({ page }) => {
    await page.goto('/myWeek');
    const noPlanComponent = page.locator('app-no-plan-selected');
    await expect(noPlanComponent).toBeVisible();

    const title = noPlanComponent.locator('.empty-state-title');
    await expect(title).toContainText('Plan de estudio');

    // Normal schedule grid should not be rendered in this state
    await expect(page.locator('.calendar-grid-wrapper')).not.toBeVisible();
  });

  test('should load demo plan when clicking "Cargar Demo" from no-plan state and restore views', async ({ page }) => {
    await page.goto('/home');
    const noPlanComponent = page.locator('app-no-plan-selected');
    await expect(noPlanComponent).toBeVisible();

    // Click "Cargar Demo" inside NoPlanSelected component
    const demoButton = noPlanComponent.getByRole('button', { name: /Cargar Demo/i });
    await demoButton.click();

    // Empty state component should disappear and show subject grid
    await expect(noPlanComponent).not.toBeVisible();
    await expect(page.locator('.header-title-group h1')).toHaveText('Plan de Cursada');

    // Navigate to /myWeek and confirm empty state is no longer displayed
    await page.goto('/myWeek');
    await expect(page.locator('app-no-plan-selected')).not.toBeVisible();
  });
});
