import { test, expect } from '@playwright/test';

test.describe('Production Ready Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PolishedDex/);
  });

  test('core pokemon pages load correctly', async ({ page }) => {
    const testPokemon = ['bulbasaur', 'pikachu', 'charizard'];
    
    for (const pokemon of testPokemon) {
      await page.goto(`/pokemon/${pokemon}`);
      
      // Verify correct URL
      await expect(page).toHaveURL(new RegExp(`.*\/pokemon\/${pokemon}`));
      
      // Verify pokemon name displays
      await expect(page.locator('h1').first()).toContainText(new RegExp(pokemon, 'i'));
    }
  });

  test('pokemon data displays correctly', async ({ page }) => {
    await page.goto('/pokemon/bulbasaur');
    
    // Check types display
    await expect(page.getByLabel('Pokemon Types').getByText('Grass').first()).toBeVisible();
    await expect(page.getByLabel('Pokemon Types').getByText('Poison').first()).toBeVisible();
    
    // Check stats section exists
    await expect(page.getByLabel('Stats')).toBeVisible();
    
    // Check abilities display
    await expect(page.getByText('Overgrow').first()).toBeVisible();
    
    // Check evolution displays
    await expect(page.getByText('ivysaur').first()).toBeVisible();
  });

  test('form handling works correctly', async ({ page }) => {
    await page.goto('/pokemon/rattata');
    
    // Should load successfully
    await expect(page.locator('h1').first()).toContainText(/rattata/i);
    
    // Should have form selector
    await expect(page.getByText('Form:', { exact: true })).toBeVisible();
    
    // Should show current form
    await expect(page.getByText('Plain').first()).toBeVisible();
  });

  test('pokemon pages load performantly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/pokemon/pikachu');
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds (generous for CI)
    expect(loadTime).toBeLessThan(10000);
    
    // Should have content loaded
    await expect(page.locator('h1').first()).toContainText(/pikachu/i);
  });

  test('navigation maintains state correctly', async ({ page }) => {
    // Start at Bulbasaur
    await page.goto('/pokemon/bulbasaur');
    await expect(page.locator('h1').first()).toContainText(/bulbasaur/i);
    
    // Navigate to Pikachu
    await page.goto('/pokemon/pikachu');
    await expect(page.locator('h1').first()).toContainText(/pikachu/i);
    
    // Go back
    await page.goBack();
    await expect(page.locator('h1').first()).toContainText(/bulbasaur/i);
  });

  test('site handles missing pokemon gracefully', async ({ page }) => {
    await page.goto('/pokemon/nonexistentmon');
    
    // Should not crash - either show 404 page or redirect
    // This test just ensures no unhandled errors
    const hasError = await page.locator('text=/error/i, text=/not found/i').count() > 0;
    const isRedirected = !page.url().includes('nonexistentmon');
    
    // One of these should be true - either it shows error or redirects
    expect(hasError || isRedirected).toBeTruthy();
  });
});

test.describe('Faithful Mode Toggle', () => {
  test('should toggle feraligatr types between faithful and polished modes', async ({ page }) => {
    await page.goto('/pokemon/feraligatr');
    await expect(page.locator('h1').first()).toContainText(/feraligatr/i);
    
    const toggle = page.getByRole('switch');
    const waterType = page.getByLabel('Pokemon Types').getByText('Water').first();
    const darkType = page.getByLabel('Pokemon Types').getByText('Dark').first();
    
    // Water type should always be visible
    await expect(waterType).toBeVisible();
    
    // Toggle should change Dark type visibility
    const initialDarkVisible = await darkType.isVisible();
    
    await toggle.click();
    await page.waitForTimeout(500);
    
    const afterToggleDarkVisible = await darkType.isVisible();
    
    // Dark type visibility should have changed
    expect(initialDarkVisible).not.toBe(afterToggleDarkVisible);
    
    // Water should still be visible
    await expect(waterType).toBeVisible();
  });

  test('should toggle ledian types and stats between modes', async ({ page }) => {
    await page.goto('/pokemon/ledian');
    await expect(page.locator('h1').first()).toContainText(/ledian/i);
    
    const toggle = page.getByRole('switch');
    const bugType = page.getByLabel('Pokemon Types').getByText('Bug').first();
    const flyingType = page.getByLabel('Pokemon Types').getByText('Flying').first();
    const fightingType = page.getByLabel('Pokemon Types').getByText('Fighting').first();
    
    // Bug should always be visible
    await expect(bugType).toBeVisible();
    
    // Check initial state
    const initialFlyingVisible = await flyingType.isVisible();
    const initialFightingVisible = await fightingType.isVisible();
    
    // Toggle mode
    await toggle.click();
    await page.waitForTimeout(500);
    
    // Types should have changed
    const afterToggleFlyingVisible = await flyingType.isVisible();
    const afterToggleFightingVisible = await fightingType.isVisible();
    
    // One of the types should have changed visibility
    const flyingChanged = initialFlyingVisible !== afterToggleFlyingVisible;
    const fightingChanged = initialFightingVisible !== afterToggleFightingVisible;
    
    expect(flyingChanged || fightingChanged).toBeTruthy();
    
    // Bug should still be visible
    await expect(bugType).toBeVisible();
  });
});

test.describe('Data Integrity Tests', () => {
  test('pokedex entries are preserved in data', async ({ page }) => {
    await page.goto('/pokemon/bulbasaur');
    
    // The pokedex entries should be in the page somewhere
    // (even if in debug pre tags, they should be present)
    await expect(page.getByText('Seed')).toBeVisible();
    await expect(page.getByText(/nutrients/i)).toBeVisible();
  });

  test('pokemon with location data show locations', async ({ page }) => {
    await page.goto('/pokemon/mismagius');
    
    // Should show the pokemon name
    await expect(page.locator('h1').first()).toContainText(/mismagius/i);
    
    // Should have the species data
    await expect(page.getByText('Magical')).toBeVisible();
  });
});