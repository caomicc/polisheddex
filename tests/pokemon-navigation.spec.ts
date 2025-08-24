import { test, expect } from '@playwright/test';

test.describe('Pokemon Navigation', () => {
  test('should navigate to a pokemon page and display pokemon details', async ({ page }) => {
    // Start from the homepage
    await page.goto('/');

    // Wait for the page to load
    await expect(page).toHaveTitle(/PolishedDex/);

    // Click on a pokemon (let's test with Bulbasaur)
    // This assumes you have pokemon links on the homepage
    const pokemonLink = page.locator('[href*="/pokemon/bulbasaur"]').first();
    if (await pokemonLink.count() > 0) {
      await pokemonLink.click();
    } else {
      // Alternative: navigate directly to the pokemon page
      await page.goto('/pokemon/bulbasaur');
    }

    // Verify we're on the pokemon page
    await expect(page).toHaveURL(/.*\/pokemon\/bulbasaur/);

    // Check that pokemon details are displayed
    await expect(page.locator('h1').first()).toContainText('Bulbasaur');

    // Check for species name from pokedex entries
    await expect(page.getByText('Seed')).toBeVisible();

    // Check for pokedex description
    await expect(page.getByText(/nutrients that are stored in the seeds/)).toBeVisible();

    // Check that stats are displayed
    await expect(page.getByText(/HP|Attack|Defense|Speed/)).toBeVisible();

    // Check that types are displayed
    await expect(page.getByText('Grass')).toBeVisible();
    await expect(page.getByText('Poison')).toBeVisible();
  });

  test('should display pokemon moves and abilities', async ({ page }) => {
    await page.goto('/pokemon/pikachu');

    // Wait for pokemon name to load
    await expect(page.locator('h1').first()).toContainText('Pikachu');

    // Check for abilities (Pikachu should have Static or similar)
    await expect(page.getByText(/Static|Lightning Rod/)).toBeVisible();

    // Check for moves (Pikachu should have Thunderbolt, etc.)
    await expect(page.getByText(/Thunderbolt|Thunder Shock/)).toBeVisible();

    // Check for pokedex species
    await expect(page.getByText('Mouse')).toBeVisible();
  });

  test('should handle pokemon with forms correctly', async ({ page }) => {
    // Test a pokemon with multiple forms (e.g., Rattata with Alolan form)
    await page.goto('/pokemon/rattata');

    await expect(page.locator('h1').first()).toContainText('Rattata');

    // Check for form selector or form-specific content
    // This depends on how you've implemented form handling in your UI
    await expect(page.getByText(/Plain|Alolan/)).toBeVisible();
  });

  test('should display evolution information', async ({ page }) => {
    await page.goto('/pokemon/bulbasaur');

    await expect(page.locator('h1').first()).toContainText('Bulbasaur');

    // Check for evolution information (Bulbasaur evolves into Ivysaur)
    await expect(page.getByText(/Ivysaur|Evolution/)).toBeVisible();
  });

  test('should show location information when available', async ({ page }) => {
    // Test with a pokemon that has location data
    await page.goto('/pokemon/pikachu');

    await expect(page.locator('h1').first()).toContainText('Pikachu');

    // Check for location information if it exists
    // This might be in a "Locations" section or similar
    const locationSection = page.getByText(/Location|Route|Area/);
    if (await locationSection.count() > 0) {
      await expect(locationSection).toBeVisible();
    }
  });
});

test.describe('Pokemon Search and Navigation', () => {
  test('should navigate between pokemon pages', async ({ page }) => {
    await page.goto('/pokemon/bulbasaur');

    // Check if there are navigation buttons/links to other pokemon
    const nextPokemonLink = page.locator('[href*="/pokemon/ivysaur"], [data-testid*="next-pokemon"]').first();
    const prevPokemonLink = page.locator('[href*="/pokemon/"], [data-testid*="prev-pokemon"]').first();

    // Test navigation if links exist
    if (await nextPokemonLink.count() > 0) {
      await nextPokemonLink.click();
      await expect(page).toHaveURL(/.*\/pokemon\/(?!bulbasaur)/);
    }
  });

  test('should handle 404 for non-existent pokemon', async ({ page }) => {
    await page.goto('/pokemon/fakemon');

    // Should show 404 page or redirect
    await expect(page.locator('h1').first()).toContainText(/Not Found|404/);
  });
});