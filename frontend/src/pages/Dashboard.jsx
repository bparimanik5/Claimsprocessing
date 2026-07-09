import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboardStats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-error" data-testid="dashboard-error">{error}</div>;
  if (!stats) return <div data-testid="dashboard-loading">Loading dashboard…</div>;

  return (
    <div className="page" data-testid="dashboard-page">
      <h1>Dashboard</h1>
      <div className="stat-grid">
        <div className="stat-card" data-testid="stat-total-claims">
          <div className="stat-value">{stats.totalClaims}</div>
          <div className="stat-label">Total Claims</div>
        </div>
        <div className="stat-card" data-testid="stat-total-claimed">
          <div className="stat-value">₹{stats.totalClaimed.toLocaleString('en-IN')}</div>
          <div className="stat-label">Total Claimed</div>
        </div>
        <div className="stat-card" data-testid="stat-total-approved">
          <div className="stat-value">₹{stats.totalApproved.toLocaleString('en-IN')}</div>
          <div className="stat-label">Total Approved</div>
        </div>
      </div>

      <h2>Claims by Status</h2>
      <div className="status-grid">
        {Object.entries(stats.statusCounts).map(([status, count]) => (
          <div key={status} className="status-count-card" data-testid={`status-count-${status.replace(/\s+/g, '-').toLowerCase()}`}>
            <span>{status}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>

      <div className="quick-links">
        <Link to="/claims" data-testid="quick-link-claims">View all claims</Link>
        <Link to="/policies" data-testid="quick-link-policies">Search policies</Link>
      </div>
    </div>
  );
}
