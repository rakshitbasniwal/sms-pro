import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const roleColors = {
  admin:   { bg: 'rgba(79,70,229,0.15)',  color: '#4f46e5' },
  teacher: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  student: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
};

const Topbar = ({ toggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const role = user?.role || 'admin';
  const roleStyle = roleColors[role] || roleColors.admin;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const PAGE_TITLES = {
    '/':           'Dashboard',
    '/students':   'Students',
    '/teachers':   'Teachers',
    '/classes':    'Class Management',
    '/exams':      'Exam Management',
    '/attendance': 'Attendance',
    '/timetable':  'Timetable',
    '/results':    'Results',
    '/fees':       'Fees',
    '/reports':    'Reports',
    '/profile':    'Profile',
    '/settings':   'Settings',
  };
  const currentPath = window.location.pathname;
  const pageTitle = PAGE_TITLES[currentPath] || 'SMS Pro';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button 
          className="hamburger-menu" 
          onClick={toggleMobileMenu}
          style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '16px', display: 'none' }}
        >
          ☰
        </button>
        <h2 className="topbar-title">{pageTitle}</h2>
      </div>

      <div className="topbar-actions">
        {/* Profile Dropdown */}
        <div className="profile-dropdown-wrapper" ref={dropdownRef}>
          <button
            className="profile-btn"
            onClick={() => setDropdownOpen(o => !o)}
            aria-expanded={dropdownOpen}
          >
            <div className="profile-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="profile-info">
              <span className="profile-name">{user?.name || 'User'}</span>
              <span className="profile-role-tag" style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>▾</span>
          </button>

          {dropdownOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                <div>
                  <div className="dropdown-name">{user?.name || 'User'}</div>
                  <div className="dropdown-email">{user?.email || ''}</div>
                  <div className="dropdown-role" style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </div>
                </div>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item" onClick={() => { navigate('/profile'); setDropdownOpen(false); }}>
                👤 My Profile
              </button>
              <button className="dropdown-item" onClick={() => { navigate('/settings'); setDropdownOpen(false); }}>
                ⚙️ Settings
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
