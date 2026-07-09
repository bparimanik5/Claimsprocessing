import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

const CLAIM_TYPES = ['Death', 'Critical Illness', 'Income Protection', 'Terminal Illness'];

export default function NewClaim() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [policies, setPolicies] = useState([]);
  const [policyId, setPolicyId] = useState(searchParams.get('policyId') || '');
  const [claimType, setClaimType] = useState('');
  const [claimantName, setClaimantName] = useState('');
  const [dateOfIncident, setDateOfIncident] = useState('');
  const [description, setDescription] = useState('');
  const [amountClaimed, setAmountClaimed] = useState('');
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    api.getPolicies().then(setPolicies).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      const claim = await api.createClaim({
        policyId,
        claimType,
        claimantName,
        dateOfIncident,
        description,
        amountClaimed: Number(amountClaimed),
      });

      if (fileName) {
        await api.addDocument(claim.id, fileName);
      }

      setSuccess(claim);
    } catch (err) {
      setErrors(err.details && err.details.length ? err.details : [err.message]);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="page" data-testid="new-claim-success">
        <h1>Claim Submitted</h1>
        <p>
          Claim <strong data-testid="new-claim-number">{success.claimNumber}</strong> has been submitted successfully
          and is now in <strong>{success.status}</strong> status.
        </p>
        <button onClick={() => navigate(`/claims/${success.id}`)} data-testid="view-new-claim-button">
          View Claim
        </button>
      </div>
    );
  }

  return (
    <div className="page" data-testid="new-claim-page">
      <h1>File a New Claim</h1>
      <form onSubmit={handleSubmit} className="claim-form" data-testid="new-claim-form">
        {errors.length > 0 && (
          <ul className="alert alert-error" data-testid="new-claim-errors">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}

        <label htmlFor="policyId">Policy</label>
        <select
          id="policyId"
          data-testid="policy-select"
          value={policyId}
          onChange={(e) => setPolicyId(e.target.value)}
          required
        >
          <option value="">Select a policy…</option>
          {policies.map((p) => (
            <option key={p.id} value={p.id}>
              {p.policyNumber} — {p.holderName} ({p.productType})
            </option>
          ))}
        </select>

        <label htmlFor="claimantName">Claimant Name</label>
        <input
          id="claimantName"
          data-testid="claimant-name-input"
          value={claimantName}
          onChange={(e) => setClaimantName(e.target.value)}
          required
        />

        <label htmlFor="claimType">Claim Type</label>
        <select
          id="claimType"
          data-testid="claim-type-select"
          value={claimType}
          onChange={(e) => setClaimType(e.target.value)}
          required
        >
          <option value="">Select claim type…</option>
          {CLAIM_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <label htmlFor="dateOfIncident">Date of Incident</label>
        <input
          id="dateOfIncident"
          type="date"
          data-testid="date-of-incident-input"
          value={dateOfIncident}
          onChange={(e) => setDateOfIncident(e.target.value)}
          required
        />

        <label htmlFor="amountClaimed">Amount Claimed (₹)</label>
        <input
          id="amountClaimed"
          type="number"
          min="1"
          data-testid="amount-claimed-input"
          value={amountClaimed}
          onChange={(e) => setAmountClaimed(e.target.value)}
          required
        />

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          data-testid="description-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          required
        />

        <label htmlFor="document">Supporting Document</label>
        <input
          id="document"
          type="file"
          data-testid="document-input"
          onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
        />

        <button type="submit" data-testid="submit-claim-button" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Claim'}
        </button>
      </form>
    </div>
  );
}
