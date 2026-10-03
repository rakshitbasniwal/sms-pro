import { useState } from 'react';

const INITIAL = {
  firstName: '', lastName: '', studentId: '', rollNumber: '',
  email: '', phone: '', gender: 'Male', dateOfBirth: '',
  className: '', section: '', address: '',
  parentName: '', parentPhone: '', parentEmail: '',
  bloodGroup: '', status: 'Active',
};

const CLASSES = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7','Class 8','Class 9','Class 10','Class 11','Class 12'];
const SECTIONS = ['A','B','C','D','E'];

export default function StudentForm({ initial = {}, onSubmit, loading }) {
  const [form, setForm] = useState({ ...INITIAL, ...initial });

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form id="student-form" onSubmit={handleSubmit}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
        Personal Information
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>First Name *</label>
          <input id="s-firstName" className="form-control" value={form.firstName} onChange={set('firstName')} required placeholder="John" />
        </div>
        <div className="form-group">
          <label>Last Name *</label>
          <input id="s-lastName" className="form-control" value={form.lastName} onChange={set('lastName')} required placeholder="Doe" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Student ID</label>
          <input id="s-studentId" className="form-control" value={form.studentId} onChange={set('studentId')} placeholder="STU-001" />
        </div>
        <div className="form-group">
          <label>Roll Number</label>
          <input id="s-rollNumber" className="form-control" value={form.rollNumber} onChange={set('rollNumber')} placeholder="01" />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Gender</label>
          <select id="s-gender" className="form-control" value={form.gender} onChange={set('gender')}>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>
        <div className="form-group">
          <label>Date of Birth</label>
          <input id="s-dob" className="form-control" type="date" value={form.dateOfBirth ? form.dateOfBirth.slice(0,10) : ''} onChange={set('dateOfBirth')} />
        </div>
        <div className="form-group">
          <label>Blood Group</label>
          <select id="s-blood" className="form-control" value={form.bloodGroup} onChange={set('bloodGroup')}>
            <option value="">Select</option>
            {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Email</label>
          <input id="s-email" className="form-control" type="email" value={form.email} onChange={set('email')} placeholder="john@example.com" />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input id="s-phone" className="form-control" value={form.phone} onChange={set('phone')} placeholder="+91 9999999999" />
        </div>
      </div>
      <div className="form-group">
        <label>Address</label>
        <textarea id="s-address" className="form-control" rows="2" value={form.address} onChange={set('address')} placeholder="Full address" />
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 12px' }}>
        Academic Details
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Class</label>
          <select id="s-class" className="form-control" value={form.className} onChange={set('className')}>
            <option value="">Select Class</option>
            {CLASSES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Section</label>
          <select id="s-section" className="form-control" value={form.section} onChange={set('section')}>
            <option value="">Select Section</option>
            {SECTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select id="s-status" className="form-control" value={form.status} onChange={set('status')}>
            <option>Active</option><option>Inactive</option><option>Transferred</option>
          </select>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 12px' }}>
        Parent / Guardian Details
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Parent Name</label>
          <input id="s-parentName" className="form-control" value={form.parentName} onChange={set('parentName')} placeholder="Parent Name" />
        </div>
        <div className="form-group">
          <label>Parent Phone</label>
          <input id="s-parentPhone" className="form-control" value={form.parentPhone} onChange={set('parentPhone')} placeholder="+91 9999999999" />
        </div>
        <div className="form-group">
          <label>Parent Email</label>
          <input id="s-parentEmail" className="form-control" type="email" value={form.parentEmail} onChange={set('parentEmail')} placeholder="parent@email.com" />
        </div>
      </div>

      <div className="modal-footer" style={{ padding: '16px 0 0', border: 'none' }}>
        <button id="student-form-submit" className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Student'}
        </button>
      </div>
    </form>
  );
}
