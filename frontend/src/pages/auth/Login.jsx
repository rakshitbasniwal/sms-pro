import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '48px 40px',
        width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
        animation: 'fadeIn 0.4s ease-out forwards',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎓</div>
          <h1 style={{ color: 'var(--primary-color)', marginBottom: '4px', fontSize: '28px' }}>SMS Pro</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Student Management System</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px 16px',
            borderRadius: '8px', marginBottom: '20px', fontSize: '14px',
            border: '1px solid #fca5a5',
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="admin@school.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '16px' }}
            disabled={loading}
          >
            {loading ? '⏳ Signing in...' : '🔑 Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Don&apos;t have an account? </span>
          <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
