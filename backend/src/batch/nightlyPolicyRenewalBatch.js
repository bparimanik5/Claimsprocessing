// backend/src/batch/nightlyPolicyRenewalBatch.js
//
// POLICY-RENEWAL-NIGHTLY
// ------------------------------------------------------------------------
// Nightly batch job that walks every Active policy, calculates the
// upcoming renewal premium, and prepares a renewal notice addressed to the
// policyholder's nominee.
//
// The job is checkpointed: after each policy is processed successfully,
// progress (last processed policy + count) is persisted so a restart can
// resume from the last good checkpoint instead of reprocessing everything.
// In this sample app the checkpoint store is an in-memory object to match
// the rest of the data layer (backend/src/data/seed.js); in production this
// would be a DB row / durable file.
//
// Log lines are written in Splunk-friendly key=value format so they can be
// ingested and searched (index=claims_processing sourcetype=policy-renewal-svc).

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
  // renewal on ..."). Handles missing or empty nominee fields by flagging the
  // policy for manual review instead of throwing.
  if (!policy.nominee || typeof policy.nominee !== 'string' || policy.nominee.trim() === '') {
    log('WARN', 'manual_review', {
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      reason: 'missing_nominee',
    });
    // Still calculate the renewal premium; greeting is left null for downstream handling.
    return {
      policyNumber: policy.policyNumber,
      greeting: null,
      renewalPremium: Math.round(policy.premium * RENEWAL_RATE),
    };
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

  const notice = buildRenewalNotice(policy);

  checkpoint.lastProcessedPolicyId = policy.id;
  checkpoint.processedCount += 1;
  log('INFO', 'checkpoint_saved', { policyId: policy.id, processedCount: checkpoint.processedCount });
  log('INFO', 'policy_complete', { policyId: policy.id, renewalPremium: notice.renewalPremium });

  return notice;
}

function runNightlyRenewalBatch() {
  const activePolicies = policies.filter((p) => p.status === 'Active');
  log('INFO', 'job_start', { totalPolicies: activePolicies.length });

  const results = [];
  for (const policy of activePolicies) {
    try {
      results.push(processPolicy(policy));
    } catch (err) {
      log('ERROR', 'policy_failed', {
        policyId: policy.id,
        policyNumber: policy.policyNumber,
        error: err.message,
      });
      log('ERROR', 'job_aborted', {
        lastGoodCheckpoint: checkpoint.lastProcessedPolicyId,
        processedCount: checkpoint.processedCount,
        totalPolicies: activePolicies.length,
      });
      throw err;
    }
  }

  log('INFO', 'job_complete', { processedCount: checkpoint.processedCount, totalPolicies: activePolicies.length });
  return results;
}

if (require.main === module) {
  try {
    runNightlyRenewalBatch();
    process.exit(0);
  } catch (err) {
    console.error(err.stack || String(err));
    process.exit(1);
  }
}

module.exports = { runNightlyRenewalBatch, buildRenewalNotice, processPolicy, checkpoint };