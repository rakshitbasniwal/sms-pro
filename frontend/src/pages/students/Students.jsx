import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const INITIAL_FORM = {
  firstName: '', lastName: '', studentId: '', rollNumber: '',
  email: '', phone: '', gender: 'Male', dateOfBirth: '',
  className: '', section: '', address: '',
  parentName: '', parentPhone: '', admissionDate: '',
  status: 'Active',
};

const CLASSES  = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const SECTIONS = ['A','B','C','D','E'];

const Students = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [students,   setStudents]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [search,     setSearch]     = useState('');
  const [filterClass,   setFilterClass]   = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [form, setForm] = useState(INITIAL_FORM);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search)        params.search   = search;
      if (filterClass)   params.className = filterClass;
      if (filterSection) params.section  = filterSection;
      if (filterStatus)  params.status   = filterStatus;
      const res = await api.get('/students', { params });
      setStudents(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch students.');
    } finally {
      setLoading(false);
    }
  }, [search, filterClass, filterSection, filterStatus]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const openAdd = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setModalOpen(true);
  };

  const openEdit = (student) => {
    setEditingId(student._id);
    setForm({
      firstName:     student.firstName || '',
      lastName:      student.lastName  || '',
      studentId:     student.studentId || '',
      rollNumber:    student.rollNumber || '',
      email:         student.email     || '',
      phone:         student.phone     || '',
      gender:        student.gender    || 'Male',
      dateOfBirth:   student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '',
      className:     student.className  || '',
      section:       student.section   || '',
      address:       student.address   || '',
      parentName:    student.parentName  || '',
      parentPhone:   student.parentPhone || '',
      admissionDate: student.admissionDate ? student.admissionDate.slice(0, 10) : '',
      status:        student.status    || 'Active',
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/students/${editingId}`, form);
        toast.success('Student updated successfully!');
      } else {
        await api.post('/students', form);
        toast.success('Student added successfully!');
      }
      closeModal();
      fetchStudents();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save student.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete student "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student deleted successfully!');
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student.');
    }
  };

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="page-container animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Students Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {students.length} student{students.length !== 1 ? 's' : ''} found
          </p>
        </div>
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <button className="btn btn-primary" onClick={openAdd} id="btn-add-student">
            ➕ Add Student
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="filters-bar">
        <input
          id="student-search"
          className="form-input search-input"
          placeholder="🔍 Search by name, email, ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select id="filter-class"   className="form-input" value={filterClass}   onChange={e => setFilterClass(e.target.value)}>
          <option value="">All Classes</option>
          {CLASSES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select id="filter-section" className="form-input" value={filterSection} onChange={e => setFilterSection(e.target.value)}>
          <option value="">All Sections</option>
          {SECTIONS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select id="filter-status"  className="form-input" value={filterStatus}  onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option>Active</option><option>Inactive</option><option>Transferred</option>
        </select>
        <button className="btn btn-secondary" onClick={fetchStudents}>Refresh</button>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="loading-state">⏳ Loading students...</div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '48px' }}>👨‍🎓</div>
            <div style={{ fontSize: '18px', fontWeight: '600', margin: '12px 0 4px' }}>No Students Found</div>
            <div style={{ color: 'var(--text-secondary)' }}>Add your first student to get started.</div>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Student ID</th>
                    <th>Roll No.</th>
                    <th>Class / Section</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s._id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{i + 1}</td>
                      <td>
                        <div className="student-name-cell">
                          <div className="mini-avatar">{s.firstName?.charAt(0)}{s.lastName?.charAt(0)}</div>
                          <div>
                            <div style={{ fontWeight: '600' }}>{s.firstName} {s.lastName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.gender}</div>
                          </div>
                        </div>
                      </td>
                      <td>{s.studentId || '-'}</td>
                      <td>{s.rollNumber || '-'}</td>
                      <td>{s.className ? `${s.className}${s.section ? ' - ' + s.section : ''}` : '-'}</td>
                      <td>{s.email || '-'}</td>
                      <td>{s.phone || '-'}</td>
                      <td>
                        <span className={`badge ${s.status === 'Active' ? 'badge-success' : s.status === 'Inactive' ? 'badge-warning' : 'badge-danger'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn-icon" title="View" onClick={() => setViewStudent(s)}>👁️</button>
                          {(user?.role === 'admin' || user?.role === 'teacher') && (
                            <button className="btn-icon" title="Edit" onClick={() => openEdit(s)}>✏️</button>
                          )}
                          {user?.role === 'admin' && (
                            <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => handleDelete(s._id, `${s.firstName} ${s.lastName}`)}>🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-only mobile-cards-view" style={{ display: 'none' }}>
              {students.map((s) => (
                <div key={s._id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="student-name-cell">
                      <div className="mini-avatar">{s.firstName?.charAt(0)}{s.lastName?.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '15px' }}>{s.firstName} {s.lastName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.studentId || '-'} | {s.className} {s.section}</div>
                      </div>
                    </div>
                    <span className={`badge ${s.status === 'Active' ? 'badge-success' : s.status === 'Inactive' ? 'badge-warning' : 'badge-danger'}`}>
                      {s.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setViewStudent(s)}>👁️ View</button>
                    {(user?.role === 'admin' || user?.role === 'teacher') && (
                      <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(s)}>✏️ Edit</button>
                    )}
                  </div>
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
              <h2>{editingId ? 'Edit Student' : 'Add New Student'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-section-title">Personal Information</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input className="form-input" value={form.firstName} onChange={set('firstName')} required placeholder="John" />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input className="form-input" value={form.lastName} onChange={set('lastName')} required placeholder="Doe" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Student ID</label>
                  <input className="form-input" value={form.studentId} onChange={set('studentId')} placeholder="STU-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Roll Number</label>
                  <input className="form-input" value={form.rollNumber} onChange={set('rollNumber')} placeholder="01" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="john@email.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={set('phone')} placeholder="+91 9999999999" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={form.gender} onChange={set('gender')}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input className="form-input" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-input" rows="2" value={form.address} onChange={set('address')} placeholder="Full address" />
              </div>

              <div className="form-section-title">Academic Details</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <select className="form-input" value={form.className} onChange={set('className')}>
                    <option value="">Select Class</option>
                    {CLASSES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <select className="form-input" value={form.section} onChange={set('section')}>
                    <option value="">Select Section</option>
                    {SECTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={set('status')}>
                    <option>Active</option><option>Inactive</option><option>Transferred</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Admission Date</label>
                <input className="form-input" type="date" value={form.admissionDate} onChange={set('admissionDate')} />
              </div>

              <div className="form-section-title">Parent / Guardian Details</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Parent Name</label>
                  <input className="form-input" value={form.parentName} onChange={set('parentName')} placeholder="Parent Name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Phone</label>
                  <input className="form-input" value={form.parentPhone} onChange={set('parentPhone')} placeholder="+91 9999999999" />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '⏳ Saving...' : editingId ? '✅ Update Student' : '✅ Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {viewStudent && (
        <div className="modal-overlay" onClick={() => setViewStudent(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Student Details</h2>
              <button className="modal-close" onClick={() => setViewStudent(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">Full Name</span><span>{viewStudent.firstName} {viewStudent.lastName}</span></div>
                <div className="detail-item"><span className="detail-label">Student ID</span><span>{viewStudent.studentId || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Roll Number</span><span>{viewStudent.rollNumber || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Email</span><span>{viewStudent.email || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Phone</span><span>{viewStudent.phone || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Gender</span><span>{viewStudent.gender || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Date of Birth</span><span>{viewStudent.dateOfBirth ? new Date(viewStudent.dateOfBirth).toLocaleDateString() : '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Class</span><span>{viewStudent.className || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Section</span><span>{viewStudent.section || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Status</span><span className={`badge ${viewStudent.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{viewStudent.status}</span></div>
                <div className="detail-item"><span className="detail-label">Parent Name</span><span>{viewStudent.parentName || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Parent Phone</span><span>{viewStudent.parentPhone || '-'}</span></div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}><span className="detail-label">Address</span><span>{viewStudent.address || '-'}</span></div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={() => { setViewStudent(null); openEdit(viewStudent); }}>✏️ Edit</button>
                <button className="btn btn-secondary" onClick={() => setViewStudent(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
