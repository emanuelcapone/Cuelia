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

test('bootstraps first admin, creates operator and signs in with RBAC', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Nome', { exact: true }).fill('Admin Test');
  await page.getByLabel('Email', { exact: true }).fill('admin@cuelia.local');
  await page.getByLabel('Password', { exact: true }).fill('password1234');
  await page.getByLabel('Conferma password', { exact: true }).fill('password1234');
  await page.getByRole('button', { name: 'Crea amministratore e accedi' }).click();

  await expect(page.getByRole('heading', { name: 'Utenti e ruoli' })).toBeVisible();

  await page.locator('#new-user-name').fill('Operatore Test');
  await page.locator('#new-user-email').fill('op@cuelia.local');
  await page.locator('#new-user-password').fill('password5678');
  await page.locator('#new-user-role').selectOption('operator');
  await page.getByRole('button', { name: 'Crea utente' }).click();
  await expect(page.getByText('op@cuelia.local')).toBeVisible();

  await page.getByRole('button', { name: 'Esci' }).click();
  await expect(page.getByRole('heading', { name: 'Accedi alla regia' })).toBeVisible();

  await page.locator('#signin-email').fill('op@cuelia.local');
  await page.locator('#signin-password').fill('password5678');
  await page.getByRole('button', { name: 'Accedi' }).click();

  await expect(page.getByText('Operatore Test')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Utenti e ruoli' })).toHaveCount(0);
});
