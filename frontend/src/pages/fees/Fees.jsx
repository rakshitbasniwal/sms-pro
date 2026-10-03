import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const INITIAL_FORM = {
  studentId: '', feeType: 'Tuition', amount: '',
  dueDate: '', paidDate: '', status: 'Pending',
  paidAmount: 0, description: '', receiptNo: '',
};

const FEE_TYPES = ['Tuition','Transport','Library','Laboratory','Examination','Sports','Hostel','Other'];

const printFeeReceipt = (fee) => {
  const win = window.open('', '_blank', 'width=800,height=600');
  const s = fee.studentId;
  const studentName = s ? `${s.firstName} ${s.lastName}` : 'N/A';
  win.document.write(`<!DOCTYPE html><html><head>
    <title>Fee Receipt - ${studentName}</title>
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
    <button onclick="window.print();window.close();" style="float:right;padding:8px 16px;cursor:pointer;background:#3b82f6;color:#fff;border:none;border-radius:6px;">🖨️ Print Receipt</button>
    <div class="header">
      <h1>SMS Pro - Fee Receipt</h1>
      <p>Receipt No: ${fee.receiptNo || 'N/A'} | Date: ${new Date().toLocaleDateString('en-IN')}</p>
    </div>
    <div class="details">
      <div>
        <strong>Student Name:</strong> ${studentName}<br>
        <strong>Class:</strong> ${s?.className || 'N/A'}<br>
        <strong>Student ID:</strong> ${s?.studentId || 'N/A'}
      </div>
      <div style="text-align: right;">
        <strong>Status:</strong> <span style="color:${fee.status === 'Paid' ? 'green' : 'red'};">${fee.status}</span><br>
        <strong>Due Date:</strong> ${fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-IN') : 'N/A'}<br>
        <strong>Paid Date:</strong> ${fee.paidDate ? new Date(fee.paidDate).toLocaleDateString('en-IN') : 'N/A'}
      </div>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>Fee Type</th>
          <th>Total Amount</th>
          <th>Paid Amount</th>
          <th>Pending</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${fee.feeType}</td>
          <td>₹${(fee.amount || 0).toLocaleString()}</td>
          <td>₹${(fee.paidAmount || 0).toLocaleString()}</td>
          <td>₹${((fee.amount || 0) - (fee.paidAmount || 0)).toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
    <div class="footer">
      <p>This is a computer generated receipt and does not require a physical signature.</p>
    </div>
  </body></html>`);
  win.document.close();
};

const Fees = () => {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role === 'admin';

  const [fees,       setFees]       = useState([]);
  const [students,   setStudents]   = useState([]);
  const [stats,      setStats]      = useState({ total: 0, paid: 0, pending: 0, count: 0 });
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [filterStatus,    setFilterStatus]    = useState('');
  const [filterStudentId, setFilterStudentId] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus)    params.status    = filterStatus;
      if (filterStudentId) params.studentId = filterStudentId;

      // Students can only see their own fees — backend filters by role
      const [feeRes, statsRes] = await Promise.all([
        api.get('/fees', { params }),
        api.get('/fees/stats'),
      ]);
      setFees(feeRes.data.data || []);
      setStats(statsRes.data.data || { total: 0, paid: 0, pending: 0, count: 0 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch fee records.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterStudentId]);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students', { params: { limit: 500 } });
      setStudents(res.data.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchData();
    if (isAdmin) fetchStudents();
  }, [fetchData]);

  const openAdd  = () => { setEditingId(null); setForm(INITIAL_FORM); setModalOpen(true); };
  const openEdit = (fee) => {
    setEditingId(fee._id);
    setForm({
      studentId:   fee.studentId?._id || fee.studentId || '',
      feeType:     fee.feeType     || 'Tuition',
      amount:      fee.amount      || '',
      dueDate:     fee.dueDate     ? fee.dueDate.slice(0, 10) : '',
      paidDate:    fee.paidDate    ? fee.paidDate.slice(0, 10) : '',
      status:      fee.status      || 'Pending',
      paidAmount:  fee.paidAmount  || 0,
      description: fee.description || '',
      receiptNo:   fee.receiptNo   || '',
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId) { toast.error('Please select a student.'); return; }
    if (!form.amount)    { toast.error('Amount is required.'); return; }
    setSubmitting(true);
    try {
      const payload = { ...form, amount: Number(form.amount), paidAmount: Number(form.paidAmount) };
      if (editingId) {
        await api.put(`/fees/${editingId}`, payload);
        toast.success('Fee record updated successfully!');
      } else {
        await api.post('/fees', payload);
        toast.success('Fee record added successfully!');
      }
      closeModal();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save fee record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fee record? This cannot be undone.')) return;
    try {
      await api.delete(`/fees/${id}`);
      toast.success('Fee record deleted successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete fee record.');
    }
  };

  const markPaid = async (fee) => {
    try {
      await api.put(`/fees/${fee._id}`, { status: 'Paid', paidAmount: fee.amount, paidDate: new Date().toISOString() });
      toast.success('Fee marked as paid!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payment status.');
    }
  };

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fee Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{fees.length} record{fees.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={openAdd} id="btn-add-fee">➕ Add Fee</button>}
      </div>

      {/* Stats Cards */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Fee Amount</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--primary-color)' }}>₹{stats.total?.toLocaleString()}</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Collected</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--success)' }}>₹{stats.paid?.toLocaleString()}</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Pending</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--warning)' }}>₹{stats.pending?.toLocaleString()}</div>
          </div>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Records</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--secondary-color)' }}>{stats.count}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option>Paid</option><option>Pending</option><option>Overdue</option><option>Partial</option>
        </select>
        <button className="btn btn-secondary" onClick={fetchData}>Refresh</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-state">⏳ Loading fee records...</div>
        ) : fees.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '48px' }}>💰</div>
            <div style={{ fontSize: '18px', fontWeight: '600', margin: '12px 0 4px' }}>No Fee Records Found</div>
            <div style={{ color: 'var(--text-secondary)' }}>{isAdmin ? 'Add your first fee record.' : 'No fee records for your account.'}</div>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Fee Type</th>
                    <th>Amount</th>
                    <th>Paid Amount</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Paid Date</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {fees.map((fee, i) => (
                    <tr key={fee._id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{i + 1}</td>
                      <td style={{ fontWeight: '600' }}>
                        {fee.studentId?.firstName} {fee.studentId?.lastName}
                        {fee.studentId?.className && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fee.studentId.className}</div>}
                      </td>
                      <td>{fee.feeType}</td>
                      <td style={{ fontWeight: '600' }}>₹{fee.amount?.toLocaleString()}</td>
                      <td>₹{fee.paidAmount?.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${fee.status === 'Paid' ? 'badge-success' : fee.status === 'Pending' ? 'badge-warning' : fee.status === 'Overdue' ? 'badge-danger' : 'badge-info'}`}>
                          {fee.status}
                        </span>
                      </td>
                      <td>{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '-'}</td>
                      <td>{fee.paidDate ? new Date(fee.paidDate).toLocaleDateString() : '-'}</td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn-icon" title="Print Receipt" onClick={() => printFeeReceipt(fee)}>🖨️</button>
                            {fee.status !== 'Paid' && <button className="btn-icon" title="Mark Paid" onClick={() => markPaid(fee)} style={{ color: 'var(--success)' }}>✅</button>}
                            <button className="btn-icon" title="Edit" onClick={() => openEdit(fee)}>✏️</button>
                            <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => handleDelete(fee._id)}>🗑️</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-only mobile-cards-view" style={{ display: 'none' }}>
              {fees.map((fee) => (
                <div key={fee._id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '15px' }}>{fee.studentId?.firstName} {fee.studentId?.lastName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{fee.feeType} | {fee.studentId?.className}</div>
                    </div>
                    <span className={`badge ${fee.status === 'Paid' ? 'badge-success' : fee.status === 'Pending' ? 'badge-warning' : fee.status === 'Overdue' ? 'badge-danger' : 'badge-info'}`}>
                      {fee.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Amount</div>
                      <div style={{ fontWeight: '700', fontSize: '16px' }}>₹{fee.amount?.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Paid</div>
                      <div style={{ fontWeight: '600', color: 'var(--success)' }}>₹{fee.paidAmount?.toLocaleString()}</div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => printFeeReceipt(fee)}>🖨️ Print</button>
                      {fee.status !== 'Paid' && (
                        <button className="btn btn-secondary btn-sm" style={{ flex: 1, color: 'var(--success)' }} onClick={() => markPaid(fee)}>✅ Mark Paid</button>
                      )}
                      <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(fee)}>✏️ Edit</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Fee Record' : 'Add Fee Record'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Student *</label>
                <select className="form-input" value={form.studentId} onChange={set('studentId')} required>
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.firstName} {s.lastName}{s.className ? ` (${s.className}${s.section ? ' - ' + s.section : ''})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Fee Type</label>
                  <select className="form-input" value={form.feeType} onChange={set('feeType')}>
                    {FEE_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input className="form-input" type="number" min="0" value={form.amount} onChange={set('amount')} required placeholder="5000" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={set('status')}>
                    <option>Pending</option><option>Paid</option><option>Overdue</option><option>Partial</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Paid Amount (₹)</label>
                  <input className="form-input" type="number" min="0" value={form.paidAmount} onChange={set('paidAmount')} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={form.dueDate} onChange={set('dueDate')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Paid Date</label>
                  <input className="form-input" type="date" value={form.paidDate} onChange={set('paidDate')} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Receipt No.</label>
                  <input className="form-input" value={form.receiptNo} onChange={set('receiptNo')} placeholder="RCP-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" value={form.description} onChange={set('description')} placeholder="Optional note" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '⏳ Saving...' : editingId ? '✅ Update Fee' : '✅ Add Fee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fees;
