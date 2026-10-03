import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Students from './pages/students/Students';
import Teachers from './pages/teachers/Teachers';
import Classes from './pages/classes/Classes';
import Exams from './pages/exams/Exams';
import Attendance from './pages/attendance/Attendance';
import Timetable from './pages/timetable/Timetable';
import Results from './pages/results/Results';
import Fees from './pages/fees/Fees';
import Reports from './pages/reports/Reports';
import Profile from './pages/profile/Profile';
import Settings from './pages/settings/Settings';
import Payroll from './pages/payroll/Payroll';
import './App.css';

// Protected Route Wrapper
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px' }}>
      Loading...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index          element={<Dashboard />} />
              <Route path="students"   element={<ProtectedRoute roles={['admin','teacher']}><Students /></ProtectedRoute>} />
              <Route path="teachers"   element={<ProtectedRoute roles={['admin']}><Teachers /></ProtectedRoute>} />
              <Route path="classes"    element={<ProtectedRoute roles={['admin','teacher']}><Classes /></ProtectedRoute>} />
              <Route path="exams"      element={<Exams />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="timetable"  element={<Timetable />} />
              <Route path="results"    element={<Results />} />
              <Route path="fees"       element={<Fees />} />
              <Route path="reports"    element={<ProtectedRoute roles={['admin','teacher']}><Reports /></ProtectedRoute>} />
              <Route path="profile"    element={<Profile />} />
              <Route path="settings"   element={<Settings />} />
              <Route path="payroll"    element={<ProtectedRoute roles={['admin','teacher']}><Payroll /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
