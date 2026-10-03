import { useState } from 'react';

const INITIAL = {
  firstName: '', lastName: '', teacherId: '', email: '', phone: '',
  gender: 'Male', dateOfBirth: '', address: '', subject: '',
  qualification: '', experience: '', joiningDate: '',
  assignedClasses: '', salary: '', status: 'Active',
};

const SUBJECTS = ['Mathematics','Science','English','History','Geography','Physics','Chemistry','Biology','Computer Science','Physical Education','Arts','Music'];

export default function TeacherForm({ initial = {}, onSubmit, loading }) {
  const [form, setForm] = useState({
    ...INITIAL,
    ...initial,
    assignedClasses: Array.isArray(initial.assignedClasses) ? initial.assignedClasses.join(', ') : (initial.assignedClasses || ''),
  });

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      experience: form.experience ? Number(form.experience) : 0,
      salary: form.salary ? Number(form.salary) : 0,
      assignedClasses: form.assignedClasses ? form.assignedClasses.split(',').map(c => c.trim()).filter(Boolean) : [],
    };
    onSubmit(data);
  };

  return (
    <form id="teacher-form" onSubmit={handleSubmit}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
        Personal Information
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>First Name *</label>
          <input id="t-firstName" className="form-control" value={form.firstName} onChange={set('firstName')} required placeholder="Jane" />
        </div>
        <div className="form-group">
          <label>Last Name *</label>
          <input id="t-lastName" className="form-control" value={form.lastName} onChange={set('lastName')} required placeholder="Smith" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Teacher ID</label>
          <input id="t-teacherId" className="form-control" value={form.teacherId} onChange={set('teacherId')} placeholder="TCH-001" />
        </div>
        <div className="form-group">
          <label>Gender</label>
          <select id="t-gender" className="form-control" value={form.gender} onChange={set('gender')}>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>
        <div className="form-group">
          <label>Date of Birth</label>
          <input id="t-dob" className="form-control" type="date" value={form.dateOfBirth ? form.dateOfBirth.slice(0,10) : ''} onChange={set('dateOfBirth')} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Email</label>
          <input id="t-email" className="form-control" type="email" value={form.email} onChange={set('email')} placeholder="teacher@school.com" />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input id="t-phone" className="form-control" value={form.phone} onChange={set('phone')} placeholder="+91 9999999999" />
        </div>
      </div>
      <div className="form-group">
        <label>Address</label>
        <textarea id="t-address" className="form-control" rows="2" value={form.address} onChange={set('address')} placeholder="Full address" />
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 12px' }}>
        Professional Details
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Subject</label>
          <select id="t-subject" className="form-control" value={form.subject} onChange={set('subject')}>
            <option value="">Select Subject</option>
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Qualification</label>
          <input id="t-qualification" className="form-control" value={form.qualification} onChange={set('qualification')} placeholder="B.Ed, M.Sc etc." />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Experience (years)</label>
          <input id="t-experience" className="form-control" type="number" min="0" value={form.experience} onChange={set('experience')} placeholder="5" />
        </div>
        <div className="form-group">
          <label>Joining Date</label>
          <input id="t-joining" className="form-control" type="date" value={form.joiningDate ? form.joiningDate.slice(0,10) : ''} onChange={set('joiningDate')} />
        </div>
        <div className="form-group">
          <label>Salary</label>
          <input id="t-salary" className="form-control" type="number" min="0" value={form.salary} onChange={set('salary')} placeholder="30000" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Assigned Classes (comma-separated)</label>
          <input id="t-classes" className="form-control" value={form.assignedClasses} onChange={set('assignedClasses')} placeholder="Class 9, Class 10" />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select id="t-status" className="form-control" value={form.status} onChange={set('status')}>
            <option>Active</option><option>Inactive</option><option>On Leave</option>
          </select>
        </div>
      </div>

      <div className="modal-footer" style={{ padding: '16px 0 0', border: 'none' }}>
        <button id="teacher-form-submit" className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Teacher'}
        </button>
      </div>
    </form>
  );
}
