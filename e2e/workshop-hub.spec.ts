import { test, expect } from '@playwright/test';

test.describe('Hub de Planes Comunitario - Buscador y Tabla Ordenable', () => {
  test.beforeEach(async ({ page }) => {
    // Resetear localStorage para arrancar en estado limpio
    await page.goto('/home');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('debe abrir el Hub de Planes y mostrar la tabla con los planes comunitarios', async ({ page }) => {
    await page.goto('/workshop');

    // Confirmar visibilidad del encabezado del Hub de Planes
    const pageHeader = page.locator('.app-page-header .page-title');
    await expect(pageHeader).toContainText('Plan Hub Comunitario');

    // Confirmar presencia del buscador y de la tabla
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toBeVisible();

    const table = page.locator('[data-testid="workshop-table"]');
    await expect(table).toBeVisible();

    const rows = page.locator('[data-testid="plan-row"]');
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBe(2);
  });

  test('debe filtrar los planes en la tabla al escribir en el buscador', async ({ page }) => {
    await page.goto('/workshop');

    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('Sistemas');

    const rows = page.locator('[data-testid="plan-row"]');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Ingeniería en Sistemas de Información');

    // Limpiar búsqueda
    await searchInput.fill('');
    await expect(rows).toHaveCount(2);
  });

  test('debe ordenar la tabla por Nombre de Carrera (ascendente y descendente)', async ({ page }) => {
    await page.goto('/workshop');

    const sortNameHeader = page.locator('[data-testid="sort-name"]');
    await expect(sortNameHeader).toBeVisible();

    // Por defecto inicia ordenado por nombre ASC -> Ingeniería en Sistemas primero
    const firstRowNameAsc = page.locator('[data-testid="plan-row"]').first().locator('.plan-title');
    await expect(firstRowNameAsc).toHaveText('Ingeniería en Sistemas de Información');

    // Click en encabezado Carrera -> cambia a DESC -> Licenciatura en Diseño Audiovisual
    await sortNameHeader.click();
    const firstRowNameDesc = page.locator('[data-testid="plan-row"]').first().locator('.plan-title');
    await expect(firstRowNameDesc).toHaveText('Licenciatura en Diseño Audiovisual');

    // Volver a clickear -> cambia a ASC -> Ingeniería en Sistemas
    await sortNameHeader.click();
    await expect(page.locator('[data-testid="plan-row"]').first().locator('.plan-title')).toHaveText('Ingeniería en Sistemas de Información');
  });

  test('debe ordenar la tabla por Facultad (ascendente y descendente)', async ({ page }) => {
    await page.goto('/workshop');

    const sortFacultyHeader = page.locator('[data-testid="sort-faculty"]');
    await expect(sortFacultyHeader).toBeVisible();

    // Click en Facultad -> ASC -> "Escuela de Artes y Medios" primera
    await sortFacultyHeader.click();
    const firstRowFacultyAsc = page.locator('[data-testid="plan-row"]').first().locator('.col-faculty');
    await expect(firstRowFacultyAsc).toHaveText('Escuela de Artes y Medios');

    // Click de nuevo -> DESC -> "Facultad Regional Buenos Aires" primera
    await sortFacultyHeader.click();
    const firstRowFacultyDesc = page.locator('[data-testid="plan-row"]').first().locator('.col-faculty');
    await expect(firstRowFacultyDesc).toHaveText('Facultad Regional Buenos Aires');
  });

  test('debe permitir suscribirse a un plan desde la tabla', async ({ page }) => {
    await page.goto('/workshop');

    // Buscar "Sistemas" y suscribirse
    await page.locator('[data-testid="search-input"]').fill('Sistemas');
    const subscribeBtn = page.locator('[data-testid="plan-row"]').first().getByRole('button', { name: /Suscribirse/i });
    await subscribeBtn.click();

    // Se redirige a /home con la carrera cargada
    await expect(page.locator('.header-title-group h1')).toHaveText('Plan de Cursada');
    await expect(page.locator('app-no-plan-selected')).not.toBeVisible();
  });

  test('debe verificar que el encabezado de /publish no tiene el botón de volver', async ({ page }) => {
    await page.goto('/publish');
    const headerTitle = page.locator('.app-page-header .app-page-title');
    await expect(headerTitle).toHaveText('Compartir / Publicar Plan de Estudio');

    const backBtn = page.locator('header button[aria-label="Volver"]');
    await expect(backBtn).not.toBeVisible();
  });
});
