import { test, expect } from '@playwright/test';

test.describe('Navigation and Initial User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should display the no plan selected state on initial load', async ({ page }) => {
    // Verify main brand title in navigation bar
    const brandTitle = page.locator('.app-brand-title');
    await expect(brandTitle).toHaveText('OrganizadorCursada');

    // Verify that app-no-plan-selected component is visible on /home
    const noPlanComponent = page.locator('app-no-plan-selected');
    await expect(noPlanComponent).toBeVisible();
    await expect(noPlanComponent.locator('.empty-state-title')).toContainText('Plan de Cursada');
  });
});
