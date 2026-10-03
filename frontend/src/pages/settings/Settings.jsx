import React from 'react';

const Settings = () => {
  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">System Settings</h1>
      </div>

      <div className="card" style={{ maxWidth: '800px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>General Settings</h2>
        
        <div style={{ display: 'grid', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">School Name</label>
            <input type="text" className="form-input" defaultValue="Global International School" />
          </div>
          
          <div className="form-group">
            <label className="form-label">Academic Year</label>
            <select className="form-input">
              <option>2023-2024</option>
              <option selected>2024-2025</option>
              <option>2025-2026</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Currency Symbol</label>
            <input type="text" className="form-input" defaultValue="$" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
            <input type="checkbox" id="emailNotif" defaultChecked style={{ width: '18px', height: '18px' }} />
            <label htmlFor="emailNotif" style={{ fontWeight: '500' }}>Enable Email Notifications</label>
          </div>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary">Save Settings</button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
