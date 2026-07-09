const { test, expect } = require('@playwright/test');
const { loginAs } = require('./helpers');

test.describe('Claims List', () => {
  test('[TC-020] Claims list filters correctly by status', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/claims');
    await expect(page.getByTestId('claims-list-page')).toBeVisible();

    await page.getByTestId('claims-status-filter').selectOption('Approved');
    await page.getByTestId('claims-filter-button').click();

    const rows = page.getByTestId('claims-table').locator('tbody tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i).getByTestId(/^status-badge-/)).toHaveAttribute(
        'data-testid',
        'status-badge-approved'
      );
    }
  });
});
