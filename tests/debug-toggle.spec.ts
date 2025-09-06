import { test, expect } from '@playwright/test';

test.describe('Debug Toggle Elements', () => {
  test('should find and identify the faithful toggle', async ({ page }) => {
    await page.goto('/pokemon/feraligatr');
    await expect(page.locator('h1').first()).toContainText(/feraligatr/i);
    
    // Let's find all possible toggle elements and log them
    console.log('=== Looking for toggle elements ===');
    
    // Check for switches/toggles
    const switches = page.getByRole('switch');
    const switchCount = await switches.count();
    console.log(`Found ${switchCount} switch elements`);
    
    // Check for buttons with faithful/polished text
    const faithfulButtons = page.getByRole('button', { name: /faithful/i });
    const polishedButtons = page.getByRole('button', { name: /polished/i });
    const faithfulCount = await faithfulButtons.count();
    const polishedCount = await polishedButtons.count();
    console.log(`Found ${faithfulCount} faithful buttons, ${polishedCount} polished buttons`);
    
    // Check for toggle-like classes
    const toggleClasses = page.locator('[class*="toggle"], [class*="switch"]');
    const toggleClassCount = await toggleClasses.count();
    console.log(`Found ${toggleClassCount} elements with toggle/switch classes`);
    
    // Check for data-testid attributes
    const testIds = page.locator('[data-testid*="faithful"], [data-testid*="toggle"], [data-testid*="switch"]');
    const testIdCount = await testIds.count();
    console.log(`Found ${testIdCount} elements with relevant test IDs`);
    
    // Log the top-right area specifically
    const topRight = page.locator('header, .header, nav, .nav, .top-right, .top-nav').first();
    if (await topRight.count() > 0) {
      const topRightToggles = topRight.locator('button, [role="switch"], input[type="checkbox"]');
      const topRightToggleCount = await topRightToggles.count();
      console.log(`Found ${topRightToggleCount} toggle-like elements in top area`);
    }
    
    // Try to find the most likely toggle
    const possibleToggles = [
      page.getByRole('switch'),
      page.getByRole('button', { name: /faithful|polished/i }),
      page.locator('[class*="toggle"]'),
      page.locator('input[type="checkbox"]'),
      page.locator('[data-testid*="faithful"]')
    ];
    
    for (const [index, locator] of possibleToggles.entries()) {
      const count = await locator.count();
      if (count > 0) {
        console.log(`Possible toggle ${index}: Found ${count} elements`);
        
        // Get the text content of the first one
        const firstElement = locator.first();
        const text = await firstElement.textContent();
        const isVisible = await firstElement.isVisible();
        console.log(`  - Text: "${text}", Visible: ${isVisible}`);
        
        if (isVisible) {
          // Try clicking it to see what happens
          console.log('  - Attempting to click...');
          try {
            await firstElement.click();
            await page.waitForTimeout(1000);
            console.log('  - Click successful');
            
            // Check if Feraligatr types changed
            const waterVisible = await page.getByLabel('Pokemon Types').getByText('Water').first().isVisible();
            const darkVisible = await page.getByLabel('Pokemon Types').getByText('Dark').first().isVisible();
            console.log(`  - After click: Water=${waterVisible}, Dark=${darkVisible}`);
            
            break; // Found working toggle
          } catch (error) {
            console.log(`  - Click failed: ${error.message}`);
          }
        }
      }
    }
  });
});