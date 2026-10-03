import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const MENU_BY_ROLE = {
  admin: [
    { name: 'Dashboard',        path: '/',           icon: '📊', end: true },
    { name: 'Students',         path: '/students',   icon: '👨‍🎓' },
    { name: 'Teachers',         path: '/teachers',   icon: '👨‍🏫' },
    { name: 'Classes',          path: '/classes',    icon: '🏫' },
    { name: 'Attendance',       path: '/attendance', icon: '📝' },
    { name: 'Timetable',        path: '/timetable',  icon: '📅' },
    { name: 'Exam Management',  path: '/exams',      icon: '📋' },
    { name: 'Results',          path: '/results',    icon: '🏆' },
    { name: 'Fees',             path: '/fees',       icon: '💰' },
    { name: 'Payroll',          path: '/payroll',    icon: '💼' },
    { name: 'Reports',          path: '/reports',    icon: '📉' },
  ],
  teacher: [
    { name: 'Dashboard',   path: '/',           icon: '📊', end: true },
    { name: 'My Classes',  path: '/classes',    icon: '🏫' },
    { name: 'Students',    path: '/students',   icon: '👨‍🎓' },
    { name: 'Attendance',  path: '/attendance', icon: '📝' },
    { name: 'Timetable',   path: '/timetable',  icon: '📅' },
    { name: 'Exams',       path: '/exams',      icon: '📋' },
    { name: 'Results',     path: '/results',    icon: '🏆' },
    { name: 'My Salary',   path: '/payroll',    icon: '💼' },
  ],
  student: [
    { name: 'Dashboard',  path: '/',           icon: '📊', end: true },
    { name: 'My Profile', path: '/profile',    icon: '👤' },
    { name: 'My Classes', path: '/classes',    icon: '🏫' },
    { name: 'Attendance', path: '/attendance', icon: '📝' },
    { name: 'Timetable',  path: '/timetable',  icon: '📅' },
    { name: 'Exams',      path: '/exams',      icon: '📋' },
    { name: 'Results',    path: '/results',    icon: '🏆' },
    { name: 'Fees',       path: '/fees',       icon: '💰' },
  ],
};

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const role = user?.role || 'admin';
  const menuItems = MENU_BY_ROLE[role] || MENU_BY_ROLE.admin;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleItemClick = () => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span style={{ fontSize: '24px' }}>🎓</span>
          {!collapsed && <span>SMS Pro</span>}
        </div>
        <button
          className="desktop-only"
          onClick={() => setCollapsed(c => !c)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '18px', marginLeft: 'auto' }}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '›' : '‹'}
        </button>
        <button
          className="mobile-only"
          onClick={() => setMobileOpen(false)}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'white', fontSize: '24px', marginLeft: 'auto', display: 'none' }}
        >
          ×
        </button>
      </div>

      {/* User info strip */}
      {!collapsed && (
        <div className="sidebar-user">
          <div className="sidebar-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
          <div>
            <div className="sidebar-username">{user?.name || 'User'}</div>
            <div className="sidebar-role-badge">{role.charAt(0).toUpperCase() + role.slice(1)}</div>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            to={item.path}
            key={item.name}
            end={item.end}
            onClick={handleItemClick}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            title={collapsed ? item.name : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span>{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {role !== 'student' && (
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            title={collapsed ? 'Profile' : undefined}
          >
            <span className="nav-icon">👤</span>
            {!collapsed && 'Profile'}
          </NavLink>
        )}
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          title={collapsed ? 'Settings' : undefined}
        >
          <span className="nav-icon">⚙️</span>
          {!collapsed && 'Settings'}
        </NavLink>
        <button onClick={handleLogout} className="nav-item logout-btn" title={collapsed ? 'Logout' : undefined}>
          <span className="nav-icon">🚪</span>
          {!collapsed && 'Logout'}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
