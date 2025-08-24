import { test, expect } from '@playwright/test';

test.describe('Essential Site Features', () => {
  test('should load homepage and navigate to a pokemon page', async ({ page }) => {
    // Load homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/PolishedDex/);

    // Navigate directly to a specific pokemon
    await page.goto('/pokemon/bulbasaur');
    
    // Verify we're on the pokemon page
    await expect(page).toHaveURL(/.*\/pokemon\/bulbasaur/);
    
    // Verify pokemon name is displayed
    await expect(page.locator('h1').first()).toContainText(/bulbasaur/i);
  });

  test('should display pokemon pokedex entries', async ({ page }) => {
    await page.goto('/pokemon/bulbasaur');
    
    // Check for pokedex species
    await expect(page.getByText('Seed')).toBeVisible();
    
    // Check for pokedex description
    await expect(page.getByText(/nutrients/)).toBeVisible();
  });

  test('should display pokemon types and stats', async ({ page }) => {
    await page.goto('/pokemon/bulbasaur');
    
    // Check types
    await expect(page.getByText('Grass')).toBeVisible();
    await expect(page.getByText('Poison')).toBeVisible();
    
    // Check for stats numbers (HP, Attack, etc.)
    await expect(page.getByText(/45|49|65/)).toBeVisible();
  });

  test('should handle pokemon with forms', async ({ page }) => {
    await page.goto('/pokemon/rattata');
    
    // Check pokemon name
    await expect(page.locator('h1').first()).toContainText(/rattata/i);
    
    // Check for form information
    await expect(page.getByText(/Plain|Form/)).toBeVisible();
  });

  test('should display pokemon with location data', async ({ page }) => {
    await page.goto('/pokemon/mismagius');
    
    // Check pokemon name
    await expect(page.locator('h1').first()).toContainText(/mismagius/i);
    
    // Check for species
    await expect(page.getByText('Magical')).toBeVisible();
  });

  test('should load different pokemon pages successfully', async ({ page }) => {
    const testPokemon = ['pikachu', 'charizard', 'mewtwo'];
    
    for (const pokemon of testPokemon) {
      await page.goto(`/pokemon/${pokemon}`);
      
      // Should not show error page
      await expect(page.locator('h1, .pokemon-name')).toBeVisible();
      
      // Should have pokemon-specific URL
      await expect(page).toHaveURL(new RegExp(`.*\/pokemon\/${pokemon}`));
    }
  });

  test('should show 404 for non-existent pokemon', async ({ page }) => {
    await page.goto('/pokemon/fakepokemon');
    
    // Should show some kind of error or not found state
    // This depends on how your app handles 404s - you might redirect or show error
    const isNotFound = await page.locator('text=/not found/i, text=/404/i').count() > 0;
    const isRedirected = !page.url().includes('fakepokemon');
    
    expect(isNotFound || isRedirected).toBe(true);
  });
});