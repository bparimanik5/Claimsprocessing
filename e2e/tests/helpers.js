const CREDENTIALS = {
  handler: { username: 'handler', password: 'handler123' },
  adjudicator: { username: 'adjudicator', password: 'adjudicator123' },
  admin: { username: 'admin', password: 'admin123' },
};

/**
 * Logs in as the given role via the UI login form and waits for the dashboard to load.
 * @param {import('@playwright/test').Page} page
 * @param {'handler' | 'adjudicator' | 'admin'} role
 */
async function loginAs(page, role) {
  const { username, password } = CREDENTIALS[role];
  await page.goto('/login');
  await page.getByTestId('username-input').fill(username);
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('login-button').click();
  await page.waitForURL('**/dashboard');
}

/**
 * Logs in as a handler and submits a new claim via the UI, returning its detail-page path.
 * Keeps adjudication tests independent of seeded data / other tests' side effects.
 * @param {import('@playwright/test').Page} page
 * @param {{ policyLabelPattern: RegExp, claimantName: string, claimType: string, dateOfIncident: string, amount: string, description: string }} opts
 * @returns {Promise<string>} the claim detail path, e.g. "/claims/CLM-1234"
 */
async function createClaimAsHandler(page, opts) {
  await loginAs(page, 'handler');
  await page.goto('/claims/new');
  await page.getByTestId('policy-select').selectOption({ label: opts.policyLabelPattern });
  await page.getByTestId('claimant-name-input').fill(opts.claimantName);
  await page.getByTestId('claim-type-select').selectOption(opts.claimType);
  await page.getByTestId('date-of-incident-input').fill(opts.dateOfIncident);
  await page.getByTestId('amount-claimed-input').fill(opts.amount);
  await page.getByTestId('description-input').fill(opts.description);
  await page.getByTestId('submit-claim-button').click();
  await page.getByTestId('view-new-claim-button').click();
  await page.waitForURL('**/claims/*');
  return new URL(page.url()).pathname;
}

/** Logs the current user out via the navbar. @param {import('@playwright/test').Page} page */
async function logout(page) {
  await page.getByTestId('logout-button').click();
  await page.waitForURL('**/login');
}

module.exports = { loginAs, logout, createClaimAsHandler, CREDENTIALS };
