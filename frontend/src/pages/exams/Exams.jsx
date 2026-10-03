import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const INITIAL_FORM = {
  title: '', examType: 'Mid Term', className: '', section: '',
  subject: '', examDate: '', startTime: '', endTime: '',
  totalMarks: 100, passingMarks: 33, academicYear: '2025-26',
  description: '', published: false,
};

const CLASSES  = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const SECTIONS = ['A','B','C','D','E'];
const SUBJECTS = ['Mathematics','Science','English','Hindi','History','Geography','Physics','Chemistry','Biology','Computer Science','Physical Education','Arts','Music','Economics','Accountancy','Other'];
const EXAM_TYPES = ['Unit Test','Mid Term','Final','Assignment','Quiz','Other'];

const Exams = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [exams,      setExams]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [search,     setSearch]     = useState('');
  const [filterClass,   setFilterClass]   = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);

  const fetchExams = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search)        params.search    = search;
      if (filterClass)   params.className = filterClass;
      if (filterSubject) params.subject   = filterSubject;
      const res = await api.get('/exams', { params });
      setExams(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch exams.');
    } finally {
      setLoading(false);
    }
  }, [search, filterClass, filterSubject]);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  const openAdd  = () => { setEditingId(null); setForm(INITIAL_FORM); setModalOpen(true); };
  const openEdit = (exam) => {
    setEditingId(exam._id);
    setForm({
      title:        exam.title || '',
      examType:     exam.examType || 'Mid Term',
      className:    exam.className || '',
      section:      exam.section || '',
      subject:      exam.subject || '',
      examDate:     exam.examDate ? exam.examDate.slice(0, 10) : '',
      startTime:    exam.startTime || '',
      endTime:      exam.endTime || '',
      totalMarks:   exam.totalMarks ?? 100,
      passingMarks: exam.passingMarks ?? 33,
      academicYear: exam.academicYear || '2025-26',
      description:  exam.description || '',
      published:    exam.published || false,
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, totalMarks: Number(form.totalMarks), passingMarks: Number(form.passingMarks) };
      if (editingId) {
        await api.put(`/exams/${editingId}`, payload);
        toast.success('Exam updated successfully!');
      } else {
        await api.post('/exams', payload);
        toast.success('Exam created successfully!');
      }
      closeModal();
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save exam.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete exam "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/exams/${id}`);
      toast.success('Exam deleted successfully!');
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete exam.');
    }
  };

  const handlePublish = async (id) => {
    try {
      const res = await api.patch(`/exams/${id}/publish`);
      toast.success(res.data.message);
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update publish status.');
    }
  };

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: field === 'published' ? e.target.checked : e.target.value }));

  const typeColors = {
    'Unit Test': 'badge-info', 'Mid Term': 'badge-warning', 'Final': 'badge-danger',
    'Assignment': 'badge-success', 'Quiz': 'badge-info', 'Other': '',
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Exam Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{exams.length} exam{exams.length !== 1 ? 's' : ''} found</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <button className="btn btn-primary" onClick={openAdd} id="btn-add-exam">
            ➕ Create Exam
          </button>
        )}
      </div>

      <div className="filters-bar">
        <input
          className="form-input search-input"
          placeholder="🔍 Search exams..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="form-input" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">All Classes</option>
          {CLASSES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="form-input" value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
          <option value="">All Subjects</option>
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={fetchExams}>Refresh</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-state">⏳ Loading exams...</div>
        ) : exams.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '48px' }}>📋</div>
            <div style={{ fontSize: '18px', fontWeight: '600', margin: '12px 0 4px' }}>No Exams Found</div>
            <div style={{ color: 'var(--text-secondary)' }}>Create your first exam to get started.</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Date</th>
                  <th>Total Marks</th>
                  <th>Passing</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {exams.map((exam, i) => (
                  <tr key={exam._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{i + 1}</td>
                    <td style={{ fontWeight: '600' }}>{exam.title}</td>
                    <td><span className={`badge ${typeColors[exam.examType] || ''}`}>{exam.examType}</span></td>
                    <td>{exam.className ? `${exam.className}${exam.section ? ' - ' + exam.section : ''}` : '-'}</td>
                    <td>{exam.subject || '-'}</td>
                    <td>{exam.examDate ? new Date(exam.examDate).toLocaleDateString() : '-'}</td>
                    <td>{exam.totalMarks}</td>
                    <td>{exam.passingMarks}</td>
                    <td>
                      <span className={`badge ${exam.published ? 'badge-success' : 'badge-warning'}`}>
                        {exam.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {(user?.role === 'admin' || user?.role === 'teacher') && (
                          <>
                            <button className="btn-icon" title="Edit" onClick={() => openEdit(exam)}>✏️</button>
                            <button
                              className="btn-icon"
                              title={exam.published ? 'Unpublish' : 'Publish'}
                              onClick={() => handlePublish(exam._id)}
                            >
                              {exam.published ? '🔒' : '🚀'}
                            </button>
                          </>
                        )}
                        {user?.role === 'admin' && (
                          <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => handleDelete(exam._id, exam.title)}>🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Exam' : 'Create New Exam'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Exam Title *</label>
                <input className="form-input" value={form.title} onChange={set('title')} required placeholder="Mid Term Examination 2025" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Exam Type</label>
                  <select className="form-input" value={form.examType} onChange={set('examType')}>
                    {EXAM_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <input className="form-input" value={form.academicYear} onChange={set('academicYear')} placeholder="2025-26" />
                </div>
              </div>
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
                    <option value="">All Sections</option>
                    {SECTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select className="form-input" value={form.subject} onChange={set('subject')}>
                    <option value="">Select Subject</option>
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Exam Date</label>
                  <input className="form-input" type="date" value={form.examDate} onChange={set('examDate')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input className="form-input" type="time" value={form.startTime} onChange={set('startTime')} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input className="form-input" type="time" value={form.endTime} onChange={set('endTime')} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Total Marks</label>
                  <input className="form-input" type="number" min="1" value={form.totalMarks} onChange={set('totalMarks')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Passing Marks</label>
                  <input className="form-input" type="number" min="0" value={form.passingMarks} onChange={set('passingMarks')} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="2" value={form.description} onChange={set('description')} placeholder="Optional description / instructions" />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="exam-published" checked={form.published} onChange={set('published')} />
                <label htmlFor="exam-published" className="form-label" style={{ margin: 0 }}>Publish immediately</label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '⏳ Saving...' : editingId ? '✅ Update Exam' : '✅ Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exams;
