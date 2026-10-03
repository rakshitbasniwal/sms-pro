import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboardStats, getRecentActivities } from '../../api/dashboard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [statsRes, actRes] = await Promise.all([
        getDashboardStats(),
        getRecentActivities(),
      ]);

      console.log('[DASHBOARD] Stats received:', statsRes.data.data);
      setStats(statsRes.data.data);
      setActivities(actRes.data.data || []);
    } catch (err) {
      console.error('[DASHBOARD] Failed to load:', err.response?.data || err.message);
      setError(
        err.response?.data?.message || err.message || 'Unable to load dashboard statistics.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch on mount and whenever navigating back to dashboard
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const fmt = (n) => (n ?? 0).toLocaleString('en-IN');
  const fmtCur = (n) => `₹${fmt(n)}`;

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 1)   return 'just now';
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="page-container animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', fontSize: '18px', color: 'var(--text-secondary)' }}>
          ⏳ Loading dashboard statistics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Dashboard Overview</h1>
          <button className="btn btn-primary" onClick={() => fetchDashboard(true)}>🔄 Retry</button>
        </div>
        <div className="card" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
          <div style={{ color: 'var(--danger)', fontWeight: '600', fontSize: '16px' }}>Unable to load dashboard statistics</div>
          <div style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '14px' }}>{error}</div>
          <div style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '12px' }}>Check the backend console for more details.</div>
        </div>
      </div>
    );
  }

  const adminCards = [
    { label: 'Total Students',      value: fmt(stats?.totalStudents),      icon: '👨‍🎓', color: 'var(--primary-color)',   nav: '/students' },
    { label: 'Total Teachers',      value: fmt(stats?.totalTeachers),      icon: '👨‍🏫', color: 'var(--secondary-color)', nav: '/teachers' },
    { label: 'Total Classes',       value: fmt(stats?.totalClasses),       icon: '🏫', color: 'var(--warning)',          nav: '/classes' },
    { label: 'Fees Collected',      value: fmtCur(stats?.feesCollected),   icon: '✅', color: 'var(--success)',          nav: '/fees' },
    { label: 'Pending Fees',        value: fmtCur(stats?.pendingFees),     icon: '⏳', color: 'var(--danger)',           nav: '/fees' },
    { label: "Today's Present",     value: fmt(stats?.todayPresent),       icon: '✔️', color: 'var(--success)',          nav: '/attendance' },
    { label: "Today's Absent",      value: fmt(stats?.todayAbsent),        icon: '❌', color: 'var(--danger)',           nav: '/attendance' },
    { label: 'Monthly Payroll',     value: fmtCur(stats?.monthlyPayroll),  icon: '💼', color: '#8b5cf6',                nav: '/payroll' },
  ];

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {refreshing ? '⏳' : '🔄'} {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/reports')}>
            📊 Generate Report
          </button>
        </div>
      </div>

      {/* ADMIN STATS */}
      {(!user?.role || user.role === 'admin') && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          {adminCards.map((card) => (
            <div
              key={card.label}
              className="card"
              onClick={() => navigate(card.nav)}
              style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', userSelect: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '500' }}>{card.label}</div>
                <span style={{ fontSize: '24px' }}>{card.icon}</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* TEACHER STATS */}
      {user?.role === 'teacher' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div className="card" onClick={() => navigate('/attendance')} style={{ cursor: 'pointer' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>Today's Present</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--success)' }}>{fmt(stats?.todayPresent)}</div>
          </div>
          <div className="card" onClick={() => navigate('/attendance')} style={{ cursor: 'pointer' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>Today's Absent</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--danger)' }}>{fmt(stats?.todayAbsent)}</div>
          </div>
        </div>
      )}

      {/* STUDENT STATS */}
      {user?.role === 'student' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div className="card">
            <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>My Attendance</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--success)' }}>—</div>
          </div>
          <div className="card" onClick={() => navigate('/fees')} style={{ cursor: 'pointer' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>Pending Fees</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--danger)' }}>{fmtCur(stats?.pendingFees)}</div>
          </div>
        </div>
      )}

      {/* SALARY SUMMARY (admin) */}
      {(!user?.role || user.role === 'admin') && (
        <div className="card" style={{ marginBottom: '32px', background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.1))', border: '1px solid rgba(139,92,246,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '600' }}>💼 This Month's Payroll</h2>
            <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => navigate('/payroll')}>
              View Payroll →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Payroll</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#8b5cf6' }}>{fmtCur(stats?.monthlyPayroll)}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Paid</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--success)' }}>{fmtCur(stats?.salaryPaidThisMonth)}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Pending</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--danger)' }}>{fmtCur(stats?.salaryPendingThisMonth)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-grid" style={{ display: 'grid', gap: '24px' }}>
        {/* RECENT ACTIVITIES */}
        <div className="card">
          <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Recent Activities
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>{activities.length} items</span>
          </h2>
          {activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
              <div style={{ fontWeight: '500' }}>No recent activities yet</div>
              <div style={{ fontSize: '13px', marginTop: '6px' }}>Activities will appear here as data is added.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activities.map((act) => (
                <div key={act._id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '24px', minWidth: '32px', textAlign: 'center' }}>{act.icon || '📌'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>{act.title}</div>
                    {act.description && (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px' }}>{act.description}</div>
                    )}
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {act.performedBy?.name ? `by ${act.performedBy.name} · ` : ''}{timeAgo(act.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QUICK ACTIONS */}
        <div className="card">
          <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Quick Actions</h2>
          {(!user?.role || user.role === 'admin') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => navigate('/students')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                ➕ Add New Student
              </button>
              <button onClick={() => navigate('/teachers')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                ➕ Add New Teacher
              </button>
              <button onClick={() => navigate('/attendance')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                📝 Mark Attendance
              </button>
              <button onClick={() => navigate('/fees')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                💰 Collect Fees
              </button>
              <button onClick={() => navigate('/payroll')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                💼 Manage Payroll
              </button>
              <button onClick={() => navigate('/reports')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>
                📊 Generate Report
              </button>
            </div>
          )}
          {user?.role === 'teacher' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => navigate('/attendance')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>📝 Mark Attendance</button>
              <button onClick={() => navigate('/timetable')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>📅 View Timetable</button>
              <button onClick={() => navigate('/payroll')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>💼 View My Salary</button>
            </div>
          )}
          {user?.role === 'student' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => navigate('/timetable')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>📅 View Timetable</button>
              <button onClick={() => navigate('/results')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>🏆 View Results</button>
              <button onClick={() => navigate('/fees')} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }}>💰 Pay Fees</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
