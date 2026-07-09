const { test, expect } = require('@playwright/test');
const { loginAs, logout, createClaimAsHandler } = require('./helpers');

/** Creates a fresh 'Submitted' claim as a handler, then logs in as the adjudicator on the same page. */
async function newSubmittedClaimAsAdjudicator(page, overrides = {}) {
  const path = await createClaimAsHandler(page, {
    policyLabelPattern: /PRT-100567/,
    claimantName: 'Vikram Singh',
    claimType: 'Critical Illness',
    dateOfIncident: '2026-05-15',
    amount: '2000000',
    description: 'Adjudication test claim created via Playwright automation.',
    ...overrides,
  });
  await logout(page);
  await loginAs(page, 'adjudicator');
  await page.goto(path);
  return path;
}

test.describe('Adjudication Workflow', () => {
  test('[TC-010] Adjudicator transitions a claim from Submitted to Under Review', async ({ page }) => {
    await newSubmittedClaimAsAdjudicator(page);

    await expect(page.getByTestId('status-badge-submitted')).toBeVisible();
    await page.getByTestId('next-status-select').selectOption('Under Review');
    await page.getByTestId('adjudication-comment-input').fill('Beginning review.');
    await page.getByTestId('submit-status-update').click();

    await expect(page.getByTestId('status-badge-under-review')).toBeVisible();
    await expect(page.getByTestId('claim-history').locator('li')).toHaveCount(2);
  });

  test('[TC-011] Adjudicator approves a claim under review with an approved amount', async ({ page }) => {
    await newSubmittedClaimAsAdjudicator(page);
    await page.getByTestId('next-status-select').selectOption('Under Review');
    await page.getByTestId('submit-status-update').click();
    await expect(page.getByTestId('status-badge-under-review')).toBeVisible();

    await page.getByTestId('next-status-select').selectOption('Approved');
    await page.getByTestId('approved-amount-input').fill('1800000');
    await page.getByTestId('adjudication-comment-input').fill('Approved after document review.');
    await page.getByTestId('submit-status-update').click();

    await expect(page.getByTestId('status-badge-approved')).toBeVisible();
    await expect(page.getByText('₹18,00,000')).toBeVisible();
  });

  test('[TC-012] Adjudicator marks an Approved claim as Paid', async ({ page }) => {
    await newSubmittedClaimAsAdjudicator(page);
    await page.getByTestId('next-status-select').selectOption('Under Review');
    await page.getByTestId('submit-status-update').click();
    await page.getByTestId('next-status-select').selectOption('Approved');
    await page.getByTestId('approved-amount-input').fill('1500000');
    await page.getByTestId('submit-status-update').click();
    await expect(page.getByTestId('status-badge-approved')).toBeVisible();

    await page.getByTestId('next-status-select').selectOption('Paid');
    await page.getByTestId('submit-status-update').click();

    await expect(page.getByTestId('status-badge-paid')).toBeVisible();
    await expect(page.getByTestId('adjudication-panel')).toHaveCount(0);
  });

  test('[TC-013] Direct transition from Submitted to Paid is not permitted', async ({ page, request }) => {
    const path = await newSubmittedClaimAsAdjudicator(page);
    const claimId = path.split('/').pop();

    // UI check: 'Paid' must not be an offered option from Submitted.
    const options = await page.getByTestId('next-status-select').locator('option').allTextContents();
    expect(options).not.toContain('Paid');

    // API check: a direct request attempting the invalid transition must be rejected.
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'adjudicator', password: 'adjudicator123' },
    });
    const { token } = await loginRes.json();

    const patchRes = await request.patch(`/api/claims/${claimId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'Paid' },
    });
    expect(patchRes.status()).toBe(409);
  });

  test('[TC-014] Approving a claim without specifying an approved amount is rejected', async ({ page }) => {
    await newSubmittedClaimAsAdjudicator(page);
    await page.getByTestId('next-status-select').selectOption('Under Review');
    await page.getByTestId('submit-status-update').click();

    await page.getByTestId('next-status-select').selectOption('Approved');
    // Deliberately leave approved-amount-input empty.
    const isRequired = await page.getByTestId('approved-amount-input').getAttribute('required');
    expect(isRequired).not.toBeNull();
  });

  test('[TC-015] Approved amount exceeding amount claimed is rejected', async ({ page, request }) => {
    const path = await newSubmittedClaimAsAdjudicator(page);
    const claimId = path.split('/').pop();
    await page.getByTestId('next-status-select').selectOption('Under Review');
    await page.getByTestId('submit-status-update').click();

    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'adjudicator', password: 'adjudicator123' },
    });
    const { token } = await loginRes.json();

    const patchRes = await request.patch(`/api/claims/${claimId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'Approved', approvedAmount: 2500000 }, // claim amountClaimed is 2,000,000
    });
    expect(patchRes.status()).toBe(400);
  });

  test("[TC-016] Every status change is recorded in the claim's audit history", async ({ page }) => {
    await newSubmittedClaimAsAdjudicator(page);
    await page.getByTestId('next-status-select').selectOption('Under Review');
    await page.getByTestId('adjudication-comment-input').fill('Reviewed supporting documents');
    await page.getByTestId('submit-status-update').click();

    const history = page.getByTestId('claim-history');
    await expect(history).toContainText('Reviewed supporting documents');
    await expect(history).toContainText('Rahul Mehta'); // adjudicator display name
    await expect(history.locator('li')).toHaveCount(2);
  });
});
