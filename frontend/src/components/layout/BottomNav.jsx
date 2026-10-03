import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../App.css';

const BottomNav = () => {
  const { user } = useAuth();
  const role = user?.role || 'admin';

  let navItems = [];
  if (role === 'admin') {
    navItems = [
      { name: 'Home', path: '/', icon: '📊' },
      { name: 'Students', path: '/students', icon: '👨‍🎓' },
      { name: 'Teachers', path: '/teachers', icon: '👨‍🏫' },
      { name: 'More', path: '/settings', icon: '⚙️' },
    ];
  } else if (role === 'teacher') {
    navItems = [
      { name: 'Home', path: '/', icon: '📊' },
      { name: 'Classes', path: '/classes', icon: '🏫' },
      { name: 'Students', path: '/students', icon: '👨‍🎓' },
      { name: 'More', path: '/profile', icon: '👤' },
    ];
  } else {
    navItems = [
      { name: 'Home', path: '/', icon: '📊' },
      { name: 'Classes', path: '/classes', icon: '🏫' },
      { name: 'Results', path: '/results', icon: '🏆' },
      { name: 'More', path: '/profile', icon: '👤' },
    ];
  }

  return (
    <div className="bottom-nav" style={{
      display: 'none',
      position: 'fixed',
      bottom: 0,
      left: 0,
      width: '100%',
      height: '65px',
      backgroundColor: 'white',
      borderTop: '1px solid var(--border-color)',
      zIndex: 1000,
      justifyContent: 'space-around',
      alignItems: 'center',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
    }}>
      {navItems.map((item) => (
        <NavLink
          to={item.path}
          key={item.name}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: '11px',
            fontWeight: isActive ? '700' : '500',
            width: '25%',
            padding: '8px 0'
          })}
        >
          <span style={{ fontSize: '22px', marginBottom: '4px' }}>{item.icon}</span>
          <span>{item.name}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default BottomNav;
