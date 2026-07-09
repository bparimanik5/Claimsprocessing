const { test, expect } = require('@playwright/test');
const { loginAs } = require('./helpers');

test.describe('Access Control', () => {
  test('[TC-017] Handler cannot access the Approval Queue or adjudication controls', async ({ page }) => {
    await loginAs(page, 'handler');

    await expect(page.getByTestId('nav-approvals')).toHaveCount(0);

    await page.goto('/approvals');
    await expect(page.getByText(/do not have permission/i)).toBeVisible();

    // Even on a claim detail page, the adjudication panel must not render for a handler.
    await page.goto('/claims');
    const firstView = page.getByTestId(/^view-claim-/).first();
    if (await firstView.count()) {
      await firstView.click();
      await expect(page.getByTestId('adjudication-panel')).toHaveCount(0);
    }
  });

  test("[TC-018] Adjudicator cannot access the 'File a Claim' page", async ({ page }) => {
    await loginAs(page, 'adjudicator');

    await expect(page.getByTestId('nav-new-claim')).toHaveCount(0);

    await page.goto('/claims/new');
    await expect(page.getByText(/do not have permission/i)).toBeVisible();
    await expect(page.getByTestId('new-claim-form')).toHaveCount(0);
  });

  test('[TC-022] Unauthenticated access to a protected route is blocked', async ({ page, request }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login');
    await expect(page.getByTestId('login-form')).toBeVisible();

    const res = await request.get('/api/claims');
    expect(res.status()).toBe(401);
  });
});
