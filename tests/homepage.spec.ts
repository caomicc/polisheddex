import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads with the correct title
    await expect(page).toHaveTitle(/PolishedDex/);

    // Check for main heading or logo
    await expect(page.locator('h1, [data-testid="logo"], .logo')).toBeVisible();
  });

  test('should have working navigation menu', async ({ page }) => {
    await page.goto('/');

    // Check for navigation links (adapt based on your actual navigation)
    const pokemonNavLink = page.getByRole('link', { name: /pokemon|pokédex/i });
    const locationNavLink = page.getByRole('link', { name: /location/i });
    const itemNavLink = page.getByRole('link', { name: /item/i });

    // Test Pokemon navigation if it exists
    if (await pokemonNavLink.count() > 0) {
      await pokemonNavLink.click();
      await expect(page).toHaveURL(/.*\/(pokemon|pokedex)/);
      await page.goBack();
    }

    // Test Location navigation if it exists
    if (await locationNavLink.count() > 0) {
      await locationNavLink.click();
      await expect(page).toHaveURL(/.*\/location/);
      await page.goBack();
    }

    // Test Items navigation if it exists
    if (await itemNavLink.count() > 0) {
      await itemNavLink.click();
      await expect(page).toHaveURL(/.*\/item/);
    }
  });

  test('should display pokemon grid or list', async ({ page }) => {
    await page.goto('/');

    // Look for pokemon cards, links, or grid items
    const pokemonElements = page.locator('[href*="/pokemon/"], .pokemon-card, .pokemon-item');
    
    // Check if pokemon are displayed on homepage
    if (await pokemonElements.count() > 0) {
      await expect(pokemonElements.first()).toBeVisible();
      
      // Test clicking on a pokemon
      await pokemonElements.first().click();
      await expect(page).toHaveURL(/.*\/pokemon\/.+/);
    }
  });

  test('should have working search functionality', async ({ page }) => {
    await page.goto('/');

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"], [data-testid*="search"]');
    
    if (await searchInput.count() > 0) {
      // Test search functionality
      await searchInput.fill('pikachu');
      
      // Look for search results or filtered content
      await page.waitForTimeout(1000); // Wait for search results
      
      // Check if Pikachu appears in results
      await expect(page.getByText('Pikachu')).toBeVisible();
    }
  });
});