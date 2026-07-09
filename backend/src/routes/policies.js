const express = require('express');
const { policies } = require('../data/seed');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/policies?query=<policyNumber or holderName>
router.get('/', requireAuth, (req, res) => {
  const { query, productType, status } = req.query;
  let results = policies;

  if (query) {
    const q = String(query).toLowerCase();
    results = results.filter(
      (p) =>
        p.policyNumber.toLowerCase().includes(q) ||
        p.holderName.toLowerCase().includes(q)
    );
  }
  if (productType) {
    results = results.filter((p) => p.productType === productType);
  }
  if (status) {
    results = results.filter((p) => p.status === status);
  }

  res.json(results);
});

// GET /api/policies/:id
router.get('/:id', requireAuth, (req, res) => {
  const policy = policies.find((p) => p.id === req.params.id || p.policyNumber === req.params.id);
  if (!policy) {
    return res.status(404).json({ error: `Policy ${req.params.id} not found` });
  }
  res.json(policy);
});

module.exports = router;
