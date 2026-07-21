import { test, expect } from '@playwright/test';

test.describe('AeroBooth Photobooth E2E Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to local development server root
    await page.goto('/');
  });

  test('Welcome View loads correctly with elegant brand typography', async ({ page }) => {
    // Assert main brand heading
    const title = page.locator('h1');
    await expect(title).toContainText('AeroBooth');

    // Assert ENTER CTA exists
    const startBtn = page.locator('#btn-welcome-start');
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toContainText('ENTER PHOTO STUDIO');
  });

  test('Transitions seamlessly to Layout Selector step on click', async ({ page }) => {
    await page.click('#btn-welcome-start');

    // Should render Choose Your Layout Frame
    const selectorTitle = page.locator('h2');
    await expect(selectorTitle).toContainText('Choose Your Layout Frame');

    // Check that classic vertical strip template is selected by default
    const classicStripCard = page.locator('#layout-card-strip');
    await expect(classicStripCard).toHaveClass(/border-razel-neon/);

    // Confirm sticky action bar is displayed
    const proceedBtn = page.locator('#btn-layout-proceed');
    await expect(proceedBtn).toBeVisible();
    await expect(proceedBtn).toContainText('CONFIRM & START');
  });

  test('Responsive viewports adaptability check', async ({ page }) => {
    const startBtn = page.locator('#btn-welcome-start');
    await expect(startBtn).toBeVisible();

    // Resize viewport to iPhone 12 (390 x 844) standard mobile dimensions
    await page.setViewportSize({ width: 390, height: 844 });
    // Title and CTA should remain visible, margins should scale fluids
    await expect(titleElement(page)).toBeVisible();
    await expect(startBtn).toBeVisible();

    // Check padding limits and margins
    const welcomeContainer = page.locator('#welcome-view-container');
    await expect(welcomeContainer).toHaveCSS('padding-left', '16px'); // px-4 translates to 16px padding

    // Resize viewport to standard iPad Tablet (768 x 1024)
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(titleElement(page)).toBeVisible();

    // Resize back to typical high-definition Laptop viewport
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(titleElement(page)).toBeVisible();
  });

  test('Selecting another template adjusts sticky footer instructions and layout bounds', async ({ page }) => {
    await page.click('#btn-welcome-start');

    // Click Polaroid template card
    await page.click('#layout-card-polaroid');

    // Sticky action bar should update count to "Requires 1 separate poses"
    const selectionInfo = page.locator('p:has-text("Requires 1 separate poses")');
    await expect(selectionInfo).toBeVisible();

    const proceedBtn = page.locator('#btn-layout-proceed');
    await expect(proceedBtn).toBeVisible();
  });
  test('Visual Regression - Capture screenshots across devices', async ({ page }) => {
    // 1. Mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForTimeout(500); // let animations settle
    await page.screenshot({ path: 'qa/screenshots/mobile_welcome.png' });

    await page.click('#btn-welcome-start');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'qa/screenshots/mobile_layout_selector.png' });

    // 2. Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'qa/screenshots/tablet_welcome.png' });

    await page.click('#btn-welcome-start');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'qa/screenshots/tablet_layout_selector.png' });

    // 3. Laptop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'qa/screenshots/laptop_welcome.png' });

    await page.click('#btn-welcome-start');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'qa/screenshots/laptop_layout_selector.png' });

    await page.click('#btn-layout-proceed');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'qa/screenshots/laptop_camera_view.png' });
  });
});

// Helper locator
function titleElement(page: any) {
  return page.locator('h1');
}
