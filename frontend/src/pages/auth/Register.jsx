import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('admin');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.');
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
        background: 'white', borderRadius: '16px', padding: '40px',
        width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
        animation: 'fadeIn 0.4s ease-out forwards',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎓</div>
          <h1 style={{ color: 'var(--primary-color)', marginBottom: '4px', fontSize: '24px' }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Register for SMS Pro</p>
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
            <label className="form-label">Full Name</label>
            <input
              id="reg-name"
              type="text"
              className="form-input"
              placeholder="John Doe"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              id="reg-email"
              type="email"
              className="form-input"
              placeholder="admin@school.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password <small>(min 6 characters)</small></label>
            <input
              id="reg-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Account Role</label>
            <select
              id="reg-role"
              className="form-input"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
          <button
            id="reg-submit"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '16px' }}
            disabled={loading}
          >
            {loading ? '⏳ Creating account...' : '✅ Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Already have an account? </span>
          <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
