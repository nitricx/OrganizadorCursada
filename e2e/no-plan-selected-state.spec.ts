import { test, expect } from '@playwright/test';

test.describe('Validación del Estado "Sin Plan Seleccionado" en /home y /myWeek', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar localStorage antes de cada prueba para simular estado sin carrera/plan seleccionado
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('debe mostrar el componente app-no-plan-selected en /home cuando no hay plan seleccionado', async ({ page }) => {
    await page.goto('/home');
    const noPlanComponent = page.locator('app-no-plan-selected');
    await expect(noPlanComponent).toBeVisible();

    const title = noPlanComponent.locator('.empty-state-title');
    await expect(title).toContainText('Plan de Cursada');

    // Verificar que los botones de acción estén visibles
    await expect(page.getByRole('button', { name: /Explorar Planes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cargar Demo/i })).toBeVisible();
  });

  test('debe mostrar el componente app-no-plan-selected en /myWeek cuando no hay plan seleccionado', async ({ page }) => {
    await page.goto('/myWeek');
    const noPlanComponent = page.locator('app-no-plan-selected');
    await expect(noPlanComponent).toBeVisible();

    const title = noPlanComponent.locator('.empty-state-title');
    await expect(title).toContainText('Plan de estudio');

    // La grilla horaria normal no debe estar renderizada en este estado
    await expect(page.locator('.calendar-grid-wrapper')).not.toBeVisible();
  });

  test('debe cargar el plan demo al hacer click en "Cargar Demo" desde el estado sin plan y restaurar las vistas', async ({ page }) => {
    await page.goto('/home');
    const noPlanComponent = page.locator('app-no-plan-selected');
    await expect(noPlanComponent).toBeVisible();

    // Hacer click en "Cargar Demo" dentro del componente NoPlanSelected
    const demoButton = noPlanComponent.getByRole('button', { name: /Cargar Demo/i });
    await demoButton.click();

    // El componente vacio debe desaparecer y mostrar la grilla de materias
    await expect(noPlanComponent).not.toBeVisible();
    await expect(page.locator('.header-title-group h1')).toHaveText('Plan de Cursada');

    // Navegar a /myWeek y confirmar que ya no muestra el empty state
    await page.goto('/myWeek');
    await expect(page.locator('app-no-plan-selected')).not.toBeVisible();
  });
});
