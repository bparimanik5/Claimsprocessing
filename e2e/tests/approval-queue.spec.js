const { test, expect } = require('@playwright/test');
const { loginAs } = require('./helpers');

const EXCLUDED_STATUSES = ['status-badge-approved', 'status-badge-rejected', 'status-badge-paid'];

test.describe('Approval Queue', () => {
  test('[TC-021] Approval Queue lists only claims pending adjudication', async ({ page }) => {
    await loginAs(page, 'adjudicator');
    await page.goto('/approvals');
    await expect(page.getByTestId('approvals-page')).toBeVisible();

    const rows = page.getByTestId('approvals-table').locator('tbody tr');
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      for (const excluded of EXCLUDED_STATUSES) {
        await expect(rows.nth(i).getByTestId(excluded)).toHaveCount(0);
      }
    }
  });
});
