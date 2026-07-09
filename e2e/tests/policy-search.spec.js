const { test, expect } = require('@playwright/test');
const { loginAs } = require('./helpers');

test.describe('Policy Search', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'handler');
    await page.getByTestId('nav-policies').click();
    await expect(page.getByTestId('policy-search-page')).toBeVisible();
  });

  test('[TC-001] Search policy by valid policy number returns exact match', async ({ page }) => {
    await page.getByTestId('policy-search-input').fill('PRT-100234');
    await page.getByTestId('policy-search-button').click();

    const results = page.getByTestId('policy-results');
    await expect(results.getByTestId('policy-card-PRT-100234')).toBeVisible();
    await expect(results.locator('.card')).toHaveCount(1);
    await expect(results).toContainText('Ananya Sharma');
    await expect(results).toContainText('Life Cover');
  });

  test('[TC-002] Search policy by partial holder name is case-insensitive', async ({ page }) => {
    await page.getByTestId('policy-search-input').fill('sharma');
    await page.getByTestId('policy-search-button').click();

    await expect(page.getByTestId('policy-card-PRT-100234')).toBeVisible();
  });

  test('[TC-003] Policy search with no matches shows an empty-state message', async ({ page }) => {
    await page.getByTestId('policy-search-input').fill('ZZZ-NOPE');
    await page.getByTestId('policy-search-button').click();

    await expect(page.getByTestId('no-policy-results')).toBeVisible();
    await expect(page.getByTestId('no-policy-results')).toContainText('No policies matched');
  });
});
