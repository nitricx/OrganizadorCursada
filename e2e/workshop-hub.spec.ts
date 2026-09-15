import { test, expect } from '@playwright/test';

test.describe('Community Workshop Hub - Search and Sortable Table', () => {
  test.beforeEach(async ({ page }) => {
    // Reset localStorage to start in clean state
    await page.goto('/home');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('should open Workshop Hub and display table with community plans', async ({
    page,
  }) => {
    await page.goto('/workshop');

    // Confirm visibility of Workshop Hub header
    const pageHeader = page.locator('.app-page-header .page-title');
    await expect(pageHeader).toContainText('Plan Hub Comunitario');

    // Confirm presence of search input and table
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();

    const table = page.locator('[data-testid="workshop-table"]');
    await expect(table).toBeVisible();

    const rows = page.locator('[data-testid="plan-row"]');
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBe(2);
  });

  test('should filter plans in table when typing in search input', async ({ page }) => {
    await page.goto('/workshop');

    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('Sistemas');

    const rows = page.locator('[data-testid="plan-row"]');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Ingeniería en Sistemas de Información');

    // Clear search
    await searchInput.fill('');
    await expect(rows).toHaveCount(2);
  });

  test('should sort table by career name (ascending and descending)', async ({
    page,
  }) => {
    await page.goto('/workshop');

    const sortNameHeader = page.locator('[data-testid="sort-name"]');
    await expect(sortNameHeader).toBeVisible();

    // Default starts sorted by name ASC -> Ingeniería en Sistemas first
    const firstRowNameAsc = page.locator('[data-testid="plan-row"]').first().locator('.plan-title');
    await expect(firstRowNameAsc).toHaveText('Ingeniería en Sistemas de Información');

    // Click Career header -> changes to DESC -> Licenciatura en Diseño Audiovisual
    await sortNameHeader.click();
    const firstRowNameDesc = page
      .locator('[data-testid="plan-row"]')
      .first()
      .locator('.plan-title');
    await expect(firstRowNameDesc).toHaveText('Licenciatura en Diseño Audiovisual');

    // Click again -> changes to ASC -> Ingeniería en Sistemas
    await sortNameHeader.click();
    await expect(
      page.locator('[data-testid="plan-row"]').first().locator('.plan-title'),
    ).toHaveText('Ingeniería en Sistemas de Información');
  });

  test('should sort table by faculty (ascending and descending)', async ({ page }) => {
    await page.goto('/workshop');

    const sortFacultyHeader = page.locator('[data-testid="sort-faculty"]');
    await expect(sortFacultyHeader).toBeVisible();

    // Click Faculty -> ASC -> "Escuela de Artes y Medios" first
    await sortFacultyHeader.click();
    const firstRowFacultyAsc = page
      .locator('[data-testid="plan-row"]')
      .first()
      .locator('.col-faculty');
    await expect(firstRowFacultyAsc).toHaveText('Escuela de Artes y Medios');

    // Click again -> DESC -> "Facultad Regional Buenos Aires" first
    await sortFacultyHeader.click();
    const firstRowFacultyDesc = page
      .locator('[data-testid="plan-row"]')
      .first()
      .locator('.col-faculty');
    await expect(firstRowFacultyDesc).toHaveText('Facultad Regional Buenos Aires');
  });

  test('should allow subscribing to a plan from table', async ({ page }) => {
    await page.goto('/workshop');

    // Search "Sistemas" and subscribe
    await page.locator('[data-testid="search-input"]').fill('Sistemas');
    const subscribeBtn = page
      .locator('[data-testid="plan-row"]')
      .first()
      .getByRole('button', { name: /Suscribirse/i });
    await subscribeBtn.click();

    // Redirects to /home with loaded career
    await expect(page.locator('.header-title-group h1')).toHaveText('Plan de Cursada');
    await expect(page.locator('app-no-plan-selected')).not.toBeVisible();
  });

  test('should verify that header on /publish does not have back button', async ({
    page,
  }) => {
    await page.goto('/publish');
    const headerTitle = page.locator('.app-page-header .app-page-title');
    await expect(headerTitle).toHaveText('Compartir / Publicar Plan de Estudio');

    const backBtn = page.locator('header button[aria-label="Volver"]');
    await expect(backBtn).not.toBeVisible();
  });
});
