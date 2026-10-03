import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getStudentReport,
  getTeacherReport,
  getFeeReport,
  getAttendanceReport,
  getResultReport,
  getClassReport,
  getSalaryReport,
} from '../../api/reports';

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const now = new Date();

/* ─── CSV Helper ─────────────────────────────────────── */
const toCSV = (rows, headers) => {
  const escape = (v) => {
    const s = String(v ?? '').replace(/"/g, '""');
    return s.includes(',') || s.includes('\n') || s.includes('"') ? `"${s}"` : s;
  };
  const lines = [headers.join(',')];
  rows.forEach(r => lines.push(headers.map((_, i) => escape(r[i])).join(',')));
  return lines.join('\n');
};

const downloadFile = (content, filename, mime) => {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

/* ─── Simple print-to-PDF helper ─────────────────────── */
const printReport = (title, tableHTML) => {
  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(`<!DOCTYPE html><html><head>
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
      h1 { font-size: 22px; margin-bottom: 4px; }
      p.sub { color: #666; font-size: 13px; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th { background: #1e293b; color: #fff; padding: 8px 10px; text-align: left; }
      td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
      tr:nth-child(even) td { background: #f8fafc; }
      @media print { button { display: none; } }
    </style>
  </head><body>
    <h1>${title}</h1>
    <p class="sub">Generated on: ${new Date().toLocaleString('en-IN')}</p>
    <button onclick="window.print();window.close();" style="margin-bottom:16px;padding:8px 16px;cursor:pointer;background:#3b82f6;color:#fff;border:none;border-radius:6px;font-size:14px;">🖨️ Print / Save as PDF</button>
    ${tableHTML}
  </body></html>`);
  win.document.close();
};

/* ─── Report configs ─────────────────────────────────── */
const REPORT_TYPES = [
  { id: 'students',   label: 'Student Report',    icon: '👨‍🎓', desc: 'All enrolled students with class, section, and status.' },
  { id: 'teachers',   label: 'Teacher Report',    icon: '👨‍🏫', desc: 'All teaching staff with subjects and employment details.' },
  { id: 'classes',    label: 'Class Report',      icon: '🏫', desc: 'All classes with teacher assignments and student count.' },
  { id: 'fees',       label: 'Fee Report',        icon: '💰', desc: 'Fee records with paid/pending amounts and statuses.' },
  { id: 'attendance', label: 'Attendance Report', icon: '📝', desc: 'Attendance records with present/absent summary.' },
  { id: 'results',    label: 'Result Report',     icon: '🏆', desc: 'Exam results with marks, percentage, and grades.' },
  { id: 'salary',     label: 'Payroll Report',    icon: '💼', desc: 'Teacher salary records with payment history.' },
];

const Reports = () => {
  const { user } = useAuth();
  const isAdmin = !user?.role || user.role === 'admin';

  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error,     setError]     = useState(null);

  // Filters
  const [filterClass,  setFilterClass]  = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFrom,   setFilterFrom]   = useState('');
  const [filterTo,     setFilterTo]     = useState('');
  const [filterMonth,  setFilterMonth]  = useState('');
  const [filterYear,   setFilterYear]   = useState(String(now.getFullYear()));

  const selectReport = (type) => {
    setSelected(type);
    setReportData(null);
    setError(null);
  };

  const fetchReport = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    setReportData(null);
    try {
      const params = {};
      if (filterClass)  params.className = filterClass;
      if (filterStatus) params.status    = filterStatus;
      if (filterFrom)   params.fromDate  = filterFrom;
      if (filterTo)     params.toDate    = filterTo;
      if (filterMonth)  params.month     = filterMonth;
      if (filterYear)   params.year      = filterYear;

      let res;
      switch (selected.id) {
        case 'students':   res = await getStudentReport(params);    break;
        case 'teachers':   res = await getTeacherReport(params);    break;
        case 'fees':       res = await getFeeReport(params);        break;
        case 'attendance': res = await getAttendanceReport(params); break;
        case 'results':    res = await getResultReport(params);     break;
        case 'classes':    res = await getClassReport(params);      break;
        case 'salary':     res = await getSalaryReport(params);     break;
        default: throw new Error('Unknown report type');
      }
      setReportData(res.data);
    } catch (err) {
      console.error('[REPORTS]', err);
      setError(err.response?.data?.message || err.message || 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Export helpers per report type ─────────────────── */
  const buildStudentRows = (data) => {
    const hdrs = ['#', 'Student ID', 'First Name', 'Last Name', 'Class', 'Section', 'Email', 'Phone', 'Gender', 'Status'];
    const rows = data.map((s, i) => [i+1, s.studentId||'', s.firstName, s.lastName, s.className||'', s.section||'', s.email||'', s.phone||'', s.gender||'', s.status||'']);
    return { hdrs, rows };
  };
  const buildTeacherRows = (data) => {
    const hdrs = ['#', 'Teacher ID', 'First Name', 'Last Name', 'Subject', 'Email', 'Phone', 'Experience', 'Status'];
    const rows = data.map((t, i) => [i+1, t.teacherId||'', t.firstName, t.lastName, t.subject||'', t.email||'', t.phone||'', t.experience||'', t.status||'']);
    return { hdrs, rows };
  };
  const buildFeeRows = (data) => {
    const hdrs = ['#', 'Student', 'Class', 'Fee Type', 'Total Amount', 'Paid', 'Pending', 'Status', 'Due Date', 'Paid Date'];
    const rows = data.map((f, i) => {
      const s = f.studentId;
      return [i+1, s ? `${s.firstName} ${s.lastName}` : '—', s?.className||'', f.feeType||'', f.amount||0, f.paidAmount||0, (f.amount - f.paidAmount)||0, f.status||'', f.dueDate ? new Date(f.dueDate).toLocaleDateString('en-IN') : '', f.paidDate ? new Date(f.paidDate).toLocaleDateString('en-IN') : ''];
    });
    return { hdrs, rows };
  };
  const buildAttRows = (data) => {
    const hdrs = ['#', 'Student', 'Roll No', 'Class', 'Section', 'Date', 'Status', 'Remarks'];
    const rows = data.map((a, i) => {
      const s = a.studentId;
      return [i+1, s ? `${s.firstName} ${s.lastName}` : '—', s?.rollNumber||'', a.className||'', a.section||'', new Date(a.date).toLocaleDateString('en-IN'), a.status||'', a.remarks||''];
    });
    return { hdrs, rows };
  };
  const buildResultRows = (data) => {
    const hdrs = ['#', 'Student', 'Class', 'Exam', 'Subject', 'Marks', 'Total', 'Percentage', 'Grade'];
    const rows = data.map((r, i) => {
      const s = r.studentId;
      return [i+1, s ? `${s.firstName} ${s.lastName}` : '—', s?.className||'', r.examId?.title||'', r.subject||'', r.marksObtained||0, r.totalMarks||0, r.percentage||0, r.grade||''];
    });
    return { hdrs, rows };
  };
  const buildClassRows = (data) => {
    const hdrs = ['#', 'Class', 'Section', 'Academic Year', 'Teacher', 'Capacity', 'Students', 'Status'];
    const rows = data.map((c, i) => {
      const t = c.teacher;
      return [i+1, c.name||'', c.section||'', c.academicYear||'', t ? `${t.firstName} ${t.lastName}` : '—', c.capacity||0, (c.students||[]).length, c.status||''];
    });
    return { hdrs, rows };
  };
  const buildSalaryRows = (data) => {
    const hdrs = ['#', 'Teacher', 'Employee ID', 'Month', 'Year', 'Monthly Salary', 'Paid', 'Pending', 'Status', 'Payment Date', 'Method'];
    const rows = data.map((s, i) => {
      const t = s.teacherId;
      return [i+1, t ? `${t.firstName} ${t.lastName}` : '—', t?.teacherId||'', MONTHS[s.month]||'', s.year||'', s.monthlySalary||0, s.paidAmount||0, s.pendingAmount||0, s.status||'', s.paymentDate ? new Date(s.paymentDate).toLocaleDateString('en-IN') : '', s.paymentMethod||''];
    });
    return { hdrs, rows };
  };

  const getRowsAndHeaders = (data) => {
    const id = selected?.id;
    if (id === 'students')   return buildStudentRows(data);
    if (id === 'teachers')   return buildTeacherRows(data);
    if (id === 'fees')       return buildFeeRows(data);
    if (id === 'attendance') return buildAttRows(data);
    if (id === 'results')    return buildResultRows(data);
    if (id === 'classes')    return buildClassRows(data);
    if (id === 'salary')     return buildSalaryRows(data);
    return { hdrs: [], rows: [] };
  };

  const exportCSV = () => {
    if (!reportData?.data?.length) return;
    const { hdrs, rows } = getRowsAndHeaders(reportData.data);
    const csv = toCSV(rows, hdrs);
    downloadFile(csv, `${selected.id}_report_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
  };

  const exportPDF = () => {
    if (!reportData?.data?.length) return;
    const { hdrs, rows } = getRowsAndHeaders(reportData.data);
    const tableHTML = `<table>
      <thead><tr>${hdrs.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>`;
    printReport(`${selected.label} — SMS Pro`, tableHTML);
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">📊 Reports & Analytics</h1>
      </div>

      {/* Report type picker */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {REPORT_TYPES.filter(r => {
          if (!isAdmin && (r.id === 'teachers' || r.id === 'salary')) return false;
          return true;
        }).map((rt) => (
          <div
            key={rt.id}
            className="card"
            onClick={() => selectReport(rt)}
            style={{
              cursor: 'pointer',
              border: selected?.id === rt.id ? '2px solid var(--primary-color)' : '1px solid rgba(255,255,255,0.08)',
              background: selected?.id === rt.id ? 'rgba(59,130,246,0.1)' : undefined,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (selected?.id !== rt.id) e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; }}
            onMouseLeave={e => { if (selected?.id !== rt.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{rt.icon}</div>
            <div style={{ fontWeight: '600', marginBottom: '6px', fontSize: '15px' }}>{rt.label}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{rt.desc}</div>
          </div>
        ))}
      </div>

      {/* Filters + Generate */}
      {selected && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>🔍 Filters — {selected.label}</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {['students', 'fees', 'attendance', 'results', 'classes'].includes(selected.id) && (
              <div>
                <label className="form-label" style={{ fontSize: '12px' }}>Class</label>
                <input type="text" className="form-input" placeholder="e.g. 10" style={{ width: '100px' }}
                  value={filterClass} onChange={e => setFilterClass(e.target.value)} />
              </div>
            )}
            {['students', 'teachers', 'fees', 'classes'].includes(selected.id) && (
              <div>
                <label className="form-label" style={{ fontSize: '12px' }}>Status</label>
                <select className="form-input" style={{ width: '130px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">All</option>
                  {selected.id === 'fees'
                    ? ['Paid', 'Pending', 'Overdue', 'Partial'].map(s => <option key={s}>{s}</option>)
                    : selected.id === 'salary'
                    ? ['Paid', 'Pending', 'Partial'].map(s => <option key={s}>{s}</option>)
                    : ['Active', 'Inactive'].map(s => <option key={s}>{s}</option>)
                  }
                </select>
              </div>
            )}
            {['fees', 'attendance'].includes(selected.id) && (
              <>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>From Date</label>
                  <input type="date" className="form-input" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>To Date</label>
                  <input type="date" className="form-input" value={filterTo} onChange={e => setFilterTo(e.target.value)} />
                </div>
              </>
            )}
            {selected.id === 'salary' && (
              <>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>Month</label>
                  <select className="form-input" style={{ width: '130px' }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                    <option value="">All</option>
                    {MONTHS.slice(1).map((m, i) => <option key={i+1} value={String(i+1)}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '12px' }}>Year</label>
                  <input type="number" className="form-input" style={{ width: '90px' }} value={filterYear} onChange={e => setFilterYear(e.target.value)} />
                </div>
              </>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary" onClick={fetchReport} disabled={loading}>
                {loading ? '⏳ Generating...' : `📊 Generate ${selected.label}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', padding: '20px', marginBottom: '24px', color: 'var(--danger)' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Report Table */}
      {reportData && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <span style={{ fontWeight: '600', fontSize: '16px' }}>{selected.label}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginLeft: '12px' }}>
                {reportData.total} record{reportData.total !== 1 ? 's' : ''}
              </span>
              {reportData.summary && (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {Object.entries(reportData.summary).map(([k, v]) => (
                    <span key={k} style={{ marginRight: '16px' }}>
                      {k.replace(/([A-Z])/g, ' $1').trim()}: <strong>{typeof v === 'number' && k.toLowerCase().includes('amount') ? `₹${v.toLocaleString('en-IN')}` : typeof v === 'number' ? v : v}</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={exportCSV} disabled={!reportData.data?.length}>
                📥 Export CSV
              </button>
              <button className="btn btn-primary" onClick={exportPDF} disabled={!reportData.data?.length}>
                🖨️ Print / PDF
              </button>
            </div>
          </div>

          {!reportData.data?.length ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <div style={{ fontWeight: '500' }}>No records found with the selected filters.</div>
            </div>
          ) : (
            <ReportTable reportId={selected.id} data={reportData.data} />
          )}
        </div>
      )}

      {!selected && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👆</div>
          <div style={{ fontWeight: '500' }}>Select a report type above to get started</div>
        </div>
      )}
    </div>
  );
};

/* ─── Render table by report type ─── */
const ReportTable = ({ reportId, data }) => {
  const fmt = (n) => (n ?? 0).toLocaleString('en-IN');

  if (reportId === 'students') return (
    <div className="table-container">
      <table className="data-table">
        <thead><tr><th>#</th><th>Student ID</th><th>Name</th><th>Class</th><th>Section</th><th>Email</th><th>Phone</th><th>Gender</th><th>Status</th></tr></thead>
        <tbody>
          {data.map((s, i) => (
            <tr key={s._id}>
              <td>{i+1}</td><td style={{ fontFamily: 'monospace' }}>{s.studentId||'—'}</td>
              <td style={{ fontWeight: '600' }}>{s.firstName} {s.lastName}</td>
              <td>{s.className||'—'}</td><td>{s.section||'—'}</td>
              <td>{s.email||'—'}</td><td>{s.phone||'—'}</td><td>{s.gender||'—'}</td>
              <td><StatusBadge status={s.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (reportId === 'teachers') return (
    <div className="table-container">
      <table className="data-table">
        <thead><tr><th>#</th><th>Teacher ID</th><th>Name</th><th>Subject</th><th>Email</th><th>Phone</th><th>Experience</th><th>Monthly Salary</th><th>Status</th></tr></thead>
        <tbody>
          {data.map((t, i) => (
            <tr key={t._id}>
              <td>{i+1}</td><td style={{ fontFamily: 'monospace' }}>{t.teacherId||'—'}</td>
              <td style={{ fontWeight: '600' }}>{t.firstName} {t.lastName}</td>
              <td>{t.subject||'—'}</td><td>{t.email||'—'}</td><td>{t.phone||'—'}</td>
              <td>{t.experience ? `${t.experience} yr` : '—'}</td>
              <td>{t.salary ? `₹${fmt(t.salary)}` : '—'}</td>
              <td><StatusBadge status={t.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (reportId === 'fees') return (
    <div className="table-container">
      <table className="data-table">
        <thead><tr><th>#</th><th>Student</th><th>Class</th><th>Fee Type</th><th>Total</th><th>Paid</th><th>Pending</th><th>Status</th><th>Due Date</th><th>Paid Date</th></tr></thead>
        <tbody>
          {data.map((f, i) => {
            const s = f.studentId;
            return (
              <tr key={f._id}>
                <td>{i+1}</td>
                <td style={{ fontWeight: '600' }}>{s ? `${s.firstName} ${s.lastName}` : '—'}</td>
                <td>{s?.className||'—'}</td><td>{f.feeType||'—'}</td>
                <td>₹{fmt(f.amount)}</td>
                <td style={{ color: 'var(--success)', fontWeight: '600' }}>₹{fmt(f.paidAmount)}</td>
                <td style={{ color: 'var(--danger)', fontWeight: '600' }}>₹{fmt(f.amount - f.paidAmount)}</td>
                <td><StatusBadge status={f.status} /></td>
                <td>{f.dueDate ? new Date(f.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                <td>{f.paidDate ? new Date(f.paidDate).toLocaleDateString('en-IN') : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (reportId === 'attendance') return (
    <div className="table-container">
      <table className="data-table">
        <thead><tr><th>#</th><th>Student</th><th>Roll No</th><th>Class</th><th>Section</th><th>Date</th><th>Status</th><th>Remarks</th></tr></thead>
        <tbody>
          {data.map((a, i) => {
            const s = a.studentId;
            return (
              <tr key={a._id}>
                <td>{i+1}</td>
                <td style={{ fontWeight: '600' }}>{s ? `${s.firstName} ${s.lastName}` : '—'}</td>
                <td>{s?.rollNumber||'—'}</td><td>{a.className||'—'}</td><td>{a.section||'—'}</td>
                <td>{new Date(a.date).toLocaleDateString('en-IN')}</td>
                <td><StatusBadge status={a.status} /></td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{a.remarks||'—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (reportId === 'results') return (
    <div className="table-container">
      <table className="data-table">
        <thead><tr><th>#</th><th>Student</th><th>Class</th><th>Exam</th><th>Subject</th><th>Marks</th><th>Total</th><th>%</th><th>Grade</th></tr></thead>
        <tbody>
          {data.map((r, i) => {
            const s = r.studentId;
            return (
              <tr key={r._id}>
                <td>{i+1}</td>
                <td style={{ fontWeight: '600' }}>{s ? `${s.firstName} ${s.lastName}` : '—'}</td>
                <td>{s?.className||'—'}</td>
                <td>{r.examId?.title||'—'}</td><td>{r.subject||'—'}</td>
                <td>{r.marksObtained}</td><td>{r.totalMarks}</td>
                <td>{r.percentage}%</td>
                <td style={{ fontWeight: '700', color: r.grade === 'A' || r.grade === 'A+' ? 'var(--success)' : r.grade === 'F' ? 'var(--danger)' : undefined }}>{r.grade||'—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (reportId === 'classes') return (
    <div className="table-container">
      <table className="data-table">
        <thead><tr><th>#</th><th>Class</th><th>Section</th><th>Academic Year</th><th>Teacher</th><th>Capacity</th><th>Students</th><th>Status</th></tr></thead>
        <tbody>
          {data.map((c, i) => {
            const t = c.teacher;
            return (
              <tr key={c._id}>
                <td>{i+1}</td>
                <td style={{ fontWeight: '600' }}>{c.name||'—'}</td>
                <td>{c.section||'—'}</td><td>{c.academicYear||'—'}</td>
                <td>{t ? `${t.firstName} ${t.lastName}` : '—'}</td>
                <td>{c.capacity||0}</td><td>{(c.students||[]).length}</td>
                <td><StatusBadge status={c.status} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (reportId === 'salary') return (
    <div className="table-container">
      <table className="data-table">
        <thead><tr><th>#</th><th>Teacher</th><th>ID</th><th>Month/Year</th><th>Salary</th><th>Paid</th><th>Pending</th><th>Status</th><th>Payment Date</th><th>Method</th></tr></thead>
        <tbody>
          {data.map((s, i) => {
            const t = s.teacherId;
            const MONTHS_FULL = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return (
              <tr key={s._id}>
                <td>{i+1}</td>
                <td style={{ fontWeight: '600' }}>{t ? `${t.firstName} ${t.lastName}` : '—'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{t?.teacherId||'—'}</td>
                <td>{MONTHS_FULL[s.month]} {s.year}</td>
                <td style={{ fontWeight: '600' }}>₹{fmt(s.monthlySalary)}</td>
                <td style={{ color: 'var(--success)', fontWeight: '600' }}>₹{fmt(s.paidAmount)}</td>
                <td style={{ color: 'var(--danger)', fontWeight: '600' }}>₹{fmt(s.pendingAmount)}</td>
                <td>
                  <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600',
                    background: s.status === 'Paid' ? 'rgba(34,197,94,0.15)' : s.status === 'Partial' ? 'rgba(251,191,36,0.15)' : 'rgba(239,68,68,0.15)',
                    color: s.status === 'Paid' ? 'var(--success)' : s.status === 'Partial' ? 'var(--warning)' : 'var(--danger)',
                  }}>{s.status}</span>
                </td>
                <td style={{ fontSize: '13px' }}>{s.paymentDate ? new Date(s.paymentDate).toLocaleDateString('en-IN') : '—'}</td>
                <td style={{ fontSize: '13px' }}>{s.paymentMethod||'—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return <div style={{ padding: '24px', color: 'var(--text-muted)' }}>Unknown report type.</div>;
};

const StatusBadge = ({ status }) => {
  const map = {
    Active:   { bg: 'rgba(34,197,94,0.15)',  color: 'var(--success)' },
    Inactive: { bg: 'rgba(239,68,68,0.15)', color: 'var(--danger)'  },
    Paid:     { bg: 'rgba(34,197,94,0.15)',  color: 'var(--success)' },
    Pending:  { bg: 'rgba(239,68,68,0.15)', color: 'var(--danger)'  },
    Overdue:  { bg: 'rgba(239,68,68,0.15)', color: 'var(--danger)'  },
    Partial:  { bg: 'rgba(251,191,36,0.15)', color: 'var(--warning)' },
    Present:  { bg: 'rgba(34,197,94,0.15)',  color: 'var(--success)' },
    Absent:   { bg: 'rgba(239,68,68,0.15)', color: 'var(--danger)'  },
    Late:     { bg: 'rgba(251,191,36,0.15)', color: 'var(--warning)' },
  };
  const style = map[status] || { bg: 'rgba(100,100,100,0.15)', color: 'var(--text-secondary)' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600', background: style.bg, color: style.color }}>
      {status || '—'}
    </span>
  );
};

export default Reports;
