const { test, expect } = require('@playwright/test');
const { loginAs } = require('./helpers');

function parseInr(text) {
  // "₹1,234,567" or "₹18,00,000" -> 1234567
  return Number(text.replace(/[^\d]/g, ''));
}

test.describe('Dashboard', () => {
  test('[TC-019] Dashboard totals reconcile with the sum of individual claim amounts', async ({ page, request }) => {
    await loginAs(page, 'admin');

    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123' },
    });
    const { token } = await loginRes.json();
    const claimsRes = await request.get('/api/claims', { headers: { Authorization: `Bearer ${token}` } });
    const claims = await claimsRes.json();

    const expectedClaimed = claims.reduce((sum, c) => sum + (c.amountClaimed || 0), 0);
    const expectedApproved = claims.reduce((sum, c) => sum + (c.amountApproved || 0), 0);

    await page.goto('/dashboard');
    const totalClaimedText = await page.getByTestId('stat-total-claimed').textContent();
    const totalApprovedText = await page.getByTestId('stat-total-approved').textContent();

    expect(parseInr(totalClaimedText)).toBe(expectedClaimed);
    expect(parseInr(totalApprovedText)).toBe(expectedApproved);

    const totalClaimsText = await page.getByTestId('stat-total-claims').textContent();
    expect(Number(totalClaimsText)).toBe(claims.length);
  });
});
