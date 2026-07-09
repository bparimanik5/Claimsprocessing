import { useEffect, useState } from 'react';
import { api } from '../api/client';
import ClaimCard from '../components/ClaimCard';

const STATUSES = ['Submitted', 'Under Review', 'Additional Info Requested', 'Approved', 'Rejected', 'Paid'];

export default function ClaimsList() {
  const [claims, setClaims] = useState([]);
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  function load(params = {}) {
    api.getClaims(params).then(setClaims).catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
  }, []);

  function handleFilter(e) {
    e.preventDefault();
    const params = {};
    if (status) params.status = status;
    if (query) params.query = query;
    load(params);
  }

  return (
    <div className="page" data-testid="claims-list-page">
      <h1>Claims</h1>

      <form onSubmit={handleFilter} className="filter-form" data-testid="claims-filter-form">
        <input
          placeholder="Search claim number or claimant"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="claims-search-input"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} data-testid="claims-status-filter">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="submit" data-testid="claims-filter-button">Filter</button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      <table className="claims-table" data-testid="claims-table">
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

      {claims.length === 0 && <div data-testid="no-claims">No claims found.</div>}
    </div>
  );
}
