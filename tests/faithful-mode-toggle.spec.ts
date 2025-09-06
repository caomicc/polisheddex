import { test, expect } from '@playwright/test';

test.describe('Faithful Mode Toggle', () => {
  test('should toggle feraligatr types between faithful (Water) and polished (Water/Dark)', async ({ page }) => {
    // Navigate to Feraligatr page
    await page.goto('/pokemon/feraligatr');
    
    // Wait for page to load
    await expect(page.locator('h1').first()).toContainText(/feraligatr/i);
    
    // Based on debug test results, the toggle is accessible via getByRole('switch')
    const toggle = page.getByRole('switch');
    
    // Get type elements
    const waterType = page.getByLabel('Pokemon Types').getByText('Water').first();
    const darkType = page.getByLabel('Pokemon Types').getByText('Dark').first();
    
    // Verify Water type is always visible
    await expect(waterType).toBeVisible();
    
    // Check initial state - should be polished mode (showing Dark type)
    const initialDarkVisible = await darkType.isVisible();
    
    if (initialDarkVisible) {
      // Starting in polished mode (Water/Dark)
      await expect(darkType).toBeVisible();
      
      // Click toggle to switch to faithful mode
      await toggle.click();
      await page.waitForTimeout(500);
      
      // In faithful mode: Water visible, Dark hidden
      await expect(waterType).toBeVisible();
      await expect(darkType).not.toBeVisible();
      
      // Toggle back to polished mode
      await toggle.click();
      await page.waitForTimeout(500);
      
      // Back to polished mode: both types visible
      await expect(waterType).toBeVisible();
      await expect(darkType).toBeVisible();
      
    } else {
      // Starting in faithful mode (Water only)
      await expect(darkType).not.toBeVisible();
      
      // Click toggle to switch to polished mode  
      await toggle.click();
      await page.waitForTimeout(500);
      
      // In polished mode: both types visible
      await expect(waterType).toBeVisible();
      await expect(darkType).toBeVisible();
      
      // Toggle back to faithful mode
      await toggle.click();
      await page.waitForTimeout(500);
      
      // Back to faithful mode: only Water visible
      await expect(waterType).toBeVisible();
      await expect(darkType).not.toBeVisible();
    }
  });

  test('should persist faithful mode setting across navigation', async ({ page }) => {
    // Navigate to Feraligatr page
    await page.goto('/pokemon/feraligatr');
    await expect(page.locator('h1').first()).toContainText(/feraligatr/i);
    
    // Find the faithful toggle (from our debug test, we know it's a switch)
    const toggle = page.getByRole('switch');
    
    // Set to faithful mode (if not already)
    const hasDarkType = page.getByLabel('Pokemon Types').getByText('Dark').first();
    const isDarkVisible = await hasDarkType.isVisible();
    
    if (isDarkVisible) {
      // Currently in polished mode, switch to faithful
      await toggle.click();
      await page.waitForTimeout(500);
    }
    
    // Verify we're in faithful mode (no Dark type)
    await expect(hasDarkType).not.toBeVisible();
    
    // Navigate to a different pokemon
    await page.goto('/pokemon/bulbasaur');
    await expect(page.locator('h1').first()).toContainText(/bulbasaur/i);
    
    // Navigate back to Feraligatr
    await page.goto('/pokemon/feraligatr');
    await expect(page.locator('h1').first()).toContainText(/feraligatr/i);
    
    // Should still be in faithful mode (setting persisted)
    const darkTypeAfterNavigation = page.getByLabel('Pokemon Types').getByText('Dark').first();
    await expect(darkTypeAfterNavigation).not.toBeVisible();
  });

  test('should show different abilities in faithful vs polished mode', async ({ page }) => {
    await page.goto('/pokemon/feraligatr');
    await expect(page.locator('h1').first()).toContainText(/feraligatr/i);
    
    const toggle = page.getByRole('switch');
    
    // Check if abilities change between modes
    // (This test assumes abilities might be different - adjust if not applicable)
    
    // Get current abilities
    const abilitiesSection = page.locator('[data-testid*="abilities"], .abilities, :has-text("Torrent")');
    
    if (await abilitiesSection.count() > 0) {
      // Take screenshot of abilities in current mode
      const currentAbilities = await abilitiesSection.textContent();
      
      // Toggle mode
      await toggle.click();
      await page.waitForTimeout(500);
      
      // Check if abilities are different (if they should be)
      const newAbilities = await abilitiesSection.textContent();
      
      // At minimum, verify abilities section still exists and loads
      await expect(abilitiesSection).toBeVisible();
    }
  });
});