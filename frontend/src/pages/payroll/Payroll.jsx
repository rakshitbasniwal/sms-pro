import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getSalaries,
  getSalaryStats,
  createSalary,
  updateSalary,
  deleteSalary,
  markSalaryAsPaid,
  getTeacherSalaryHistory,
} from '../../api/salaries';
import api from '../../api/axios';

const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const PAYMENT_METHODS = ['Bank Transfer', 'Cash', 'UPI', 'Cheque', 'Other'];

const STATUS_COLORS = {
  Paid:    { bg: 'rgba(34,197,94,0.15)',  color: 'var(--success)' },
  Pending: { bg: 'rgba(239,68,68,0.15)', color: 'var(--danger)'  },
  Partial: { bg: 'rgba(251,191,36,0.15)', color: 'var(--warning)' },
};

const now = new Date();

const emptyForm = {
  teacherId:    '',
  month:        String(now.getMonth() + 1),
  year:         String(now.getFullYear()),
  monthlySalary: '',
  paidAmount:   '',
  paymentDate:  new Date().toISOString().split('T')[0],
  paymentMethod: 'Bank Transfer',
  transactionId: '',
  remarks:      '',
};

const printSalaryReceipt = (sal) => {
  const win = window.open('', '_blank', 'width=800,height=600');
  const t = sal.teacherId;
  const teacherName = t ? `${t.firstName} ${t.lastName}` : 'N/A';
  win.document.write(`<!DOCTYPE html><html><head>
    <title>Salary Payslip - ${teacherName}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
      .header h1 { margin: 0; color: #1e293b; }
      .header p { margin: 5px 0 0; color: #64748b; }
      .details { display: flex; justify-content: space-between; margin-bottom: 30px; }
      .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      .table th, .table td { padding: 12px; border: 1px solid #e2e8f0; text-align: left; }
      .table th { background: #f8fafc; }
      .footer { text-align: center; font-size: 14px; color: #64748b; margin-top: 50px; }
      @media print { button { display: none; } }
    </style>
  </head><body>
    <button onclick="window.print();window.close();" style="float:right;padding:8px 16px;cursor:pointer;background:#3b82f6;color:#fff;border:none;border-radius:6px;">🖨️ Print Payslip</button>
    <div class="header">
      <h1>SMS Pro - Salary Payslip</h1>
      <p>Pay Period: ${MONTHS[sal.month]} ${sal.year} | Date: ${new Date().toLocaleDateString('en-IN')}</p>
    </div>
    <div class="details">
      <div>
        <strong>Teacher Name:</strong> ${teacherName}<br>
        <strong>Employee ID:</strong> ${t?.teacherId || 'N/A'}<br>
        <strong>Subject:</strong> ${t?.subject || 'N/A'}
      </div>
      <div style="text-align: right;">
        <strong>Status:</strong> <span style="color:${sal.status === 'Paid' ? 'green' : 'red'};">${sal.status}</span><br>
        <strong>Payment Date:</strong> ${sal.paymentDate ? new Date(sal.paymentDate).toLocaleDateString('en-IN') : 'N/A'}<br>
        <strong>Method:</strong> ${sal.paymentMethod || 'N/A'}
      </div>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Total Salary</th>
          <th>Paid Amount</th>
          <th>Pending</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Salary for ${MONTHS[sal.month]} ${sal.year}</td>
          <td>₹${(sal.monthlySalary || 0).toLocaleString()}</td>
          <td>₹${(sal.paidAmount || 0).toLocaleString()}</td>
          <td>₹${((sal.monthlySalary || 0) - (sal.paidAmount || 0)).toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
    <div class="footer">
      <p>This is a computer generated payslip and does not require a physical signature.</p>
    </div>
  </body></html>`);
  win.document.close();
};

const Payroll = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const isAdmin   = !user?.role || user.role === 'admin';

  const [salaries,  setSalaries]  = useState([]);
  const [stats,     setStats]     = useState(null);
  const [teachers,  setTeachers]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteId,  setDeleteId]  = useState(null);
  const [markPaidId, setMarkPaidId] = useState(null);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear,  setFilterYear]  = useState(String(now.getFullYear()));
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filterMonth)   params.month    = filterMonth;
      if (filterYear)    params.year     = filterYear;
      if (filterStatus)  params.status   = filterStatus;
      if (filterTeacher) params.teacherId = filterTeacher;
      // Teachers can only see their own
      if (user?.role === 'teacher') {
        // Use teacher's linked profile — for now filter by teacher role user
        params.teacherId = filterTeacher || undefined;
      }

      const [salRes, statsRes, teachRes] = await Promise.all([
        getSalaries(params),
        isAdmin ? getSalaryStats() : Promise.resolve(null),
        isAdmin ? api.get('/teachers', { params: { limit: 200 } }) : Promise.resolve(null),
      ]);

      setSalaries(salRes.data.data || []);
      if (statsRes) setStats(statsRes.data.data);
      if (teachRes) setTeachers(teachRes.data.data || []);
    } catch (err) {
      console.error('[PAYROLL]', err);
      setError(err.response?.data?.message || err.message || 'Failed to load payroll data.');
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterYear, filterStatus, filterTeacher, isAdmin, user?.role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (sal) => {
    setEditId(sal._id);
    setForm({
      teacherId:     sal.teacherId?._id || sal.teacherId || '',
      month:         String(sal.month),
      year:          String(sal.year),
      monthlySalary: String(sal.monthlySalary),
      paidAmount:    String(sal.paidAmount),
      paymentDate:   sal.paymentDate ? sal.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
      paymentMethod: sal.paymentMethod || 'Bank Transfer',
      transactionId: sal.transactionId || '',
      remarks:       sal.remarks || '',
    });
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.teacherId || !form.month || !form.year || !form.monthlySalary) {
      setFormError('Teacher, Month, Year, and Monthly Salary are required.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        teacherId:     form.teacherId,
        month:         Number(form.month),
        year:          Number(form.year),
        monthlySalary: Number(form.monthlySalary),
        paidAmount:    Number(form.paidAmount) || 0,
        paymentDate:   form.paidAmount && Number(form.paidAmount) > 0 ? form.paymentDate : undefined,
        paymentMethod: form.paymentMethod,
        transactionId: form.transactionId || undefined,
        remarks:       form.remarks || undefined,
      };
      if (editId) {
        await updateSalary(editId, payload);
      } else {
        await createSalary(payload);
      }
      closeModal();
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to save salary record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSalary(deleteId);
      setDeleteId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const handleMarkPaid = async (id) => {
    try {
      await markSalaryAsPaid(id, { paymentDate: new Date().toISOString(), paymentMethod: 'Bank Transfer' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark as paid.');
    }
  };

  const fmt   = (n) => (n ?? 0).toLocaleString('en-IN');
  const fmtCur = (n) => `₹${fmt(n)}`;
  const teacherName = (t) => t ? `${t.firstName} ${t.lastName}` : '—';

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">💼 Payroll Management</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            ➕ Add Salary Record
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {isAdmin && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {[
            { label: 'Total Teachers',    value: fmt(stats.totalTeachers),          color: 'var(--primary-color)' },
            { label: 'Monthly Payroll',   value: fmtCur(stats.monthlyPayroll),      color: '#8b5cf6' },
            { label: 'Paid This Month',   value: fmtCur(stats.paidThisMonth),       color: 'var(--success)' },
            { label: 'Pending This Month', value: fmtCur(stats.pendingThisMonth),   color: 'var(--danger)' },
            { label: 'Total Paid (All)',   value: fmtCur(stats.totalPaidAllTime),   color: 'var(--success)' },
            { label: 'Total Pending (All)', value: fmtCur(stats.totalPendingAllTime), color: 'var(--warning)' },
          ].map((c) => (
            <div key={c.label} className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{c.label}</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="form-input" style={{ width: 'auto', minWidth: '130px' }}
            value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
            <option value="">All Months</option>
            {MONTHS.slice(1).map((m, i) => (
              <option key={i+1} value={String(i+1)}>{m}</option>
            ))}
          </select>
          <input type="number" className="form-input" placeholder="Year" style={{ width: '100px' }}
            value={filterYear} onChange={e => setFilterYear(e.target.value)} />
          <select className="form-input" style={{ width: 'auto', minWidth: '130px' }}
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Partial">Partial</option>
          </select>
          {isAdmin && (
            <select className="form-input" style={{ width: 'auto', minWidth: '180px' }}
              value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}>
              <option value="">All Teachers</option>
              {teachers.map(t => (
                <option key={t._id} value={t._id}>{teacherName(t)}</option>
              ))}
            </select>
          )}
          <button className="btn btn-secondary" onClick={fetchData}>🔍 Search</button>
          <button className="btn btn-secondary" onClick={() => {
            setFilterMonth(''); setFilterYear(String(now.getFullYear())); setFilterStatus(''); setFilterTeacher('');
          }}>↺ Reset</button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>⏳ Loading...</div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--danger)' }}>⚠️ {error}</div>
      ) : salaries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💼</div>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>No salary records found</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {isAdmin ? 'Click "Add Salary Record" to create the first payroll entry.' : 'No salary records assigned to you yet.'}
          </div>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Employee ID</th>
                  <th>Month / Year</th>
                  <th>Monthly Salary</th>
                  <th>Paid</th>
                  <th>Pending</th>
                  <th>Status</th>
                  <th>Payment Date</th>
                  <th>Method</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {salaries.map((sal) => {
                  const t = sal.teacherId;
                  const sc = STATUS_COLORS[sal.status] || STATUS_COLORS.Pending;
                  return (
                    <tr key={sal._id}>
                      <td style={{ fontWeight: '600' }}>
                        {t ? `${t.firstName} ${t.lastName}` : '—'}
                        {t?.subject && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.subject}</div>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{t?.teacherId || '—'}</td>
                      <td>{MONTHS[sal.month]} {sal.year}</td>
                      <td style={{ fontWeight: '600' }}>{fmtCur(sal.monthlySalary)}</td>
                      <td style={{ color: 'var(--success)', fontWeight: '600' }}>{fmtCur(sal.paidAmount)}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: '600' }}>{fmtCur(sal.pendingAmount)}</td>
                      <td>
                        <span className={`badge ${sal.status === 'Paid' ? 'badge-success' : sal.status === 'Pending' ? 'badge-danger' : 'badge-warning'}`}>
                          {sal.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {sal.paymentDate ? new Date(sal.paymentDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ fontSize: '13px' }}>{sal.paymentMethod || '—'}</td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button className="btn-icon" title="Print Payslip" onClick={() => printSalaryReceipt(sal)}>🖨️</button>
                            <button className="btn-icon" title="Edit" onClick={() => openEdit(sal)}>✏️</button>
                            {sal.status !== 'Paid' && (
                              <button className="btn-icon" title="Mark Paid" style={{ color: 'var(--success)' }} onClick={() => handleMarkPaid(sal._id)}>✅</button>
                            )}
                            <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => setDeleteId(sal._id)}>🗑️</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mobile-only mobile-cards-view" style={{ display: 'none' }}>
            {salaries.map((sal) => {
              const t = sal.teacherId;
              return (
                <div key={sal._id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{t ? `${t.firstName} ${t.lastName}` : '—'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t?.teacherId || '—'} | {MONTHS[sal.month]} {sal.year}</div>
                    </div>
                    <span className={`badge ${sal.status === 'Paid' ? 'badge-success' : sal.status === 'Pending' ? 'badge-danger' : 'badge-warning'}`}>
                      {sal.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Monthly Salary</div>
                      <div style={{ fontWeight: '700', fontSize: '16px' }}>{fmtCur(sal.monthlySalary)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Paid</div>
                      <div style={{ fontWeight: '600', color: 'var(--success)' }}>{fmtCur(sal.paidAmount)}</div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => printSalaryReceipt(sal)}>🖨️ Print</button>
                      {sal.status !== 'Paid' && (
                        <button className="btn btn-secondary btn-sm" style={{ flex: 1, color: 'var(--success)' }} onClick={() => handleMarkPaid(sal._id)}>✅ Mark Paid</button>
                      )}
                      <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(sal)}>✏️ Edit</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{editId ? 'Edit Salary Record' : 'Add Salary Record'}</h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: 'var(--text-secondary)' }}>×</button>
            </div>
            {formError && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: 'var(--danger)', fontSize: '14px' }}>
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Teacher *</label>
                <select className="form-input" required value={form.teacherId}
                  onChange={e => {
                    const t = teachers.find(t => t._id === e.target.value);
                    setForm(f => ({ ...f, teacherId: e.target.value, monthlySalary: t?.salary ? String(t.salary) : f.monthlySalary }));
                  }}>
                  <option value="">— Select Teacher —</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.firstName} {t.lastName} {t.teacherId ? `(${t.teacherId})` : ''}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Month *</label>
                  <select className="form-input" required value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}>
                    {MONTHS.slice(1).map((m, i) => (
                      <option key={i+1} value={String(i+1)}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Year *</label>
                  <input type="number" className="form-input" required value={form.year}
                    onChange={e => setForm(f => ({ ...f, year: e.target.value }))} min="2020" max="2099" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Monthly Salary (₹) *</label>
                  <input type="number" className="form-input" required value={form.monthlySalary} min="0"
                    onChange={e => setForm(f => ({ ...f, monthlySalary: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Paid Amount (₹)</label>
                  <input type="number" className="form-input" value={form.paidAmount} min="0"
                    onChange={e => setForm(f => ({ ...f, paidAmount: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Payment Date</label>
                  <input type="date" className="form-input" value={form.paymentDate}
                    onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Payment Method</label>
                  <select className="form-input" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Transaction / Reference ID</label>
                <input type="text" className="form-input" value={form.transactionId} placeholder="Optional"
                  onChange={e => setForm(f => ({ ...f, transactionId: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Remarks</label>
                <textarea className="form-input" rows={2} value={form.remarks} placeholder="Optional"
                  onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editId ? 'Update Record' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '400px', width: '90%', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ marginBottom: '8px' }}>Delete Salary Record?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: 'var(--danger)' }} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
