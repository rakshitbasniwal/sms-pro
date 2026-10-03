import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  getAttendance,
  markAttendance,
  getMonthlyAttendance,
  updateAttendance,
  deleteAttendance,
} from '../../api/attendance';

/* ─── Constants ──────────────────────────────────────────────────────── */
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];
const STATUSES = ['Present', 'Absent', 'Late', 'Leave'];
const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_CONFIG = {
  Present: { bg: '#dcfce7', color: '#16a34a', icon: '🟢', label: 'Present' },
  Absent:  { bg: '#fee2e2', color: '#dc2626', icon: '🔴', label: 'Absent'  },
  Late:    { bg: '#fef9c3', color: '#ca8a04', icon: '🟡', label: 'Late'    },
  Leave:   { bg: '#e0e7ff', color: '#4f46e5', icon: '🔵', label: 'Leave'   },
};

const now = new Date();

/* ─── Main Component ─────────────────────────────────────────────────── */
const Attendance = () => {
  const { user } = useAuth();
  const toast    = useToast();
  const isAdmin  = user?.role === 'admin' || user?.role === 'teacher';

  /* Filters */
  const [classes,       setClasses]       = useState([]);
  const [className,     setClassName]     = useState('Class 10');
  const [section,       setSection]       = useState('A');
  const [date,          setDate]          = useState(now.toISOString().split('T')[0]);
  const [viewMonth,     setViewMonth]     = useState(now.getMonth() + 1);
  const [viewYear,      setViewYear]      = useState(now.getFullYear());

  /* Daily mark-attendance state */
  const [students,      setStudents]      = useState([]);
  const [attendance,    setAttendance]    = useState({}); // _id → {status, remarks}
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [fetched,       setFetched]       = useState(false);

  /* Views */
  const [view,          setView]          = useState('mark'); // 'mark' | 'calendar' | 'summary'
  const [selectedStudent, setSelectedStudent] = useState(null);

  /* Calendar state */
  const [calData,       setCalData]       = useState(null);
  const [calLoading,    setCalLoading]    = useState(false);

  /* Summary state */
  const [summaryData,   setSummaryData]   = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summarySearch, setSummarySearch] = useState('');

  /* Quick-edit (click a calendar day) */
  const [editModal,     setEditModal]     = useState(null); // { day, record|null, student }

  /* ── Load classes from DB (falls back to student data) ───────────── */
  useEffect(() => {
    api.get('/classes', { params: { limit: 200 } }).then(async res => {
      let data = res.data.data || [];
      if (data.length === 0) {
        // Fallback: derive unique class names from students
        try {
          const sRes = await api.get('/students', { params: { limit: 500 } });
          const uniqueClasses = [...new Set((sRes.data.data || []).map(s => s.className).filter(Boolean))].sort();
          data = uniqueClasses.map(n => ({ _id: n, name: n, section: '' }));
        } catch (_) {}
      }
      setClasses(data);
    }).catch(() => {});
  }, []);

  /* ── Load students + today's attendance ──────────────────────────── */
  const loadStudentsAndAttendance = useCallback(async () => {
    if (!className) { toast.warning('Please select a class first.'); return; }
    setLoading(true);
    setFetched(false);
    setStudents([]);
    try {
      const [sRes, aRes] = await Promise.all([
        api.get('/students', { params: { className, section, limit: 200 } }),
        getAttendance({ className, section, date }),
      ]);

      const studs    = sRes.data.data || [];
      const existing = aRes.data.data || [];

      setStudents(studs);

      const initMap = {};
      studs.forEach(s => { initMap[s._id] = { status: 'Present', remarks: '' }; });
      existing.forEach(rec => {
        const sid = rec.studentId?._id || rec.studentId;
        if (sid) initMap[sid] = { status: rec.status, remarks: rec.remarks || '', _id: rec._id };
      });
      setAttendance(initMap);
      setFetched(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load attendance data.');
    } finally {
      setLoading(false);
    }
  }, [className, section, date]);

  /* ── Save bulk attendance ────────────────────────────────────────── */
  const saveAttendance = async () => {
    if (students.length === 0) { toast.warning('No students to mark attendance for.'); return; }
    setSaving(true);
    try {
      const records = students.map(s => ({
        studentId: s._id,
        status:    attendance[s._id]?.status || 'Present',
        remarks:   attendance[s._id]?.remarks || '',
      }));
      await markAttendance({ className, section, date, records });
      toast.success('Attendance saved successfully!');
      loadStudentsAndAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Load monthly calendar for a student ─────────────────────────── */
  const loadCalendar = useCallback(async (student, month = viewMonth, year = viewYear) => {
    setCalLoading(true);
    setCalData(null);
    try {
      const res = await getMonthlyAttendance(student._id, { month, year });
      setCalData(res.data);
      setSelectedStudent(student);
      setView('calendar');
      setViewMonth(month);
      setViewYear(year);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load calendar.');
    } finally {
      setCalLoading(false);
    }
  }, [viewMonth, viewYear]);

  /* ── Load class monthly summary ───────────────────────────────────── */
  const loadSummary = useCallback(async () => {
    if (!className) return;
    setSummaryLoading(true);
    setSummaryData(null);
    try {
      const res = await getAttendance({ className, section, month: viewMonth, year: viewYear });
      const records = res.data.data || [];
      // Group by student
      const map = {};
      records.forEach(r => {
        const sid = r.studentId?._id;
        if (!sid) return;
        if (!map[sid]) {
          map[sid] = {
            student: r.studentId,
            present: 0, absent: 0, late: 0, leave: 0,
          };
        }
        map[sid][r.status.toLowerCase()]++;
      });
      // Fetch all students in class to include those with 0 attendance
      const sRes = await api.get('/students', { params: { className, section, limit: 200 } });
      const allStudents = sRes.data.data || [];
      allStudents.forEach(s => {
        if (!map[s._id]) {
          map[s._id] = { student: s, present: 0, absent: 0, late: 0, leave: 0 };
        }
      });

      setSummaryData(Object.values(map));
      setView('summary');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load summary.');
    } finally {
      setSummaryLoading(false);
    }
  }, [className, section, viewMonth, viewYear]);

  /* ── Quick-edit a calendar day ───────────────────────────────────── */
  const openEditModal = (day, record) => {
    if (!isAdmin) return;
    setEditModal({ day, record, student: selectedStudent });
  };

  const saveEditModal = async (status, remarks) => {
    if (!editModal) return;
    const { day, record, student } = editModal;
    const dt = new Date(viewYear, viewMonth - 1, day);
    dt.setHours(12, 0, 0, 0); // noon to avoid tz issues
    try {
      if (record?._id) {
        await updateAttendance(record._id, { status, remarks });
        toast.success('Attendance updated successfully!');
      } else {
        await markAttendance({
          className: student.className,
          section:   student.section,
          date:      dt.toISOString().split('T')[0],
          records:   [{ studentId: student._id, status, remarks }],
        });
        toast.success('Attendance saved successfully!');
      }
      setEditModal(null);
      loadCalendar(student, viewMonth, viewYear);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.');
    }
  };

  /* ── Counts ─────────────────────────────────────────────────────── */
  const presentCount = students.filter(s => attendance[s._id]?.status === 'Present').length;
  const absentCount  = students.filter(s => attendance[s._id]?.status === 'Absent').length;
  const lateCount    = students.filter(s => attendance[s._id]?.status === 'Late').length;
  const leaveCount   = students.filter(s => attendance[s._id]?.status === 'Leave').length;

  return (
    <div className="page-container animate-fade-in">
      {/* ─── Header ─── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📝 Attendance Management</h1>
          {fetched && view === 'mark' && students.length > 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
              🟢 {presentCount} Present · 🔴 {absentCount} Absent · 🟡 {lateCount} Late · 🔵 {leaveCount} Leave · Total: {students.length}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {view !== 'mark' && (
            <button className="btn btn-secondary" onClick={() => setView('mark')}>← Back</button>
          )}
          {view === 'mark' && isAdmin && fetched && students.length > 0 && (
            <button className="btn btn-secondary" onClick={loadSummary}>📊 Monthly Summary</button>
          )}
          {view === 'mark' && isAdmin && fetched && students.length > 0 && (
            <button className="btn btn-primary" onClick={saveAttendance} disabled={saving}>
              {saving ? '⏳ Saving...' : '💾 Save Attendance'}
            </button>
          )}
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label className="form-label">Class</label>
            {classes.length > 0 ? (
              <select className="form-input" value={className} onChange={e => { setClassName(e.target.value); setFetched(false); }}>
                <option value="">— Select Class —</option>
                {classes.map(c => (
                  <option key={c._id} value={c.name}>{c.name} {c.section ? `- ${c.section}` : ''}</option>
                ))}
              </select>
            ) : (
              <input className="form-input" type="text" placeholder="e.g. Class 10"
                value={className} onChange={e => { setClassName(e.target.value); setFetched(false); }} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: '100px' }}>
            <label className="form-label">Section</label>
            <select className="form-input" value={section} onChange={e => { setSection(e.target.value); setFetched(false); }}>
              {SECTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '110px' }}>
            <label className="form-label">Month</label>
            <select className="form-input" value={viewMonth} onChange={e => setViewMonth(Number(e.target.value))}>
              {MONTHS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '90px' }}>
            <label className="form-label">Year</label>
            <input type="number" className="form-input" value={viewYear} min="2020" max="2099"
              onChange={e => setViewYear(Number(e.target.value))} />
          </div>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label className="form-label">Date</label>
            <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={loadStudentsAndAttendance} disabled={loading}>
            {loading ? '⏳ Loading...' : '📋 Load Students'}
          </button>
        </div>

        {/* Mark-All bar */}
        {isAdmin && fetched && students.length > 0 && view === 'mark' && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Mark all as:</span>
            {STATUSES.map(s => (
              <button key={s} className="btn btn-secondary"
                style={{ padding: '4px 14px', fontSize: '12px', background: STATUS_CONFIG[s].bg, color: STATUS_CONFIG[s].color, border: 'none' }}
                onClick={() => {
                  const u = {};
                  students.forEach(st => { u[st._id] = { ...attendance[st._id], status: s }; });
                  setAttendance(u);
                }}>
                {STATUS_CONFIG[s].icon} {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Legend ─── */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {v.icon} {v.label}
          </span>
        ))}
        <span>⚪ Not Marked</span>
        <span>⚫ Weekend</span>
      </div>

      {/* ─── MARK VIEW ─── */}
      {view === 'mark' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div className="loading-state">⏳ Loading students...</div>
          ) : !fetched ? (
            <div className="empty-state">
              <div style={{ fontSize: '48px' }}>📋</div>
              <div style={{ fontSize: '18px', fontWeight: '600', margin: '12px 0 4px' }}>Select Class & Date</div>
              <div style={{ color: 'var(--text-secondary)' }}>Choose a class, section, and date then click "Load Students".</div>
            </div>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '48px' }}>👨‍🎓</div>
              <div style={{ fontSize: '18px', fontWeight: '600', margin: '12px 0 4px' }}>No Students Found</div>
              <div style={{ color: 'var(--text-secondary)' }}>No students enrolled in {className} - Section {section}.</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Roll No.</th>
                    <th>Student Name</th>
                    <th>Student ID</th>
                    <th>Status</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, i) => {
                    const rec = attendance[student._id] || { status: 'Present', remarks: '' };
                    const sc  = STATUS_CONFIG[rec.status] || STATUS_CONFIG.Present;
                    return (
                      <tr key={student._id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{i + 1}</td>
                        <td style={{ fontWeight: '600' }}>{student.rollNumber || '-'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#818cf8,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                              {(student.firstName?.[0] || '?').toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600' }}>{student.firstName} {student.lastName}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{student.className} · {student.section}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-secondary)' }}>{student.studentId || '—'}</td>
                        <td>
                          {isAdmin ? (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {STATUSES.map(s => {
                                const c = STATUS_CONFIG[s];
                                const active = rec.status === s;
                                return (
                                  <button key={s} onClick={() => setAttendance(prev => ({ ...prev, [student._id]: { ...prev[student._id], status: s } }))}
                                    style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', border: '1.5px solid',
                                      background: active ? c.bg : 'transparent',
                                      color: active ? c.color : 'var(--text-muted)',
                                      borderColor: active ? c.color : 'var(--border-color)',
                                      fontWeight: active ? 700 : 400,
                                    }}>
                                    {c.icon} {s}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, background: sc.bg, color: sc.color }}>
                              {sc.icon} {rec.status}
                            </span>
                          )}
                        </td>
                        <td>
                          {isAdmin ? (
                            <input className="form-input" style={{ padding: '4px 8px', fontSize: '13px', maxWidth: '180px' }}
                              value={rec.remarks || ''}
                              onChange={e => setAttendance(prev => ({ ...prev, [student._id]: { ...prev[student._id], remarks: e.target.value } }))}
                              placeholder="Optional remarks" />
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{rec.remarks || '-'}</span>
                          )}
                        </td>
                        <td>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => loadCalendar(student, viewMonth, viewYear)}
                            title="View monthly attendance">
                            📅 Calendar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── CALENDAR VIEW ─── */}
      {view === 'calendar' && selectedStudent && (
        <CalendarView
          student={selectedStudent}
          calData={calData}
          calLoading={calLoading}
          viewMonth={viewMonth}
          viewYear={viewYear}
          isAdmin={isAdmin}
          onMonthChange={(m, y) => loadCalendar(selectedStudent, m, y)}
          setViewMonth={setViewMonth}
          setViewYear={setViewYear}
          onDayClick={openEditModal}
        />
      )}

      {/* ─── SUMMARY VIEW ─── */}
      {view === 'summary' && (
        <SummaryView
          summaryData={summaryData}
          summaryLoading={summaryLoading}
          className={className}
          section={section}
          viewMonth={viewMonth}
          viewYear={viewYear}
          summarySearch={summarySearch}
          setSummarySearch={setSummarySearch}
          onStudentClick={(s) => loadCalendar(s, viewMonth, viewYear)}
        />
      )}

      {/* ─── Edit Day Modal ─── */}
      {editModal && (
        <EditDayModal
          editModal={editModal}
          viewMonth={viewMonth}
          viewYear={viewYear}
          onClose={() => setEditModal(null)}
          onSave={saveEditModal}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   CALENDAR VIEW COMPONENT
═══════════════════════════════════════════════════════════════════════ */
const CalendarView = ({ student, calData, calLoading, viewMonth, viewYear, isAdmin, onMonthChange, setViewMonth, setViewYear, onDayClick }) => {
  const monthData = calData?.data;
  const summary   = calData?.summary;
  const calendar  = monthData?.calendar || {};
  const daysInMonth = monthData?.daysInMonth || 30;

  // Build calendar grid
  const firstDayOfMonth = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0=Sun
  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isWeekend = (day) => {
    if (!day) return false;
    const dow = new Date(viewYear, viewMonth - 1, day).getDay();
    return dow === 0 || dow === 6;
  };

  const prevMonth = () => {
    let m = viewMonth - 1, y = viewYear;
    if (m < 1) { m = 12; y--; }
    setViewMonth(m); setViewYear(y);
    onMonthChange(m, y);
  };
  const nextMonth = () => {
    let m = viewMonth + 1, y = viewYear;
    if (m > 12) { m = 1; y++; }
    setViewMonth(m); setViewYear(y);
    onMonthChange(m, y);
  };

  return (
    <div>
      {/* Student info card */}
      <div className="card" style={{ marginBottom: '20px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#818cf8,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22 }}>
            {(student.firstName?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '700' }}>{student.firstName} {student.lastName}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Roll No: {student.rollNumber || '—'} · Class {student.className} · Section {student.section}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>ID: {student.studentId || '—'}</div>
          </div>
        </div>

        {/* Summary cards */}
        {summary && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginLeft: 'auto' }}>
            {[
              { label: 'Working Days', value: summary.workingDays, color: 'var(--text-primary)' },
              { label: 'Present',      value: summary.present,    color: '#16a34a' },
              { label: 'Absent',       value: summary.absent,     color: '#dc2626' },
              { label: 'Late',         value: summary.late,       color: '#ca8a04' },
              { label: 'Leave',        value: summary.leave,      color: '#4f46e5' },
              { label: 'Attendance %', value: `${summary.percentage}%`, color: summary.percentage >= 75 ? '#16a34a' : '#dc2626' },
            ].map(c => (
              <div key={c.label} style={{ textAlign: 'center', padding: '10px 14px', background: 'var(--bg-color)', borderRadius: '10px', minWidth: '80px' }}>
                <div style={{ fontSize: '22px', fontWeight: '700', color: c.color }}>{c.value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{c.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendar card */}
      <div className="card">
        {/* Month nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button className="btn btn-secondary" onClick={prevMonth}>‹ Prev</button>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{MONTHS[viewMonth]} {viewYear}</h2>
          <button className="btn btn-secondary" onClick={nextMonth}>Next ›</button>
        </div>

        {calLoading ? (
          <div className="loading-state">⏳ Loading calendar...</div>
        ) : (
          <div>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
              {DAY_NAMES.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', padding: '6px 0', textTransform: 'uppercase' }}>{d}</div>
              ))}
            </div>
            {/* Calendar grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {cells.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />;
                const weekend = isWeekend(day);
                const rec     = calendar[day];
                const sc      = rec ? STATUS_CONFIG[rec.status] : null;
                return (
                  <div key={day}
                    onClick={() => !weekend && isAdmin && onDayClick(day, rec)}
                    style={{
                      borderRadius: '10px', padding: '8px 4px', textAlign: 'center', minHeight: '60px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      cursor: weekend ? 'default' : isAdmin ? 'pointer' : 'default',
                      background: weekend ? '#f3f4f6' : sc ? sc.bg : '#fff',
                      border: `1.5px solid ${weekend ? '#e5e7eb' : sc ? sc.color : '#e5e7eb'}`,
                      opacity: weekend ? 0.5 : 1,
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { if (!weekend && isAdmin) e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: '700', color: weekend ? 'var(--text-muted)' : sc ? sc.color : 'var(--text-secondary)' }}>{day}</span>
                    {weekend ? (
                      <span style={{ fontSize: '16px' }}>⚫</span>
                    ) : sc ? (
                      <span style={{ fontSize: '18px' }}>{sc.icon}</span>
                    ) : (
                      <span style={{ fontSize: '16px', color: 'var(--text-muted)' }}>⚪</span>
                    )}
                    {sc && !weekend && (
                      <span style={{ fontSize: '9px', color: sc.color, fontWeight: 600 }}>{sc.label}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '12px' }}>
              {Object.values(STATUS_CONFIG).map(c => (
                <span key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: c.color, fontWeight: 600 }}>
                  {c.icon} {c.label}
                </span>
              ))}
              <span style={{ color: 'var(--text-muted)' }}>⚪ Not Marked</span>
              <span style={{ color: 'var(--text-muted)' }}>⚫ Weekend</span>
              {isAdmin && <span style={{ color: 'var(--text-muted)' }}>💡 Click any weekday to mark/edit</span>}
            </div>
          </div>
        )}
      </div>

      {/* Attendance History Table */}
      {calData?.data?.calendar && Object.keys(calData.data.calendar).length > 0 && (
        <div className="card" style={{ marginTop: '24px', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', fontWeight: '600', fontSize: '15px' }}>
            📋 Attendance History — {MONTHS[viewMonth]} {viewYear}
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Day</th><th>Status</th><th>Remarks</th><th>Marked By</th></tr>
              </thead>
              <tbody>
                {Object.entries(calData.data.calendar)
                  .sort((a, b) => Number(a[0]) - Number(b[0]))
                  .map(([day, rec]) => {
                    const dt  = new Date(viewYear, viewMonth - 1, Number(day));
                    const sc  = STATUS_CONFIG[rec.status];
                    return (
                      <tr key={day}>
                        <td>{dt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{dt.toLocaleDateString('en-IN', { weekday: 'long' })}</td>
                        <td>
                          <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 600, background: sc?.bg, color: sc?.color }}>
                            {sc?.icon} {rec.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{rec.remarks || '—'}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{rec.markedBy?.name || '—'}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   SUMMARY VIEW COMPONENT
═══════════════════════════════════════════════════════════════════════ */
const SummaryView = ({ summaryData, summaryLoading, className, section, viewMonth, viewYear, summarySearch, setSummarySearch, onStudentClick }) => {
  const filtered = (summaryData || [])
    .filter(row => {
      const s = row.student;
      const name = `${s?.firstName || ''} ${s?.lastName || ''}`.toLowerCase();
      return name.includes(summarySearch.toLowerCase()) || (s?.rollNumber || '').includes(summarySearch);
    })
    .sort((a, b) => (a.student?.rollNumber || '').localeCompare(b.student?.rollNumber || ''));

  const totalPresent = (summaryData || []).reduce((s, r) => s + r.present, 0);
  const totalAbsent  = (summaryData || []).reduce((s, r) => s + r.absent, 0);

  return (
    <div>
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>
            📊 Monthly Summary — {className} (Section {section}) · {MONTHS[viewMonth]} {viewYear}
          </h2>
          <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>🟢 Total Present: {totalPresent}</span>
            <span style={{ color: '#dc2626', fontWeight: 600 }}>🔴 Total Absent: {totalAbsent}</span>
          </div>
        </div>
        <input className="form-input" placeholder="🔍 Search by name or roll number..." style={{ maxWidth: '360px' }}
          value={summarySearch} onChange={e => setSummarySearch(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {summaryLoading ? (
          <div className="loading-state">⏳ Loading summary...</div>
        ) : !summaryData ? (
          <div className="empty-state">No data available.</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No students match your search.</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th><th>Student Name</th><th>Roll No.</th><th>Student ID</th>
                  <th style={{ color: '#16a34a' }}>Present</th>
                  <th style={{ color: '#dc2626' }}>Absent</th>
                  <th style={{ color: '#ca8a04' }}>Late</th>
                  <th style={{ color: '#4f46e5' }}>Leave</th>
                  <th>Attendance %</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const s    = row.student;
                  const total = row.present + row.absent + row.late;
                  const pct   = total > 0 ? Math.round(((row.present + row.late) / total) * 100) : 0;
                  const pctColor = pct >= 75 ? '#16a34a' : pct >= 60 ? '#ca8a04' : '#dc2626';
                  return (
                    <tr key={s?._id || i}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{s?.firstName} {s?.lastName}</div>
                      </td>
                      <td style={{ fontWeight: '600' }}>{s?.rollNumber || '—'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-secondary)' }}>{s?.studentId || '—'}</td>
                      <td style={{ color: '#16a34a', fontWeight: '700' }}>{row.present}</td>
                      <td style={{ color: '#dc2626', fontWeight: '700' }}>{row.absent}</td>
                      <td style={{ color: '#ca8a04', fontWeight: '700' }}>{row.late}</td>
                      <td style={{ color: '#4f46e5', fontWeight: '700' }}>{row.leave}</td>
                      <td>
                        <span style={{ fontWeight: '700', color: pctColor }}>{pct}%</span>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => onStudentClick(s)}>
                          📅 Calendar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   EDIT DAY MODAL
═══════════════════════════════════════════════════════════════════════ */
const EditDayModal = ({ editModal, viewMonth, viewYear, onClose, onSave }) => {
  const [status,  setStatus]  = useState(editModal.record?.status || 'Present');
  const [remarks, setRemarks] = useState(editModal.record?.remarks || '');
  const [saving,  setSaving]  = useState(false);

  const dt = new Date(viewYear, viewMonth - 1, editModal.day);

  const handleSave = async () => {
    setSaving(true);
    await onSave(status, remarks);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h2>📅 {dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-color)', borderRadius: '8px' }}>
            <div style={{ fontWeight: '600' }}>{editModal.student?.firstName} {editModal.student?.lastName}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Roll No: {editModal.student?.rollNumber || '—'} · Class {editModal.student?.className} · Section {editModal.student?.section}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Attendance Status *</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {STATUSES.map(s => {
                const c = STATUS_CONFIG[s];
                return (
                  <button key={s} onClick={() => setStatus(s)}
                    style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', border: '2px solid',
                      background: status === s ? c.bg : 'transparent',
                      color: status === s ? c.color : 'var(--text-muted)',
                      borderColor: status === s ? c.color : 'var(--border-color)',
                      fontWeight: status === s ? 700 : 400,
                    }}>
                    {c.icon} {s}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Remarks (optional)</label>
            <input className="form-input" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="e.g. On time, Sick, Medical leave..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Saving...' : editModal.record ? '✅ Update' : '💾 Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
