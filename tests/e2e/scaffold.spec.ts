import { test, expect } from '@playwright/test';
test('switches language, persists it and opens a display route', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Cuelia' })).toBeVisible();
  await page.getByLabel('Lingua', { exact: true }).selectOption('en');
  await expect(page.getByText('Presentation control', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Language', { exact: true })).toHaveValue('en');
  await page.goto('/display/stage');
  await expect(page.getByText('Waiting for content', { exact: true })).toBeVisible();
});
