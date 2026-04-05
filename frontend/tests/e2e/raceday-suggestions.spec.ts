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
  await dialog.getByRole('button', { name: 'Stäng' }).click()
  await expect(page.locator('.session-panel .compact-row-transient').first()).toBeVisible()
})

test('V86 suggestions can be generated from the raceday view', async ({ page, request }) => {
  const racedayId = await findRacedayId(request, 'V86')

  await page.goto(`/raceday/${racedayId}`)

  const { dialog, generateButton } = await openSuggestionDialog(page, 'V86-spelförslag')
  await generateButton.click()

  await expect(dialog.locator('.ticket')).toBeVisible()
  await expect(dialog.getByText(/kr totalt/)).toBeVisible()
})

test('Saved suggestions can be reopened from the raceday page', async ({ page, request }) => {
  const racedayId = await findRacedayId(request, 'V85')

  await page.goto(`/raceday/${racedayId}`)

  const { dialog, generateButton } = await openSuggestionDialog(page, 'V85-spelförslag')
  await generateButton.click()
  await expect(dialog.locator('.ticket')).toBeVisible()
  await dialog.getByRole('button', { name: 'Stäng' }).click()

  const sessionRow = page.locator('.session-panel .compact-row-transient').first()
  await expect(sessionRow).toBeVisible()
  await sessionRow.click()

  await expect(page.getByText(/Osparat förslag/)).toBeVisible()
  await page.getByRole('button', { name: 'Spara detta förslag' }).click()

  const savedLink = page.locator('.saved-suggestions-panel .compact-row-saved').first()
  await expect(savedLink).toBeVisible()
  await savedLink.click()

  await expect(page.getByText(/Historisk biljett/)).toBeVisible()
  await expect(page.getByText(/Samma tävlingsdag/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Uppdatera resultat' })).toBeVisible()

  const raceLink = page.getByRole('link', { name: 'Öppna lopp' }).first()
  await expect(raceLink).toBeVisible()
  await raceLink.click()
  await expect(page).toHaveURL(new RegExp(`/raceday/${racedayId}/race/`))
})

test('Suggestion analytics view loads recent performance data', async ({ page, request }) => {
  const racedayId = await findRacedayId(request, 'V85')
  const generateResponse = await request.post(`http://127.0.0.1:3001/api/raceday/${racedayId}/v85`, {
    data: {
      multi: true,
      modes: ['balanced'],
      variantCount: 1
    }
  })
  expect(generateResponse.ok()).toBeTruthy()
  const generateBody = await generateResponse.json()
  const saveResponse = await request.post('http://127.0.0.1:3001/api/suggestions/save', {
    data: {
      racedayId,
      items: (generateBody?.suggestions || []).slice(0, 1).map((suggestion: any, index: number) => ({
        clientKey: `playwright-${Date.now()}-${index}`,
        gameType: 'V85',
        suggestion,
        requestSnapshot: {
          multi: true,
          modes: ['balanced'],
          variantCount: 1
        }
      }))
    }
  })
  expect(saveResponse.ok()).toBeTruthy()

  await page.goto('/suggestions/analytics')

  await expect(page.getByRole('heading', { name: 'Resultat över tid' })).toBeVisible()
  await expect(page.getByText(/Sparade förslag/)).toBeVisible()
  await expect(page.locator('.recent-link').first()).toBeVisible()
})
