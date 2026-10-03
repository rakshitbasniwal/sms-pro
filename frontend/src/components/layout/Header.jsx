import { useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/dashboard':  { title: 'Dashboard',  subtitle: 'Overview of your school management system' },
  '/students':   { title: 'Students',   subtitle: 'Manage student records' },
  '/teachers':   { title: 'Teachers',   subtitle: 'Manage teaching staff' },
  '/attendance': { title: 'Attendance', subtitle: 'Track daily attendance' },
  '/timetable':  { title: 'Timetable',  subtitle: 'Class schedules' },
  '/results':    { title: 'Results',    subtitle: 'Exam results and grades' },
  '/fees':       { title: 'Fees',       subtitle: 'Fee collection and management' },
  '/reports':    { title: 'Reports',    subtitle: 'Analytics and reports' },
  '/profile':    { title: 'Profile',    subtitle: 'Your account details' },
  '/settings':   { title: 'Settings',   subtitle: 'System configuration' },
};

export default function Header() {
  const { pathname } = useLocation();
  const info = PAGE_TITLES[pathname] || { title: 'EduManage', subtitle: '' };
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className="header">
      <div>
        <div className="header-title">{info.title}</div>
        <div className="header-subtitle">{info.subtitle}</div>
      </div>
      <div className="header-right">
        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{dateStr}</span>
        <button className="header-btn" title="Notifications">🔔</button>
      </div>
    </header>
  );
}
