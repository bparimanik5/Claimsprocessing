import { useState } from 'react';
import { api } from '../api/client';
import PolicyCard from '../components/PolicyCard';

export default function PolicySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api.getPolicies(query ? { query } : {});
      setResults(data);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page" data-testid="policy-search-page">
      <h1>Policy Search</h1>
      <form onSubmit={handleSearch} className="search-form" data-testid="policy-search-form">
        <input
          placeholder="Search by policy number or holder name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          data-testid="policy-search-input"
        />
        <button type="submit" data-testid="policy-search-button">Search</button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card-grid" data-testid="policy-results">
        {results.map((p) => (
          <PolicyCard key={p.id} policy={p} />
        ))}
      </div>

      {searched && results.length === 0 && (
        <div data-testid="no-policy-results">No policies matched your search.</div>
      )}
    </div>
  );
}
