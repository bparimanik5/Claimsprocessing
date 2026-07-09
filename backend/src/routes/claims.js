const express = require('express');
const { claims, policies, CLAIM_TYPES, CLAIM_STATUSES, nextId } = require('../data/seed');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Allowed forward transitions for the claim status workflow.
const TRANSITIONS = {
  Submitted: ['Under Review', 'Rejected'],
  'Under Review': ['Additional Info Requested', 'Approved', 'Rejected'],
  'Additional Info Requested': ['Under Review', 'Rejected'],
  Approved: ['Paid'],
  Rejected: [],
  Paid: [],
};

function serializeClaim(claim) {
  const policy = policies.find((p) => p.id === claim.policyId);
  return {
    ...claim,
    policyNumber: policy ? policy.policyNumber : null,
    policyHolderName: policy ? policy.holderName : null,
  };
}

// GET /api/claims?status=&claimType=&query=
router.get('/', requireAuth, (req, res) => {
  const { status, claimType, query } = req.query;
  let results = claims;

  if (status) results = results.filter((c) => c.status === status);
  if (claimType) results = results.filter((c) => c.claimType === claimType);
  if (query) {
    const q = String(query).toLowerCase();
    results = results.filter(
      (c) =>
        c.claimNumber.toLowerCase().includes(q) ||
        c.claimantName.toLowerCase().includes(q)
    );
  }

  res.json(results.map(serializeClaim));
});

// GET /api/claims/:id
router.get('/:id', requireAuth, (req, res) => {
  const claim = claims.find((c) => c.id === req.params.id || c.claimNumber === req.params.id);
  if (!claim) return res.status(404).json({ error: `Claim ${req.params.id} not found` });
  res.json(serializeClaim(claim));
});

// POST /api/claims  - submit a new claim (handler role)
router.post('/', requireAuth, requireRole('handler', 'admin'), (req, res) => {
  const { policyId, claimType, dateOfIncident, description, amountClaimed, claimantName } = req.body || {};

  const errors = [];
  if (!policyId) errors.push('policyId is required');
  if (!claimType || !CLAIM_TYPES.includes(claimType)) {
    errors.push(`claimType must be one of: ${CLAIM_TYPES.join(', ')}`);
  }
  if (!dateOfIncident) errors.push('dateOfIncident is required');
  if (!description || description.trim().length < 10) {
    errors.push('description is required and must be at least 10 characters');
  }
  if (!amountClaimed || Number(amountClaimed) <= 0) {
    errors.push('amountClaimed must be a positive number');
  }
  if (!claimantName) errors.push('claimantName is required');

  const policy = policies.find((p) => p.id === policyId);
  if (!policy) {
    errors.push(`policy ${policyId} not found`);
  } else if (policy.status !== 'Active') {
    errors.push(`policy ${policy.policyNumber} is not active (status: ${policy.status}); claims cannot be filed`);
  } else if (Number(amountClaimed) > policy.sumAssured) {
    errors.push(`amountClaimed exceeds policy sum assured of ${policy.sumAssured}`);
  }

  if (errors.length) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  const id = nextId('CLM');
  const claimNumber = `CLM-${new Date().getFullYear()}-${String(claims.length + 1).padStart(4, '0')}`;
  const today = new Date().toISOString().slice(0, 10);

  const claim = {
    id,
    claimNumber,
    policyId,
    claimType,
    claimantName,
    dateOfIncident,
    description,
    amountClaimed: Number(amountClaimed),
    amountApproved: null,
    status: 'Submitted',
    submittedDate: today,
    documents: [],
    history: [{ status: 'Submitted', date: today, by: req.user.name, comment: 'Claim submitted.' }],
  };

  claims.push(claim);
  res.status(201).json(serializeClaim(claim));
});

// PATCH /api/claims/:id/status - transition a claim's status (adjudicator/admin role)
router.patch('/:id/status', requireAuth, requireRole('adjudicator', 'admin'), (req, res) => {
  const claim = claims.find((c) => c.id === req.params.id);
  if (!claim) return res.status(404).json({ error: `Claim ${req.params.id} not found` });

  const { status, comment, approvedAmount } = req.body || {};
  if (!status || !CLAIM_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${CLAIM_STATUSES.join(', ')}` });
  }

  const allowed = TRANSITIONS[claim.status] || [];
  if (!allowed.includes(status)) {
    return res.status(409).json({
      error: `Cannot transition claim from '${claim.status}' to '${status}'. Allowed: ${allowed.join(', ') || 'none'}`,
    });
  }

  if (status === 'Approved') {
    const amt = Number(approvedAmount);
    if (!amt || amt <= 0) {
      return res.status(400).json({ error: 'approvedAmount is required and must be positive when approving a claim' });
    }
    if (amt > claim.amountClaimed) {
      return res.status(400).json({ error: 'approvedAmount cannot exceed amountClaimed' });
    }
    claim.amountApproved = amt;
  }

  claim.status = status;
  claim.history.push({
    status,
    date: new Date().toISOString().slice(0, 10),
    by: req.user.name,
    comment: comment || '',
  });

  res.json(serializeClaim(claim));
});

// POST /api/claims/:id/documents - attach a document (metadata only)
router.post('/:id/documents', requireAuth, (req, res) => {
  const claim = claims.find((c) => c.id === req.params.id);
  if (!claim) return res.status(404).json({ error: `Claim ${req.params.id} not found` });

  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required' });

  const doc = { id: nextId('DOC'), name, uploadedDate: new Date().toISOString().slice(0, 10) };
  claim.documents.push(doc);
  res.status(201).json(serializeClaim(claim));
});

module.exports = router;
