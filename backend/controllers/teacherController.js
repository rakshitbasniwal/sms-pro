const Teacher  = require('../models/Teacher');
const Activity = require('../models/Activity');

/**
 * GET /api/teachers
 * Query: search, subject, status, page, limit
 */
const getTeachers = async (req, res) => {
  try {
    const { search, subject, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (status)  filter.status  = status;
    if (search) {
      filter.$or = [
        { firstName:  { $regex: search, $options: 'i' } },
        { lastName:   { $regex: search, $options: 'i' } },
        { email:      { $regex: search, $options: 'i' } },
        { teacherId:  { $regex: search, $options: 'i' } },
        { subject:    { $regex: search, $options: 'i' } },
      ];
    }
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Teacher.countDocuments(filter);
    const teachers = await Teacher.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    res.json({ success: true, data: teachers, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error('[TEACHER GET]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/teachers/:id
 */
const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });
    res.json({ success: true, data: teacher });
  } catch (err) {
    console.error('[TEACHER GET BY ID]', err.message);
    if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid teacher ID.' });
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/teachers
 */
const createTeacher = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'First name and last name are required.' });
    }
    if (req.body.email) {
      const existing = await Teacher.findOne({ email: req.body.email.toLowerCase().trim() });
      if (existing) return res.status(409).json({ success: false, message: 'Teacher email already exists.' });
    }
    if (req.body.teacherId) {
      const existing = await Teacher.findOne({ teacherId: req.body.teacherId });
      if (existing) return res.status(409).json({ success: false, message: 'Teacher ID already exists.' });
    }
    const teacher = await Teacher.create(req.body);
    // Log activity
    try {
      await Activity.create({
        type: 'teacher_added',
        title: `Teacher added: ${teacher.firstName} ${teacher.lastName}`,
        description: `Subject: ${teacher.subject || 'N/A'} | ID: ${teacher.teacherId || 'N/A'}`,
        entityId: teacher._id,
        entityType: 'Teacher',
        performedBy: req.user?._id,
        icon: '👨‍🏫',
      });
    } catch (_) {}
    res.status(201).json({ success: true, data: teacher, message: 'Teacher created successfully.' });
  } catch (err) {
    console.error('[TEACHER CREATE]', err.message);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ success: false, message: `${field} already exists.` });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: `Validation failed: ${messages}` });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/teachers/:id
 */
const updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });
    if (req.body.email && req.body.email !== teacher.email) {
      const existing = await Teacher.findOne({ email: req.body.email.toLowerCase().trim(), _id: { $ne: req.params.id } });
      if (existing) return res.status(409).json({ success: false, message: 'Teacher email already exists.' });
    }
    const updated = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    // Log activity
    try {
      await Activity.create({
        type: 'teacher_updated',
        title: `Teacher updated: ${updated.firstName} ${updated.lastName}`,
        description: `Subject: ${updated.subject || 'N/A'}`,
        entityId: updated._id,
        entityType: 'Teacher',
        performedBy: req.user?._id,
        icon: '✏️',
      });
    } catch (_) {}
    res.json({ success: true, data: updated, message: 'Teacher updated successfully.' });
  } catch (err) {
    console.error('[TEACHER UPDATE]', err.message);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ success: false, message: `${field} already exists.` });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: `Validation failed: ${messages}` });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/teachers/:id
 */
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });
    // Log activity
    try {
      await Activity.create({
        type: 'teacher_deleted',
        title: `Teacher removed: ${teacher.firstName} ${teacher.lastName}`,
        description: `Subject: ${teacher.subject || 'N/A'}`,
        entityType: 'Teacher',
        performedBy: req.user?._id,
        icon: '🗑️',
      });
    } catch (_) {}
    res.json({ success: true, message: 'Teacher deleted successfully.' });
  } catch (err) {
    console.error('[TEACHER DELETE]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher };