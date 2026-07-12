// backend/src/batch/nightlyPolicyRenewalBatch.js
//
// POLICY-RENEWAL-NIGHTLY
// ------------------------------------------------------------------------
// Nightly batch job that walks every Active policy, calculates the
// upcoming renewal premium, and prepares a renewal notice addressed to the
// policyholder's nominee.
//
// The job is checkpointed: after each policy is processed (successfully or
// flagged), progress (last processed policy + count) is persisted so a
// restart can resume from the last checkpoint instead of reprocessing
// everything. In this sample app the checkpoint store is an in-memory
// object to match the rest of the data layer (backend/src/data/seed.js);
// in production this would be a DB row / durable file.
//
// Log lines are written in Splunk-friendly key=value format so they can be
// ingested and searched (index=claims_processing sourcetype=policy-renewal-svc).
//
// Fix history: 2026-07-12 — POLICY-RENEWAL-NIGHTLY-20260712 aborted the
// entire nightly run when it hit POL-1006, a policy carried over from the
// legacy migration with no nominee on file (see checkpoint 3 in
// buildRenewalNotice). One incomplete record should not block renewal
// notices for every other active policy, so a policy with missing/empty
// data required for a step is now flagged for manual data-quality
// follow-up and the batch continues — see processPolicy().

const { policies } = require('../data/seed');

const RENEWAL_RATE = 1.05; // 5% renewal uplift, per actuarial table v4

function log(level, event, fields = {}) {
  const ts = new Date().toISOString();
  const kv = Object.entries(fields)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(' ');
  console.log(`${ts} level=${level} job=POLICY-RENEWAL-NIGHTLY event=${event} ${kv}`.trim());
}

const checkpoint = { lastProcessedPolicyId: null, processedCount: 0 };

function buildRenewalNotice(policy) {
  // Checkpoint 3: renewal notice prep — derives the nominee's first name for
  // the notice greeting line ("Dear <first name>, your policy is due for
  // renewal on ..."). Not every Active policy has a nominee on file (e.g.
  // records carried over from the legacy migration without nominee
  // capture — see DQ-4471), so that must be validated before use instead of
  // assumed.
  if (!policy.nominee || !policy.nominee.trim()) {
    throw new Error(`policy ${policy.policyNumber} has no nominee on file — cannot build renewal notice`);
  }

  const nomineeFirstName = policy.nominee.split(' ')[0];
  return {
    policyNumber: policy.policyNumber,
    greeting: `Dear ${nomineeFirstName},`,
    renewalPremium: Math.round(policy.premium * RENEWAL_RATE),
  };
}

function processPolicy(policy) {
  log('INFO', 'policy_start', { policyId: policy.id, policyNumber: policy.policyNumber });

  try {
    const notice = buildRenewalNotice(policy);

    checkpoint.lastProcessedPolicyId = policy.id;
    checkpoint.processedCount += 1;
    log('INFO', 'checkpoint_saved', { policyId: policy.id, processedCount: checkpoint.processedCount });
    log('INFO', 'policy_complete', { policyId: policy.id, renewalPremium: notice.renewalPremium });

    return { status: 'processed', policyId: policy.id, notice };
  } catch (err) {
    // A policy with missing/empty data needed for this step must not take
    // down the whole nightly run. Flag it for manual data-quality
    // follow-up, advance the checkpoint past it, and let the batch continue
    // with the remaining policies.
    checkpoint.lastProcessedPolicyId = policy.id;
    checkpoint.processedCount += 1;
    log('WARN', 'checkpoint_saved', { policyId: policy.id, processedCount: checkpoint.processedCount });
    log('WARN', 'policy_flagged_for_review', {
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      reason: err.message,
    });

    return { status: 'flagged', policyId: policy.id, policyNumber: policy.policyNumber, reason: err.message };
  }
}

function runNightlyRenewalBatch() {
  const activePolicies = policies.filter((p) => p.status === 'Active');
  log('INFO', 'job_start', { totalPolicies: activePolicies.length });

  const results = activePolicies.map(processPolicy);
  const flagged = results.filter((r) => r.status === 'flagged');

  log('INFO', 'job_complete', {
    processedCount: results.length - flagged.length,
    flaggedCount: flagged.length,
    totalPolicies: activePolicies.length,
  });

  if (flagged.length) {
    log('WARN', 'manual_review_required', {
      flaggedPolicies: flagged.map((f) => f.policyNumber).join(','),
    });
  }

  return results;
}

if (require.main === module) {
  runNightlyRenewalBatch();
}

module.exports = { runNightlyRenewalBatch, buildRenewalNotice, processPolicy, checkpoint };
