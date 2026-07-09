import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar" data-testid="navbar">
      <div className="navbar-brand">Claims Processing — Protection Policies</div>
      <div className="navbar-links">
        <NavLink to="/dashboard" data-testid="nav-dashboard">Dashboard</NavLink>
        <NavLink to="/policies" data-testid="nav-policies">Policy Search</NavLink>
        <NavLink to="/claims" data-testid="nav-claims">Claims</NavLink>
        {(user.role === 'handler' || user.role === 'admin') && (
          <NavLink to="/claims/new" data-testid="nav-new-claim">File a Claim</NavLink>
        )}
        {(user.role === 'adjudicator' || user.role === 'admin') && (
          <NavLink to="/approvals" data-testid="nav-approvals">Approvals</NavLink>
        )}
      </div>
      <div className="navbar-user">
        <span data-testid="current-user">{user.name} ({user.role})</span>
        <button onClick={handleLogout} data-testid="logout-button">Log out</button>
      </div>
    </nav>
  );
}
