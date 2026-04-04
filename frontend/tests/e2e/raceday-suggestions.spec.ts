import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

async function findRacedayId(request: APIRequestContext, gameType: 'V85' | 'V86') {
  const response = await request.get('http://127.0.0.1:3001/api/raceday?limit=200')
  expect(response.ok()).toBeTruthy()

  const racedays = await response.json()
  const match = racedays.find((item: any) => Array.isArray(item?.gameTypes?.[gameType]) && item.gameTypes[gameType].length > 0)

  expect(match, `Expected at least one raceday with ${gameType}`).toBeTruthy()
  return match._id as string
}

async function openSuggestionDialog(page: Page, title: string) {
  await page.getByRole('button', { name: title }).click()
  const dialog = page.getByRole('dialog').filter({ hasText: title })
  await expect(dialog).toBeVisible()
  const generateButton = dialog.getByRole('button', { name: 'Generera spelförslag' })
  await expect(generateButton).toBeEnabled()
  return { dialog, generateButton }
}

test('V85 suggestions can be generated from the raceday view', async ({ page, request }) => {
  const racedayId = await findRacedayId(request, 'V85')

  await page.goto(`/raceday/${racedayId}`)

  const { dialog, generateButton } = await openSuggestionDialog(page, 'V85-spelförslag')
  await generateButton.click()

  await expect(dialog.locator('.ticket')).toBeVisible()
  await expect(dialog.getByText(/kr totalt/)).toBeVisible()
})

test('V86 suggestions can be generated from the raceday view', async ({ page, request }) => {
  const racedayId = await findRacedayId(request, 'V86')

  await page.goto(`/raceday/${racedayId}`)

  const { dialog, generateButton } = await openSuggestionDialog(page, 'V86-spelförslag')
  await generateButton.click()

  await expect(dialog.locator('.ticket')).toBeVisible()
  await expect(dialog.getByText(/kr totalt/)).toBeVisible()
})
