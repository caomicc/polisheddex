import { test, expect } from '@playwright/test';

test.describe('Pokemon Data Integrity', () => {
  test('should display complete pokemon data for Bulbasaur', async ({ page }) => {
    await page.goto('/pokemon/bulbasaur');

    // Verify pokemon name (use first h1 or be more specific)
    await expect(page.locator('h1').first()).toContainText('Bulbasaur');

    // Verify pokedex entries are displayed
    await expect(page.getByText('Seed')).toBeVisible(); // Species
    await expect(page.getByText(/nutrients that are stored in the seeds/)).toBeVisible(); // Description

    // Verify stats are displayed
    await expect(page.getByText(/45|49|65/)).toBeVisible(); // Should show base stats

    // Verify types are displayed
    await expect(page.getByText('Grass')).toBeVisible();
    await expect(page.getByText('Poison')).toBeVisible();

    // Verify abilities are displayed
    await expect(page.getByText(/Overgrow|Chlorophyll|Effect Spore/)).toBeVisible();

    // Verify moves are displayed
    await expect(page.getByText(/Tackle|Vine Whip|Razor Leaf/)).toBeVisible();

    // Verify evolution information
    await expect(page.getByText(/Ivysaur|Evolution/)).toBeVisible();
  });

  test('should display form-specific data for pokemon with multiple forms', async ({ page }) => {
    await page.goto('/pokemon/rattata');

    await expect(page.locator('h1').first()).toContainText('Rattata');

    // Check for form selection or form-specific data
    // Regular Rattata should be Normal type
    await expect(page.getByText('Normal')).toBeVisible();

    // If Alolan form is available, it should show Dark/Normal types
    const alolanFormButton = page.getByText(/Alolan/);
    if (await alolanFormButton.count() > 0) {
      await alolanFormButton.click();
      await expect(page.getByText('Dark')).toBeVisible();
    }
  });

  test('should display TM/HM move data', async ({ page }) => {
    await page.goto('/pokemon/pikachu');

    await expect(page.locator('h1').first()).toContainText('Pikachu');

    // Look for TM/HM moves section
    const tmSection = page.getByText(/TM|Technical Machine/);
    if (await tmSection.count() > 0) {
      await expect(tmSection).toBeVisible();
      
      // Pikachu should learn some TMs
      await expect(page.getByText(/TM\d+/)).toBeVisible();
    }
  });

  test('should display egg moves when available', async ({ page }) => {
    await page.goto('/pokemon/bulbasaur');

    await expect(page.locator('h1').first()).toContainText('Bulbasaur');

    // Look for egg moves section
    const eggMovesSection = page.getByText(/Egg Move|Breeding/);
    if (await eggMovesSection.count() > 0) {
      await expect(eggMovesSection).toBeVisible();
      
      // Bulbasaur should have some egg moves like Charm, Petal Dance
      await expect(page.getByText(/Charm|Petal Dance/)).toBeVisible();
    }
  });

  test('should handle pokemon with missing or incomplete data gracefully', async ({ page }) => {
    // Test with a pokemon that might have limited data
    await page.goto('/pokemon/egg'); // If egg pokemon exists

    // Should not crash and should show some basic info
    await expect(page.locator('h1, .pokemon-name')).toBeVisible();
    
    // Should not show error messages in the UI
    await expect(page.getByText(/Error|undefined|null/)).not.toBeVisible();
  });

  test('should display national and johto dex numbers', async ({ page }) => {
    await page.goto('/pokemon/bulbasaur');

    await expect(page.locator('h1').first()).toContainText('Bulbasaur');

    // Check for dex numbers - Bulbasaur should be #001 national, #264 johto
    await expect(page.getByText(/001|#1/)).toBeVisible(); // National dex
    await expect(page.getByText(/264/)).toBeVisible(); // Johto dex
  });

  test('should show location data when pokemon has encounters', async ({ page }) => {
    // Test with Mismagius which has location data
    await page.goto('/pokemon/mismagius');

    await expect(page.locator('h1').first()).toContainText('Mismagius');

    // Should show location information
    await expect(page.getByText(/soul_house|Location/)).toBeVisible();
  });
});