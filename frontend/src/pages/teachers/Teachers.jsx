import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const INITIAL_FORM = {
  firstName: '', lastName: '', teacherId: '', email: '',
  phone: '', gender: 'Male', dateOfBirth: '', qualification: '',
  subject: '', experience: '', assignedClasses: '', joiningDate: '',
  address: '', status: 'Active',
};

const SUBJECTS = ['Mathematics','Science','English','Hindi','History','Geography','Physics','Chemistry','Biology','Computer Science','Physical Education','Arts','Music','Economics','Accountancy','Other'];

const Teachers = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [teachers,   setTeachers]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [viewTeacher, setViewTeacher] = useState(null);
  const [search,     setSearch]     = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [form, setForm] = useState(INITIAL_FORM);

  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search)        params.search  = search;
      if (filterSubject) params.subject = filterSubject;
      if (filterStatus)  params.status  = filterStatus;
      const res = await api.get('/teachers', { params });
      setTeachers(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch teachers.');
    } finally {
      setLoading(false);
    }
  }, [search, filterSubject, filterStatus]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  const openAdd = () => { setEditingId(null); setForm(INITIAL_FORM); setModalOpen(true); };
  const openEdit = (teacher) => {
    setEditingId(teacher._id);
    setForm({
      firstName:      teacher.firstName || '',
      lastName:       teacher.lastName  || '',
      teacherId:      teacher.teacherId || '',
      email:          teacher.email     || '',
      phone:          teacher.phone     || '',
      gender:         teacher.gender    || 'Male',
      dateOfBirth:    teacher.dateOfBirth    ? teacher.dateOfBirth.slice(0, 10) : '',
      qualification:  teacher.qualification  || '',
      subject:        teacher.subject        || '',
      experience:     teacher.experience     !== undefined ? String(teacher.experience) : '',
      assignedClasses: Array.isArray(teacher.assignedClasses) ? teacher.assignedClasses.join(', ') : '',
      joiningDate:    teacher.joiningDate    ? teacher.joiningDate.slice(0, 10) : '',
      address:        teacher.address        || '',
      status:         teacher.status         || 'Active',
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        experience: form.experience ? Number(form.experience) : 0,
        assignedClasses: form.assignedClasses ? form.assignedClasses.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      if (editingId) {
        await api.put(`/teachers/${editingId}`, payload);
        toast.success('Teacher updated successfully!');
      } else {
        await api.post('/teachers', payload);
        toast.success('Teacher added successfully!');
      }
      closeModal();
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save teacher.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete teacher "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/teachers/${id}`);
      toast.success('Teacher deleted successfully!');
      fetchTeachers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete teacher.');
    }
  };

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Teachers Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{teachers.length} teacher{teachers.length !== 1 ? 's' : ''} found</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={openAdd} id="btn-add-teacher">
            ➕ Add Teacher
          </button>
        )}
      </div>

      <div className="filters-bar">
        <input
          id="teacher-search"
          className="form-input search-input"
          placeholder="🔍 Search by name, email, subject..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="form-input" value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
          <option value="">All Subjects</option>
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option>Active</option><option>Inactive</option><option>On Leave</option>
        </select>
        <button className="btn btn-secondary" onClick={fetchTeachers}>Refresh</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-state">⏳ Loading teachers...</div>
        ) : teachers.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '48px' }}>👨‍🏫</div>
            <div style={{ fontSize: '18px', fontWeight: '600', margin: '12px 0 4px' }}>No Teachers Found</div>
            <div style={{ color: 'var(--text-secondary)' }}>Add your first teacher to get started.</div>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Teacher ID</th>
                    <th>Subject</th>
                    <th>Qualification</th>
                    <th>Experience</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t, i) => (
                    <tr key={t._id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{i + 1}</td>
                      <td>
                        <div className="student-name-cell">
                          <div className="mini-avatar teacher-avatar">{t.firstName?.charAt(0)}{t.lastName?.charAt(0)}</div>
                          <div>
                            <div style={{ fontWeight: '600' }}>{t.firstName} {t.lastName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.phone || ''}</div>
                          </div>
                        </div>
                      </td>
                      <td>{t.teacherId || '-'}</td>
                      <td>{t.subject || '-'}</td>
                      <td>{t.qualification || '-'}</td>
                      <td>{t.experience !== undefined && t.experience !== null ? `${t.experience} yr${t.experience !== 1 ? 's' : ''}` : '-'}</td>
                      <td>{t.email || '-'}</td>
                      <td>
                        <span className={`badge ${t.status === 'Active' ? 'badge-success' : t.status === 'On Leave' ? 'badge-warning' : 'badge-danger'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn-icon" title="View" onClick={() => setViewTeacher(t)}>👁️</button>
                          {user?.role === 'admin' && (
                            <>
                              <button className="btn-icon" title="Edit" onClick={() => openEdit(t)}>✏️</button>
                              <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => handleDelete(t._id, `${t.firstName} ${t.lastName}`)}>🗑️</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-only mobile-cards-view" style={{ display: 'none' }}>
              {teachers.map((t) => (
                <div key={t._id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="student-name-cell">
                      <div className="mini-avatar teacher-avatar">{t.firstName?.charAt(0)}{t.lastName?.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '15px' }}>{t.firstName} {t.lastName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.teacherId || '-'} | {t.subject}</div>
                      </div>
                    </div>
                    <span className={`badge ${t.status === 'Active' ? 'badge-success' : t.status === 'On Leave' ? 'badge-warning' : 'badge-danger'}`}>
                      {t.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => setViewTeacher(t)}>👁️ View</button>
                    {user?.role === 'admin' && (
                      <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(t)}>✏️ Edit</button>
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
              <h2>{editingId ? 'Edit Teacher' : 'Add New Teacher'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-section-title">Personal Information</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input className="form-input" value={form.firstName} onChange={set('firstName')} required placeholder="Rajesh" />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input className="form-input" value={form.lastName} onChange={set('lastName')} required placeholder="Sharma" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Teacher ID</label>
                  <input className="form-input" value={form.teacherId} onChange={set('teacherId')} placeholder="TCH-001" />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-input" value={form.gender} onChange={set('gender')}>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={set('email')} placeholder="teacher@school.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={set('phone')} placeholder="+91 9999999999" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input className="form-input" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Joining Date</label>
                  <input className="form-input" type="date" value={form.joiningDate} onChange={set('joiningDate')} />
                </div>
              </div>

              <div className="form-section-title">Professional Details</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="form-input" value={form.subject} onChange={set('subject')}>
                    <option value="">Select Subject</option>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Qualification</label>
                  <input className="form-input" value={form.qualification} onChange={set('qualification')} placeholder="M.Sc., B.Ed." />
                </div>
                <div className="form-group">
                  <label className="form-label">Experience (Years)</label>
                  <input className="form-input" type="number" min="0" value={form.experience} onChange={set('experience')} placeholder="5" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Assigned Classes <small>(comma separated)</small></label>
                  <input className="form-input" value={form.assignedClasses} onChange={set('assignedClasses')} placeholder="Class 10, Class 11, Class 12" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={set('status')}>
                    <option>Active</option><option>Inactive</option><option>On Leave</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-input" rows="2" value={form.address} onChange={set('address')} placeholder="Full address" />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '⏳ Saving...' : editingId ? '✅ Update Teacher' : '✅ Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Teacher Modal */}
      {viewTeacher && (
        <div className="modal-overlay" onClick={() => setViewTeacher(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Teacher Details</h2>
              <button className="modal-close" onClick={() => setViewTeacher(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">Full Name</span><span>{viewTeacher.firstName} {viewTeacher.lastName}</span></div>
                <div className="detail-item"><span className="detail-label">Teacher ID</span><span>{viewTeacher.teacherId || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Email</span><span>{viewTeacher.email || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Phone</span><span>{viewTeacher.phone || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Subject</span><span>{viewTeacher.subject || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Qualification</span><span>{viewTeacher.qualification || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Experience</span><span>{viewTeacher.experience !== undefined ? `${viewTeacher.experience} years` : '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Status</span><span className={`badge ${viewTeacher.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{viewTeacher.status}</span></div>
                <div className="detail-item"><span className="detail-label">Assigned Classes</span><span>{Array.isArray(viewTeacher.assignedClasses) ? viewTeacher.assignedClasses.join(', ') || '-' : '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Joining Date</span><span>{viewTeacher.joiningDate ? new Date(viewTeacher.joiningDate).toLocaleDateString() : '-'}</span></div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}><span className="detail-label">Address</span><span>{viewTeacher.address || '-'}</span></div>
              </div>
              <div className="modal-footer">
                {user?.role === 'admin' && <button className="btn btn-primary" onClick={() => { setViewTeacher(null); openEdit(viewTeacher); }}>✏️ Edit</button>}
                <button className="btn btn-secondary" onClick={() => setViewTeacher(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
