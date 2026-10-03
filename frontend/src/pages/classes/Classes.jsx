import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const INITIAL_FORM = {
  name: '', section: 'A', academicYear: '2025-26',
  capacity: 40, teacher: '', subjects: '',
  description: '', status: 'Active',
};

const SECTIONS = ['A','B','C','D','E'];

const Classes = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [classes,    setClasses]    = useState([]);
  const [teachers,   setTeachers]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [viewClass,  setViewClass]  = useState(null);
  const [search,     setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search)       params.search = search;
      if (filterStatus) params.status = filterStatus;
      const res = await api.get('/classes', { params });
      setClasses(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch classes.');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/teachers');
      setTeachers(res.data.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, [fetchClasses]);

  const openAdd  = () => { setEditingId(null); setForm(INITIAL_FORM); setModalOpen(true); };
  const openEdit = (cls) => {
    setEditingId(cls._id);
    setForm({
      name:         cls.name || '',
      section:      cls.section || 'A',
      academicYear: cls.academicYear || '2025-26',
      capacity:     cls.capacity || 40,
      teacher:      cls.teacher?._id || cls.teacher || '',
      subjects:     Array.isArray(cls.subjects) ? cls.subjects.join(', ') : '',
      description:  cls.description || '',
      status:       cls.status || 'Active',
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
        capacity: Number(form.capacity),
        subjects: form.subjects ? form.subjects.split(',').map(s => s.trim()).filter(Boolean) : [],
        teacher:  form.teacher || null,
      };
      if (editingId) {
        await api.put(`/classes/${editingId}`, payload);
        toast.success('Class updated successfully!');
      } else {
        await api.post('/classes', payload);
        toast.success('Class created successfully!');
      }
      closeModal();
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save class.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete class "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/classes/${id}`);
      toast.success('Class deleted successfully!');
      fetchClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete class.');
    }
  };

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Class / Course Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{classes.length} class{classes.length !== 1 ? 'es' : ''} found</p>
        </div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={openAdd} id="btn-add-class">
            ➕ Add Class
          </button>
        )}
      </div>

      <div className="filters-bar">
        <input
          className="form-input search-input"
          placeholder="🔍 Search classes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option>Active</option><option>Inactive</option>
        </select>
        <button className="btn btn-secondary" onClick={fetchClasses}>Refresh</button>
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="loading-state">⏳ Loading classes...</div>
      ) : classes.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '48px' }}>🏫</div>
          <div style={{ fontSize: '18px', fontWeight: '600', margin: '12px 0 4px' }}>No Classes Found</div>
          <div style={{ color: 'var(--text-secondary)' }}>Create your first class to get started.</div>
        </div>
      ) : (
        <div className="class-grid">
          {classes.map(cls => (
            <div key={cls._id} className="class-card card">
              <div className="class-card-header">
                <div className="class-icon">🏫</div>
                <div>
                  <div className="class-name">{cls.name} — Section {cls.section}</div>
                  <div className="class-year">{cls.academicYear || 'N/A'}</div>
                </div>
                <span className={`badge ${cls.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{cls.status}</span>
              </div>

              <div className="class-meta">
                <div className="class-meta-item">
                  <span>👨‍🏫</span>
                  <span>{cls.teacher ? `${cls.teacher.firstName} ${cls.teacher.lastName}` : 'No teacher assigned'}</span>
                </div>
                <div className="class-meta-item">
                  <span>👥</span>
                  <span>Capacity: {cls.capacity}</span>
                </div>
              </div>

              {cls.subjects && cls.subjects.length > 0 && (
                <div className="class-subjects">
                  <div className="subjects-label">Subjects:</div>
                  <div className="subjects-tags">
                    {cls.subjects.map(sub => (
                      <span key={sub} className="subject-tag">{sub}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="class-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setViewClass(cls)}>👁️ View</button>
                {user?.role === 'admin' && (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(cls)}>✏️ Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(cls._id, `${cls.name} - ${cls.section}`)}>🗑️ Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Class' : 'Add New Class'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Class Name *</label>
                  <input className="form-input" value={form.name} onChange={set('name')} required placeholder="Class 10" />
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <select className="form-input" value={form.section} onChange={set('section')}>
                    {SECTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <input className="form-input" value={form.academicYear} onChange={set('academicYear')} placeholder="2025-26" />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity</label>
                  <input className="form-input" type="number" min="1" value={form.capacity} onChange={set('capacity')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Assign Teacher</label>
                <select className="form-input" value={form.teacher} onChange={set('teacher')}>
                  <option value="">No Teacher Assigned</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>{t.firstName} {t.lastName}{t.subject ? ` (${t.subject})` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subjects <small>(comma separated)</small></label>
                <input className="form-input" value={form.subjects} onChange={set('subjects')} placeholder="Mathematics, Science, English" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={set('status')}>
                    <option>Active</option><option>Inactive</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="2" value={form.description} onChange={set('description')} placeholder="Optional description" />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '⏳ Saving...' : editingId ? '✅ Update Class' : '✅ Add Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Class Modal */}
      {viewClass && (
        <div className="modal-overlay" onClick={() => setViewClass(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Class Details</h2>
              <button className="modal-close" onClick={() => setViewClass(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><span className="detail-label">Class Name</span><span>{viewClass.name}</span></div>
                <div className="detail-item"><span className="detail-label">Section</span><span>{viewClass.section}</span></div>
                <div className="detail-item"><span className="detail-label">Academic Year</span><span>{viewClass.academicYear || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Capacity</span><span>{viewClass.capacity}</span></div>
                <div className="detail-item"><span className="detail-label">Teacher</span><span>{viewClass.teacher ? `${viewClass.teacher.firstName} ${viewClass.teacher.lastName}` : 'None'}</span></div>
                <div className="detail-item"><span className="detail-label">Status</span><span className={`badge ${viewClass.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{viewClass.status}</span></div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="detail-label">Subjects</span>
                  <span>{Array.isArray(viewClass.subjects) && viewClass.subjects.length > 0 ? viewClass.subjects.join(', ') : 'None'}</span>
                </div>
              </div>
              <div className="modal-footer">
                {user?.role === 'admin' && <button className="btn btn-primary" onClick={() => { setViewClass(null); openEdit(viewClass); }}>✏️ Edit</button>}
                <button className="btn btn-secondary" onClick={() => setViewClass(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
