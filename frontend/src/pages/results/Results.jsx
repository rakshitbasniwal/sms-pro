import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const GRADE_COLORS = {
  'A+': 'badge-success', A: 'badge-success', 'B+': 'badge-info', B: 'badge-info',
  C: 'badge-warning', D: 'badge-warning', F: 'badge-danger',
};

const INITIAL_FORM = {
  studentId: '', examName: '', className: '', section: '',
  examDate: '', remarks: '',
  subjects: [{ subject: '', maxMarks: 100, obtainedMarks: '' }],
};

const Results = () => {
  const { user } = useAuth();
  const toast = useToast();
  const canEdit = user?.role === 'admin' || user?.role === 'teacher';

  const [results,    setResults]    = useState([]);
  const [students,   setStudents]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [viewResult, setViewResult] = useState(null);
  const [search,     setSearch]     = useState('');
  const [filterExam,  setFilterExam]  = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);

  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search)      params.search    = search;
      if (filterExam)  params.examName  = filterExam;
      if (filterClass) params.className = filterClass;
      const res = await api.get('/results', { params });
      setResults(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch results.');
    } finally {
      setLoading(false);
    }
  }, [search, filterExam, filterClass]);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students', { params: { limit: 500 } });
      setStudents(res.data.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchResults();
    if (canEdit) fetchStudents();
  }, [fetchResults]);

  const openAdd  = () => { setEditingId(null); setForm(INITIAL_FORM); setModalOpen(true); };
  const openEdit = (result) => {
    setEditingId(result._id);
    setForm({
      studentId: result.studentId?._id || result.studentId || '',
      examName:  result.examName  || '',
      className: result.className || '',
      section:   result.section   || '',
      examDate:  result.examDate  ? result.examDate.slice(0, 10) : '',
      remarks:   result.remarks   || '',
      subjects:  result.subjects?.length > 0
        ? result.subjects.map(s => ({ subject: s.subject, maxMarks: s.maxMarks, obtainedMarks: s.obtainedMarks }))
        : [{ subject: '', maxMarks: 100, obtainedMarks: '' }],
    });
    setModalOpen(true);
  };
  const closeModal = () => { setModalOpen(false); setEditingId(null); };

  const addSubject = () => setForm(p => ({ ...p, subjects: [...p.subjects, { subject: '', maxMarks: 100, obtainedMarks: '' }] }));
  const removeSubject = (idx) => setForm(p => ({ ...p, subjects: p.subjects.filter((_, i) => i !== idx) }));
  const setSubject = (idx, field, value) => setForm(p => {
    const subs = [...p.subjects];
    subs[idx] = { ...subs[idx], [field]: value };
    return { ...p, subjects: subs };
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId) { toast.error('Please select a student.'); return; }
    if (!form.examName)  { toast.error('Exam name is required.'); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        subjects: form.subjects.map(s => ({
          subject:       s.subject,
          maxMarks:      Number(s.maxMarks),
          obtainedMarks: Number(s.obtainedMarks),
        })).filter(s => s.subject && s.obtainedMarks !== ''),
      };
      if (editingId) {
        await api.put(`/results/${editingId}`, payload);
        toast.success('Result updated successfully!');
      } else {
        await api.post('/results', payload);
        toast.success('Result added successfully!');
      }
      closeModal();
      fetchResults();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save result.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this result? This cannot be undone.')) return;
    try {
      await api.delete(`/results/${id}`);
      toast.success('Result deleted successfully!');
      fetchResults();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete result.');
    }
  };

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const CLASSES = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Exam Results</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{results.length} result{results.length !== 1 ? 's' : ''} found</p>
        </div>
        {canEdit && <button className="btn btn-primary" onClick={openAdd} id="btn-add-result">➕ Add Result</button>}
      </div>

      <div className="filters-bar">
        <input className="form-input search-input" placeholder="🔍 Search exam, student..." value={search} onChange={e => setSearch(e.target.value)} />
        <input className="form-input" placeholder="Exam name filter" value={filterExam} onChange={e => setFilterExam(e.target.value)} style={{ maxWidth: '200px' }} />
        <select className="form-input" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">All Classes</option>
          {CLASSES.map(c => <option key={c}>{c}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={fetchResults}>Refresh</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-state">⏳ Loading results...</div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: '48px' }}>🏆</div>
            <div style={{ fontSize: '18px', fontWeight: '600', margin: '12px 0 4px' }}>No Results Found</div>
            <div style={{ color: 'var(--text-secondary)' }}>{canEdit ? 'Add your first result.' : 'No results for your account.'}</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Exam</th>
                  <th>Class</th>
                  <th>Total Marks</th>
                  <th>Obtained</th>
                  <th>Percentage</th>
                  <th>Grade</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, i) => (
                  <tr key={result._id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{i + 1}</td>
                    <td style={{ fontWeight: '600' }}>
                      {result.studentId?.firstName} {result.studentId?.lastName}
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{result.studentId?.studentId}</div>
                    </td>
                    <td>{result.examName}</td>
                    <td>{result.className ? `${result.className}${result.section ? ' - ' + result.section : ''}` : '-'}</td>
                    <td>{result.totalMaxMarks ?? '-'}</td>
                    <td>{result.totalObtained ?? '-'}</td>
                    <td>{result.percentage != null ? `${result.percentage}%` : '-'}</td>
                    <td>
                      <span className={`badge ${GRADE_COLORS[result.grade] || ''}`}>{result.grade || '-'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-icon" title="View" onClick={() => setViewResult(result)}>👁️</button>
                        {canEdit && (
                          <>
                            <button className="btn-icon" title="Edit" onClick={() => openEdit(result)}>✏️</button>
                            {user?.role === 'admin' && <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => handleDelete(result._id)}>🗑️</button>}
                          </>
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
          <div className="modal-box" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Result' : 'Add Result'}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Student *</label>
                  <select className="form-input" value={form.studentId} onChange={set('studentId')} required>
                    <option value="">Select Student</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.firstName} {s.lastName}{s.className ? ` (${s.className})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Name *</label>
                  <input className="form-input" value={form.examName} onChange={set('examName')} required placeholder="Mid Term 2025" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Class</label>
                  <select className="form-input" value={form.className} onChange={set('className')}>
                    <option value="">Select</option>
                    {CLASSES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <input className="form-input" value={form.section} onChange={set('section')} placeholder="A" />
                </div>
                <div className="form-group">
                  <label className="form-label">Exam Date</label>
                  <input className="form-input" type="date" value={form.examDate} onChange={set('examDate')} />
                </div>
              </div>

              <div className="form-section-title">Subject-wise Marks</div>
              {form.subjects.map((sub, idx) => (
                <div key={idx} className="form-row" style={{ alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Subject</label>
                    <input className="form-input" value={sub.subject} onChange={e => setSubject(idx, 'subject', e.target.value)} placeholder="Mathematics" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Max Marks</label>
                    <input className="form-input" type="number" min="0" value={sub.maxMarks} onChange={e => setSubject(idx, 'maxMarks', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Obtained</label>
                    <input className="form-input" type="number" min="0" value={sub.obtainedMarks} onChange={e => setSubject(idx, 'obtainedMarks', e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 0 }}>
                    <button type="button" className="btn btn-danger" style={{ padding: '8px 10px' }} onClick={() => removeSubject(idx)} disabled={form.subjects.length === 1}>✕</button>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-secondary" onClick={addSubject} style={{ marginBottom: '16px' }}>
                ➕ Add Subject
              </button>

              <div className="form-group">
                <label className="form-label">Remarks</label>
                <textarea className="form-input" rows="2" value={form.remarks} onChange={set('remarks')} placeholder="Optional remarks" />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '⏳ Saving...' : editingId ? '✅ Update Result' : '✅ Save Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Result Modal */}
      {viewResult && (
        <div className="modal-overlay" onClick={() => setViewResult(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Result Details</h2>
              <button className="modal-close" onClick={() => setViewResult(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid" style={{ marginBottom: '20px' }}>
                <div className="detail-item"><span className="detail-label">Student</span><span>{viewResult.studentId?.firstName} {viewResult.studentId?.lastName}</span></div>
                <div className="detail-item"><span className="detail-label">Exam</span><span>{viewResult.examName}</span></div>
                <div className="detail-item"><span className="detail-label">Class</span><span>{viewResult.className || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Grade</span><span className={`badge ${GRADE_COLORS[viewResult.grade] || ''}`}>{viewResult.grade || '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Percentage</span><span style={{ fontWeight: '700', fontSize: '20px' }}>{viewResult.percentage != null ? `${viewResult.percentage}%` : '-'}</span></div>
                <div className="detail-item"><span className="detail-label">Total / Obtained</span><span>{viewResult.totalMaxMarks} / {viewResult.totalObtained}</span></div>
              </div>
              {viewResult.subjects?.length > 0 && (
                <>
                  <div className="form-section-title">Subject-wise Breakdown</div>
                  <table className="data-table">
                    <thead><tr><th>Subject</th><th>Max Marks</th><th>Obtained</th><th>%</th></tr></thead>
                    <tbody>
                      {viewResult.subjects.map((s, i) => (
                        <tr key={i}>
                          <td>{s.subject}</td>
                          <td>{s.maxMarks}</td>
                          <td style={{ fontWeight: '600' }}>{s.obtainedMarks}</td>
                          <td>{s.maxMarks ? `${Math.round((s.obtainedMarks / s.maxMarks) * 100)}%` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
              <div className="modal-footer">
                {canEdit && <button className="btn btn-primary" onClick={() => { setViewResult(null); openEdit(viewResult); }}>✏️ Edit</button>}
                <button className="btn btn-secondary" onClick={() => setViewResult(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
