import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">User Profile</h1>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%', 
            backgroundColor: 'var(--primary-color)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', fontWeight: 'bold'
          }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '24px', margin: 0 }}>{user?.name || 'User'}</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{user?.role || 'Administrator'}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" value={user?.email || ''} readOnly />
          </div>
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input type="text" className="form-input" defaultValue="+1 234 567 8900" />
          </div>
          <div style={{ marginTop: '16px' }}>
            <button className="btn btn-primary">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
