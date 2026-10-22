import { expect, test } from '@playwright/test';

const viewports = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

const routes = [
  '/',
  '/accounts',
  '/transactions',
  '/transactions/new',
  '/budgets',
  '/analytics',
  '/imports',
  '/savings',
  '/settings',
];

test('redesign jest responsywny na kluczowych ekranach', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.setViewportSize(viewports[2]);
  await page.goto('/');
  await page.getByLabel('Adres e-mail').fill('demo@flowbudget.local');
  await page.getByLabel('Hasło').fill('ZAQ!2wsx');
  await page.getByRole('button', { name: 'Zaloguj się' }).click();
  await expect(page.getByRole('heading', { name: /Dzień dobry/ })).toBeVisible();
  errors.length = 0;

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.evaluate((path) => {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, route);
      await expect(page.locator('h1')).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(overflow, `${route} ma poziomy overflow przy ${viewport.width}px`).toBe(false);
    }
    if (viewport.width <= 768) {
      await page.evaluate(() => {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      const menu = page.getByRole('button', { name: 'Otwórz menu' });
      await expect(menu).toBeVisible();
      await menu.click();
      await expect(page.getByRole('link', { name: 'Ustawienia' })).toBeVisible();
      await page.getByRole('button', { name: 'Zamknij menu' }).first().click();
    }
  }

  expect(errors).toEqual([]);
});
