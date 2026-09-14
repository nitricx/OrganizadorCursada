import { test, expect } from '@playwright/test';

test.describe('Navegación y Flujo Inicial del Usuario', () => {
  test.beforeEach(async ({ page }) => {
    // Limpiar localStorage antes de cada prueba para asegurar estado limpio
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('debe mostrar el estado sin plan seleccionado al entrar por primera vez', async ({ page }) => {
    // Verificamos título principal de la barra de navegación
    const brandTitle = page.locator('.app-brand-title');
    await expect(brandTitle).toHaveText('OrganizadorCursada');

    // Verificamos que el componente app-no-plan-selected esté visible en /home
    const noPlanComponent = page.locator('app-no-plan-selected');
    await expect(noPlanComponent).toBeVisible();
    await expect(noPlanComponent.locator('.empty-state-title')).toContainText('Plan de Cursada');
  });
});
