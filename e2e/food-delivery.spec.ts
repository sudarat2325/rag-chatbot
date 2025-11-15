import { test, expect } from '@playwright/test';

test.describe('Food Delivery System E2E', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');

    // Check if the page loads
    await expect(page).toHaveTitle(/Food Delivery|RAG Chatbot/);
  });

  test('should navigate to food delivery page', async ({ page }) => {
    await page.goto('/');

    // Click on Food Delivery link in navigation
    const foodDeliveryLink = page.getByRole('link', { name: /food/i });
    if (await foodDeliveryLink.isVisible()) {
      await foodDeliveryLink.click();

      // Wait for navigation
      await page.waitForURL('**/food-delivery**');

      // Check if restaurants are displayed
      await expect(page).toHaveURL(/food-delivery/);
    }
  });

  test('should display restaurant list', async ({ page }) => {
    await page.goto('/food-delivery');

    // Wait for restaurants to load
    await page.waitForTimeout(2000);

    // Check if there are restaurant cards or a message
    const hasRestaurants = await page.locator('[data-testid="restaurant-card"]').count();
    const hasMessage = await page.locator('text=/ไม่มีร้านอาหาร|No restaurants/i').count();

    // Either restaurants should be displayed or a "no restaurants" message
    expect(hasRestaurants > 0 || hasMessage > 0).toBeTruthy();
  });

  test('should navigate to chatbot page', async ({ page }) => {
    await page.goto('/');

    // Click on Chatbot link
    const chatbotLink = page.getByRole('link', { name: /chatbot|แชทบอท/i });
    if (await chatbotLink.isVisible()) {
      await chatbotLink.click();

      // Wait for navigation
      await page.waitForURL('**/chatbot**');

      // Check if chat interface is visible
      await expect(page).toHaveURL(/chatbot/);
    }
  });

  test('should display chat interface', async ({ page }) => {
    await page.goto('/chatbot');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check if chat input exists
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await expect(chatInput).toBeVisible();
  });
});

test.describe('Restaurant Dashboard E2E', () => {
  test('should load restaurant dashboard', async ({ page }) => {
    await page.goto('/restaurant-dashboard');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check if dashboard elements are present
    const hasOrders = await page.locator('text=/orders|ออเดอร์/i').count();
    const hasStats = await page.locator('text=/revenue|รายได้|statistics|สถิติ/i').count();

    expect(hasOrders > 0 || hasStats > 0).toBeTruthy();
  });
});

test.describe('Driver Dashboard E2E', () => {
  test('should load driver dashboard', async ({ page }) => {
    await page.goto('/driver/dashboard');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Check if driver interface is displayed
    const hasOrders = await page.locator('text=/available|พร้อมรับ|orders|ออเดอร์/i').count();

    expect(hasOrders > 0).toBeTruthy();
  });
});
