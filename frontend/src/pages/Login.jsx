import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit} data-testid="login-form">
        <h1>Claims Processing</h1>
        <p className="subtitle">Protection Policies Portal</p>

        {error && <div className="alert alert-error" data-testid="login-error">{error}</div>}

        <label htmlFor="username">Username</label>
        <input
          id="username"
          data-testid="username-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          data-testid="password-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <button type="submit" data-testid="login-button" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>

        <div className="login-hint">
          Demo accounts: <code>handler / handler123</code>, <code>adjudicator / adjudicator123</code>,{' '}
          <code>admin / admin123</code>
        </div>
      </form>
    </div>
  );
}
