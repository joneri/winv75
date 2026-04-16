import { expect, test } from '@playwright/test'

test('proposition translation overview loads and language switch updates the list', async ({ page }) => {
  await page.goto('/propositioner/oversattning')

  await expect(page.getByRole('heading', { name: 'Översättningstäckning' })).toBeVisible()
  await expect(page.getByText(/regel- och visningsstatus/i)).toBeVisible()
  await expect(page.getByText(/explicit regelmatchning/i)).toBeVisible()

  const languageField = page.locator('.language-card .v-field').first()
  await languageField.click()
  await page.getByRole('option', { name: 'Finska' }).click()

  await expect(page.getByText(/visning/i).first()).toBeVisible()
  await expect(page.getByText(/audit:/i).first()).toBeVisible()
  await expect(page.locator('.proposition-row').first()).toBeVisible()
})