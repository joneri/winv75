import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

async function findRacedayId(request: APIRequestContext, gameType: 'V85' | 'V86' | 'DD') {
  const response = await request.get('http://127.0.0.1:3001/api/raceday?limit=200')
  expect(response.ok()).toBeTruthy()

  const racedays = await response.json()
  const match = racedays.find((item: any) => {
    const forms = item?.gameTypes || {}
    const direct = Array.isArray(forms?.[gameType]) && forms[gameType].length > 0
    const lower = Array.isArray(forms?.[gameType.toLowerCase()]) && forms[gameType.toLowerCase()].length > 0
    return direct || lower
  })

  expect(match, `Expected at least one raceday with ${gameType}`).toBeTruthy()
  return match._id as string
}

async function openSuggestionDialog(page: Page, title: string, generateLabel = 'Generera spelförslag', dialogTitle = title) {
  await page.getByRole('button', { name: title }).click()
  const dialog = page.getByRole('dialog').filter({ hasText: dialogTitle })
  await expect(dialog).toBeVisible()
  const generateButton = dialog.getByRole('button', { name: generateLabel })
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

test('V85 Stalstomme stays within the special high-budget range with four spikes', async ({ request }) => {
  const racedayId = await findRacedayId(request, 'V85')

  const templatesResponse = await request.get('http://127.0.0.1:3001/api/raceday/v85/templates')
  expect(templatesResponse.ok()).toBeTruthy()
  const templatesBody = await templatesResponse.json()
  const stalstomme = (templatesBody?.templates || []).find((item: any) => item?.key === 'stalstomme')
  expect(stalstomme).toBeTruthy()
  expect(stalstomme.label).toContain('Stalstomme')
  expect(stalstomme.budget?.minCost).toBe(900)
  expect(stalstomme.budget?.maxCost).toBe(2000)

  const generateResponse = await request.post(`http://127.0.0.1:3001/api/raceday/${racedayId}/v85`, {
    data: {
      templateKey: 'stalstomme',
      mode: 'balanced'
    }
  })
  expect(generateResponse.ok()).toBeTruthy()

  const suggestion = await generateResponse.json()
  expect(suggestion?.template?.key).toBe('stalstomme')
  expect(suggestion?.budget?.minCost).toBe(900)
  expect(suggestion?.budget?.maxCost).toBe(2000)
  expect(suggestion?.totalCost).toBeGreaterThanOrEqual(900)
  expect(suggestion?.totalCost).toBeLessThanOrEqual(2000)
  expect((suggestion?.legs || []).filter((leg: any) => leg?.count === 1)).toHaveLength(4)
})

test('V86 suggestions can be generated from the raceday view', async ({ page, request }) => {
  const racedayId = await findRacedayId(request, 'V86')

  await page.goto(`/raceday/${racedayId}`)

  const { dialog, generateButton } = await openSuggestionDialog(page, 'V86-spelförslag')
  await generateButton.click()

  await expect(dialog.locator('.ticket')).toBeVisible()
  await expect(dialog.getByText(/kr totalt/)).toBeVisible()
})

test('DD suggestions can generate visible style variants and budget feedback', async ({ page, request }) => {
  const racedayId = await findRacedayId(request, 'DD')

  await page.goto(`/raceday/${racedayId}`)

  const { dialog, generateButton } = await openSuggestionDialog(page, 'DD-förslag', 'Generera DD', 'Dagens Dubbel')
  await generateButton.click()

  await expect(dialog.locator('.ticket')).toBeVisible()
  await expect(dialog.getByText(/kr totalt/)).toBeVisible()
  await expect(dialog.getByText(/Max 80 kr/)).toBeVisible()
  await expect(dialog.getByText(/Kvar/)).toBeVisible()
  await expect(dialog.locator('.suggestion-chip').first()).toBeVisible()
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

  await expect(page.getByText(/Sparad biljett/)).toBeVisible()
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
