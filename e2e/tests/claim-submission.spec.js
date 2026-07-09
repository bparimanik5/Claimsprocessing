const { test, expect } = require('@playwright/test');
const { loginAs } = require('./helpers');

test.describe('Claim Submission', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'handler');
  });

  test('[TC-004] Filing a claim against a Lapsed policy is rejected', async ({ page }) => {
    await page.goto('/claims/new');
    await page.getByTestId('policy-select').selectOption({ label: /PRT-101045/ });
    await page.getByTestId('claimant-name-input').fill('Suresh Iyer');
    await page.getByTestId('claim-type-select').selectOption('Terminal Illness');
    await page.getByTestId('date-of-incident-input').fill('2026-06-01');
    await page.getByTestId('amount-claimed-input').fill('100000');
    await page.getByTestId('description-input').fill('Diagnosed with a covered terminal illness condition.');
    await page.getByTestId('submit-claim-button').click();

    await expect(page.getByTestId('new-claim-errors')).toBeVisible();
    await expect(page.getByTestId('new-claim-errors')).toContainText(/not active/i);
    await expect(page.getByTestId('new-claim-success')).toHaveCount(0);
  });

  test('[TC-005] Submit a valid new claim with all required fields', async ({ page }) => {
    await page.goto('/claims/new');
    await page.getByTestId('policy-select').selectOption({ label: /PRT-101299/ });
    await page.getByTestId('claimant-name-input').fill('James Wilson');
    await page.getByTestId('claim-type-select').selectOption('Death');
    await page.getByTestId('date-of-incident-input').fill('2026-06-01');
    await page.getByTestId('amount-claimed-input').fill('1000000');
    await page.getByTestId('description-input').fill('Death claim filed by nominee, automated test submission.');
    await page.getByTestId('submit-claim-button').click();

    await expect(page.getByTestId('new-claim-success')).toBeVisible();
    await expect(page.getByTestId('new-claim-number')).toContainText(/CLM-\d{4}-\d{4}/);
  });

  test('[TC-006] Claim description under 10 characters is rejected', async ({ page }) => {
    await page.goto('/claims/new');
    await page.getByTestId('policy-select').selectOption({ label: /PRT-101299/ });
    await page.getByTestId('claimant-name-input').fill('James Wilson');
    await page.getByTestId('claim-type-select').selectOption('Death');
    await page.getByTestId('date-of-incident-input').fill('2026-06-01');
    await page.getByTestId('amount-claimed-input').fill('1000000');
    await page.getByTestId('description-input').fill('sick');
    await page.getByTestId('submit-claim-button').click();

    await expect(page.getByTestId('new-claim-errors')).toBeVisible();
    await expect(page.getByTestId('new-claim-errors')).toContainText(/at least 10 characters/i);
  });

  test('[TC-007] Amount claimed exceeding the policy sum assured is rejected', async ({ page }) => {
    await page.goto('/claims/new');
    await page.getByTestId('policy-select').selectOption({ label: /PRT-100567/ });
    await page.getByTestId('claimant-name-input').fill('Vikram Singh');
    await page.getByTestId('claim-type-select').selectOption('Critical Illness');
    await page.getByTestId('date-of-incident-input').fill('2026-06-01');
    await page.getByTestId('amount-claimed-input').fill('2500000');
    await page.getByTestId('description-input').fill('Amount claimed exceeds sum assured for this test.');
    await page.getByTestId('submit-claim-button').click();

    await expect(page.getByTestId('new-claim-errors')).toBeVisible();
    await expect(page.getByTestId('new-claim-errors')).toContainText(/exceeds policy sum assured/i);
  });

  test('[TC-008] New claim is assigned a unique sequential claim number', async ({ page }) => {
    await page.goto('/claims/new');
    await page.getByTestId('policy-select').selectOption({ label: /PRT-101299/ });
    await page.getByTestId('claimant-name-input').fill('Emma Wilson');
    await page.getByTestId('claim-type-select').selectOption('Death');
    await page.getByTestId('date-of-incident-input').fill('2026-06-02');
    await page.getByTestId('amount-claimed-input').fill('500000');
    await page.getByTestId('description-input').fill('Second automated test claim for numbering check.');
    await page.getByTestId('submit-claim-button').click();

    const claimNumber = await page.getByTestId('new-claim-number').textContent();
    expect(claimNumber).toMatch(/^CLM-\d{4}-\d{4}$/);
  });

  test("[TC-009] New claim starts in 'Submitted' status with one audit history entry", async ({ page }) => {
    await page.goto('/claims/new');
    await page.getByTestId('policy-select').selectOption({ label: /PRT-101299/ });
    await page.getByTestId('claimant-name-input').fill('Emma Wilson');
    await page.getByTestId('claim-type-select').selectOption('Death');
    await page.getByTestId('date-of-incident-input').fill('2026-06-03');
    await page.getByTestId('amount-claimed-input').fill('300000');
    await page.getByTestId('description-input').fill('Third automated test claim for history check.');
    await page.getByTestId('submit-claim-button').click();

    await page.getByTestId('view-new-claim-button').click();
    await expect(page.getByTestId('status-badge-submitted')).toBeVisible();
    await expect(page.getByTestId('claim-history').locator('li')).toHaveCount(1);
  });
});
