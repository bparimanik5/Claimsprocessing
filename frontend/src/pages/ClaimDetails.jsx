import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const TRANSITIONS = {
  Submitted: ['Under Review', 'Rejected'],
  'Under Review': ['Additional Info Requested', 'Approved', 'Rejected'],
  'Additional Info Requested': ['Under Review', 'Rejected'],
  Approved: ['Paid'],
  Rejected: [],
  Paid: [],
};

export default function ClaimDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [claim, setClaim] = useState(null);
  const [error, setError] = useState('');
  const [nextStatus, setNextStatus] = useState('');
  const [comment, setComment] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [actionError, setActionError] = useState('');
  const [updating, setUpdating] = useState(false);

  function load() {
    api.getClaim(id).then(setClaim).catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleTransition(e) {
    e.preventDefault();
    setActionError('');
    setUpdating(true);
    try {
      const payload = { status: nextStatus, comment };
      if (nextStatus === 'Approved') payload.approvedAmount = Number(approvedAmount);
      const updated = await api.updateClaimStatus(id, payload);
      setClaim(updated);
      setNextStatus('');
      setComment('');
      setApprovedAmount('');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  if (error) return <div className="alert alert-error" data-testid="claim-details-error">{error}</div>;
  if (!claim) return <div data-testid="claim-details-loading">Loading claim…</div>;

  const canAdjudicate = user && (user.role === 'adjudicator' || user.role === 'admin');
  const allowedNext = TRANSITIONS[claim.status] || [];

  return (
    <div className="page" data-testid="claim-details-page">
      <h1>
        Claim {claim.claimNumber} <StatusBadge status={claim.status} />
      </h1>

      <div className="detail-grid">
        <div><strong>Claimant:</strong> {claim.claimantName}</div>
        <div><strong>Policy:</strong> {claim.policyNumber} ({claim.policyHolderName})</div>
        <div><strong>Claim Type:</strong> {claim.claimType}</div>
        <div><strong>Date of Incident:</strong> {claim.dateOfIncident}</div>
        <div><strong>Amount Claimed:</strong> ₹{claim.amountClaimed.toLocaleString('en-IN')}</div>
        <div><strong>Amount Approved:</strong> {claim.amountApproved ? `₹${claim.amountApproved.toLocaleString('en-IN')}` : '—'}</div>
        <div><strong>Submitted:</strong> {claim.submittedDate}</div>
      </div>

      <h2>Description</h2>
      <p data-testid="claim-description">{claim.description}</p>

      <h2>Documents</h2>
      <ul data-testid="claim-documents">
        {claim.documents.map((d) => (
          <li key={d.id}>{d.name} (uploaded {d.uploadedDate})</li>
        ))}
        {claim.documents.length === 0 && <li>No documents attached.</li>}
      </ul>

      <h2>Status History</h2>
      <ul className="history-list" data-testid="claim-history">
        {claim.history.map((h, i) => (
          <li key={i}>
            <StatusBadge status={h.status} /> — {h.date} by {h.by}
            {h.comment ? `: ${h.comment}` : ''}
          </li>
        ))}
      </ul>

      {canAdjudicate && allowedNext.length > 0 && (
        <div className="adjudication-panel" data-testid="adjudication-panel">
          <h2>Update Claim Status</h2>
          {actionError && <div className="alert alert-error" data-testid="adjudication-error">{actionError}</div>}
          <form onSubmit={handleTransition}>
            <label htmlFor="nextStatus">New Status</label>
            <select
              id="nextStatus"
              data-testid="next-status-select"
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
              required
            >
              <option value="">Select…</option>
              {allowedNext.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {nextStatus === 'Approved' && (
              <>
                <label htmlFor="approvedAmount">Approved Amount (₹)</label>
                <input
                  id="approvedAmount"
                  type="number"
                  data-testid="approved-amount-input"
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  max={claim.amountClaimed}
                  required
                />
              </>
            )}

            <label htmlFor="comment">Comment</label>
            <textarea
              id="comment"
              data-testid="adjudication-comment-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />

            <button type="submit" data-testid="submit-status-update" disabled={updating}>
              {updating ? 'Updating…' : 'Update Status'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
