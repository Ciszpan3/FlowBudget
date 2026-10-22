import { test, expect } from '@playwright/test';
test('ekran logowania jest dostępny', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Zaloguj się' })).toBeVisible();
  await expect(page.getByLabel('Adres e-mail')).toBeVisible();
});
