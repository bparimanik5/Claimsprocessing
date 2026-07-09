const express = require('express');
const { claims, CLAIM_STATUSES } = require('../data/seed');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/stats/dashboard - counts of claims by status, for the dashboard view
router.get('/dashboard', requireAuth, (req, res) => {
  const counts = {};
  CLAIM_STATUSES.forEach((s) => {
    counts[s] = 0;
  });
  claims.forEach((c) => {
    counts[c.status] = (counts[c.status] || 0) + 1;
  });

  const totalClaimed = claims.reduce((sum, c) => sum + (c.amountClaimed || 0), 0);
  const totalApproved = claims.reduce((sum, c) => sum + (c.amountApproved || 0), 0);

  res.json({
    totalClaims: claims.length,
    statusCounts: counts,
    totalClaimed,
    totalApproved,
  });
});

module.exports = router;
