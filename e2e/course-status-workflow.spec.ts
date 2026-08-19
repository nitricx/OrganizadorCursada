import { test, expect } from '@playwright/test';

test.describe('Flujo de Interacción y Cambio de Estado de Materias', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Limpiar almacenamiento y cargar la app en un estado nuevo
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // 2. Hacer click en "Cargar Demo" para iniciar la experiencia interactiva
    const loadDemoBtn = page.getByRole('button', { name: /Cargar Demo/i });
    await expect(loadDemoBtn).toBeVisible();
    await loadDemoBtn.click();

    // 3. Confirmar que la bienvenida desapareció y el selector de carrera está visible
    await expect(page.locator('.welcome-title')).not.toBeVisible();
    await expect(page.locator('app-career-selector')).toBeVisible();
  });

  test('debe mostrar la cuadrícula de años y cuatrimestres', async ({ page }) => {
    // Verificar que las columnas de los años académicos se muestren en pantalla
    const yearCols = page.locator('.year-col');
    await expect(yearCols.first()).toBeVisible();
    expect(await yearCols.count()).toBeGreaterThan(0);
  });

  test('debe permitir cambiar de vista a Correlatividades y Mi Semana', async ({ page }) => {
    // 1. Navegar a Mi Semana
    await page.locator('mat-nav-list a', { hasText: 'Mi Semana' }).click();
    await expect(page).toHaveURL(/\/myWeek/);

    // 2. Navegar a Diagrama de Correlatividades
    await page.locator('mat-nav-list a', { hasText: 'Correlatividades' }).click();
    await expect(page).toHaveURL(/\/requisites/);

    // 3. Regresar a Home
    await page.locator('mat-nav-list a', { hasText: 'Home' }).click();
    await expect(page).toHaveURL(/\/home/);
  });
});
