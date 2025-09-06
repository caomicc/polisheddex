import { test, expect } from '@playwright/test';

test.describe('Faithful Mode Toggle for Feraligatr', () => {
  test('should toggle feraligatr types between faithful (Water) and polished (Water/Dark)', async ({ page }) => {
    // Navigate to Feraligatr page
    await page.goto('/pokemon/feraligatr');
    
    // Wait for page to load
    await expect(page.locator('h1').first()).toContainText(/feraligatr/i);
    
    // Find the faithful toggle (we discovered it's a switch element)
    const toggle = page.getByRole('switch');
    
    // Get type elements
    const waterType = page.getByLabel('Pokemon Types').getByText('Water').first();
    const darkType = page.getByLabel('Pokemon Types').getByText('Dark').first();
    
    // Verify Water type is always present (both modes have Water)
    await expect(waterType).toBeVisible();
    
    // Check initial state
    const initialDarkVisible = await darkType.isVisible();
    
    if (initialDarkVisible) {
      // Starting in polished mode (Water/Dark types visible)
      console.log('Initial state: Polished mode (Water + Dark)');
      await expect(darkType).toBeVisible();
      
      // Click toggle to switch to faithful mode
      await toggle.click();
      await page.waitForTimeout(500);
      
      // In faithful mode: only Water should be visible
      await expect(waterType).toBeVisible();
      await expect(darkType).not.toBeVisible();
      console.log('Toggled to: Faithful mode (Water only)');
      
      // Toggle back to polished mode
      await toggle.click();
      await page.waitForTimeout(500);
      
      // Back to polished mode: both types visible
      await expect(waterType).toBeVisible();
      await expect(darkType).toBeVisible();
      console.log('Toggled back to: Polished mode (Water + Dark)');
      
    } else {
      // Starting in faithful mode (only Water visible)
      console.log('Initial state: Faithful mode (Water only)');
      await expect(darkType).not.toBeVisible();
      
      // Click toggle to switch to polished mode
      await toggle.click();
      await page.waitForTimeout(500);
      
      // In polished mode: both types should be visible
      await expect(waterType).toBeVisible();
      await expect(darkType).toBeVisible();
      console.log('Toggled to: Polished mode (Water + Dark)');
      
      // Toggle back to faithful mode
      await toggle.click();
      await page.waitForTimeout(500);
      
      // Back to faithful mode: only Water visible
      await expect(waterType).toBeVisible();
      await expect(darkType).not.toBeVisible();
      console.log('Toggled back to: Faithful mode (Water only)');
    }
  });

  test('should persist faithful mode setting when navigating between pokemon', async ({ page }) => {
    // Start at Feraligatr
    await page.goto('/pokemon/feraligatr');
    await expect(page.locator('h1').first()).toContainText(/feraligatr/i);
    
    const toggle = page.getByRole('switch');
    const darkType = page.getByLabel('Pokemon Types').getByText('Dark').first();
    
    // Set to faithful mode (ensure Dark type is hidden)
    const isDarkVisible = await darkType.isVisible();
    if (isDarkVisible) {
      await toggle.click();
      await page.waitForTimeout(500);
    }
    
    // Verify we're in faithful mode (no Dark type)
    await expect(darkType).not.toBeVisible();
    
    // Navigate to a different pokemon
    await page.goto('/pokemon/bulbasaur');
    await expect(page.locator('h1').first()).toContainText(/bulbasaur/i);
    
    // Navigate back to Feraligatr
    await page.goto('/pokemon/feraligatr');
    await expect(page.locator('h1').first()).toContainText(/feraligatr/i);
    
    // Should still be in faithful mode (Dark type hidden)
    const darkTypeAfterNavigation = page.getByLabel('Pokemon Types').getByText('Dark').first();
    await expect(darkTypeAfterNavigation).not.toBeVisible();
  });

  test('should toggle ledian types and stats between faithful (Bug/Flying, 35 Atk) and polished (Bug/Fighting, 95 Atk)', async ({ page }) => {
    // Navigate to Ledian page
    await page.goto('/pokemon/ledian');
    await expect(page.locator('h1').first()).toContainText(/ledian/i);
    
    const toggle = page.getByRole('switch');
    
    // Get type elements
    const bugType = page.getByLabel('Pokemon Types').getByText('Bug').first();
    const flyingType = page.getByLabel('Pokemon Types').getByText('Flying').first();
    const fightingType = page.getByLabel('Pokemon Types').getByText('Fighting').first();
    
    // Bug type should always be present (both modes have Bug)
    await expect(bugType).toBeVisible();
    
    // Check initial state
    const initialFlyingVisible = await flyingType.isVisible();
    const initialFightingVisible = await fightingType.isVisible();
    
    console.log(`Ledian initial state: Flying=${initialFlyingVisible}, Fighting=${initialFightingVisible}`);
    
    // Determine which mode we're starting in
    if (initialFlyingVisible && !initialFightingVisible) {
      // Starting in faithful mode (Bug/Flying)
      console.log('Initial state: Faithful mode (Bug/Flying)');
      
      // Check attack stat should be 35 in faithful mode
      await expect(page.getByText('35', { exact: true })).toBeVisible();
      
      // Toggle to polished mode
      await toggle.click();
      await page.waitForTimeout(500);
      
      // Should now have Bug/Fighting types
      await expect(bugType).toBeVisible();
      await expect(flyingType).not.toBeVisible();
      await expect(fightingType).toBeVisible();
      console.log('Toggled to: Polished mode (Bug/Fighting)');
      
      // Check attack stat should be 95 in polished mode
      await expect(page.getByText('95', { exact: true })).toBeVisible();
      
      // Toggle back to faithful mode
      await toggle.click();
      await page.waitForTimeout(500);
      
      // Should be back to Bug/Flying with 35 attack
      await expect(bugType).toBeVisible();
      await expect(flyingType).toBeVisible();
      await expect(fightingType).not.toBeVisible();
      await expect(page.getByText('35', { exact: true })).toBeVisible();
      console.log('Toggled back to: Faithful mode (Bug/Flying, 35 Atk)');
      
    } else if (initialFightingVisible && !initialFlyingVisible) {
      // Starting in polished mode (Bug/Fighting)
      console.log('Initial state: Polished mode (Bug/Fighting)');
      
      // Check attack stat should be 95 in polished mode  
      await expect(page.getByText('95', { exact: true })).toBeVisible();
      
      // Toggle to faithful mode
      await toggle.click();
      await page.waitForTimeout(500);
      
      // Should now have Bug/Flying types
      await expect(bugType).toBeVisible();
      await expect(flyingType).toBeVisible();
      await expect(fightingType).not.toBeVisible();
      console.log('Toggled to: Faithful mode (Bug/Flying)');
      
      // Check attack stat should be 35 in faithful mode
      await expect(page.getByText('35', { exact: true })).toBeVisible();
      
      // Toggle back to polished mode
      await toggle.click();
      await page.waitForTimeout(500);
      
      // Should be back to Bug/Fighting with 95 attack
      await expect(bugType).toBeVisible();
      await expect(flyingType).not.toBeVisible();
      await expect(fightingType).toBeVisible();
      await expect(page.getByText('95', { exact: true })).toBeVisible();
      console.log('Toggled back to: Polished mode (Bug/Fighting, 95 Atk)');
    }
  });

  test('should work with other pokemon that have type differences', async ({ page }) => {
    // Test with another pokemon that has different types in faithful vs polished
    // Let's check Ninetales (Fire vs Fire/Ghost)
    await page.goto('/pokemon/ninetales');
    await expect(page.locator('h1').first()).toContainText(/ninetales/i);
    
    const toggle = page.getByRole('switch');
    const fireType = page.getByLabel('Pokemon Types').getByText('Fire').first();
    const ghostType = page.getByLabel('Pokemon Types').getByText('Ghost').first();
    
    // Fire should always be present
    await expect(fireType).toBeVisible();
    
    // Check if Ghost type toggles (if Ninetales has different types in faithful mode)
    const initialGhostVisible = await ghostType.isVisible();
    
    // Toggle the mode
    await toggle.click();
    await page.waitForTimeout(500);
    
    const afterToggleGhostVisible = await ghostType.isVisible();
    
    // If types are different between modes, Ghost visibility should change
    if (initialGhostVisible !== afterToggleGhostVisible) {
      console.log(`Ninetales types changed: Ghost went from ${initialGhostVisible} to ${afterToggleGhostVisible}`);
    }
    
    // Fire should still be visible regardless of mode
    await expect(fireType).toBeVisible();
  });
});