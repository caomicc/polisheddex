import { test, expect } from '@playwright/test';

test.describe('Basic Site Functionality', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/PolishedDex/);
  });

  test('should navigate to pokemon pages and display basic info', async ({ page }) => {
    // Test Bulbasaur
    await page.goto('/pokemon/bulbasaur');
    await expect(page).toHaveURL(/.*\/pokemon\/bulbasaur/);
    await expect(page.locator('h1').first()).toContainText(/bulbasaur/i);
    
    // Test Pikachu 
    await page.goto('/pokemon/pikachu');
    await expect(page).toHaveURL(/.*\/pokemon\/pikachu/);
    await expect(page.locator('h1').first()).toContainText(/pikachu/i);

    // Test Charizard
    await page.goto('/pokemon/charizard');
    await expect(page).toHaveURL(/.*\/pokemon\/charizard/);
    await expect(page.locator('h1').first()).toContainText(/charizard/i);
  });

  test('should display pokemon types', async ({ page }) => {
    await page.goto('/pokemon/bulbasaur');
    
    // Check for type badges/elements (using more specific selector)
    await expect(page.getByLabel('Pokemon Types').getByText('Grass')).toBeVisible();
    await expect(page.getByLabel('Pokemon Types').getByText('Poison')).toBeVisible();
  });

  test('should display pokemon stats section', async ({ page }) => {
    await page.goto('/pokemon/bulbasaur');
    
    // Check for stats section
    await expect(page.getByLabel('Stats')).toBeVisible();
  });

  test('should handle pokemon with forms', async ({ page }) => {
    await page.goto('/pokemon/rattata');
    
    // Should load successfully
    await expect(page.locator('h1').first()).toContainText(/rattata/i);
    
    // Should have form selector
    await expect(page.getByText('Form:', { exact: true })).toBeVisible();
  });

  test('should display pokemon abilities', async ({ page }) => {
    await page.goto('/pokemon/bulbasaur');
    
    // Check for abilities section
    await expect(page.getByText('Overgrow')).toBeVisible();
  });

  test('should show evolution information when available', async ({ page }) => {
    await page.goto('/pokemon/bulbasaur');
    
    // Should show evolution (Ivysaur)
    await expect(page.getByText('ivysaur')).toBeVisible();
  });
});

test.describe('Site Performance', () => {
  test('pokemon pages should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/pokemon/pikachu');
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    // Should have content loaded
    await expect(page.locator('h1').first()).toContainText(/pikachu/i);
  });
});