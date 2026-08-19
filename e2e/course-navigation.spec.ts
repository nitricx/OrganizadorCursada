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
    await expect(noPlanComponent.locator('.empty-state-title')).toContainText('Plan de Cursada no seleccionado');
  });

  test('debe permitir cargar el plan demo, visualizar las materias y navegar', async ({ page }) => {
    // 1. El usuario hace click en "Cargar Demo"
    const loadDemoBtn = page.getByRole('button', { name: /Cargar Demo/i });
    await expect(loadDemoBtn).toBeVisible();
    await loadDemoBtn.click();

    // 2. El estado sin plan se oculta al cargar un plan
    await expect(page.locator('app-no-plan-selected')).not.toBeVisible();

    // 3. Al cargar el demo, la barra de navegación debe mostrar el selector de carrera
    await expect(page.locator('app-career-selector')).toBeVisible();

    // 4. Navegar a "Mi Semana" usando el menú lateral
    const myWeekLink = page.locator('mat-nav-list a', { hasText: 'Mi Semana' });
    await myWeekLink.click();
    await expect(page).toHaveURL(/\/myWeek/);

    // 5. Navegar a "Correlatividades" usando el menú lateral
    const requisitesLink = page.locator('mat-nav-list a', { hasText: 'Correlatividades' });
    await requisitesLink.click();
    await expect(page).toHaveURL(/\/requisites/);

    // 6. Volver a "Home"
    const homeLink = page.locator('mat-nav-list a', { hasText: 'Home' });
    await homeLink.click();
    await expect(page).toHaveURL(/\/home/);
  });
});
