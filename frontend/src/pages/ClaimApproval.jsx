import { useEffect, useState } from 'react';
import { api } from '../api/client';
import ClaimCard from '../components/ClaimCard';

const PENDING_STATUSES = ['Submitted', 'Under Review', 'Additional Info Requested'];

export default function ClaimApproval() {
  const [claims, setClaims] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all(PENDING_STATUSES.map((s) => api.getClaims({ status: s })))
      .then((results) => setClaims(results.flat()))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="page" data-testid="approvals-page">
      <h1>Approval Queue</h1>
      <p>Claims awaiting adjudication (Submitted, Under Review, or Additional Info Requested).</p>

      {error && <div className="alert alert-error">{error}</div>}

      <table className="claims-table" data-testid="approvals-table">
        <thead>
          <tr>
            <th>Claim #</th>
            <th>Claimant</th>
            <th>Type</th>
            <th>Policy</th>
            <th>Amount Claimed</th>
            <th>Status</th>
            <th>Submitted</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {claims.map((c) => (
            <ClaimCard key={c.id} claim={c} />
          ))}
        </tbody>
      </table>

      {claims.length === 0 && <div data-testid="no-pending-claims">No claims pending review.</div>}
    </div>
  );
}
