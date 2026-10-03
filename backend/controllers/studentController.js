const Student  = require('../models/Student');
const Activity = require('../models/Activity');

/**
 * GET /api/students
 * Query: search, className, section, status, page, limit
 */
const getStudents = async (req, res) => {
  try {
    const { search, className, section, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (className) filter.className = className;
    if (section)   filter.section   = section;
    if (status)    filter.status    = status;
    if (search) {
      filter.$or = [
        { firstName:  { $regex: search, $options: 'i' } },
        { lastName:   { $regex: search, $options: 'i' } },
        { email:      { $regex: search, $options: 'i' } },
        { studentId:  { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
      ];
    }
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Student.countDocuments(filter);
    const students = await Student.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    res.json({ success: true, data: students, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error('[STUDENT GET]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/students/:id
 */
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, data: student });
  } catch (err) {
    console.error('[STUDENT GET BY ID]', err.message);
    if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid student ID.' });
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/students
 */
const createStudent = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'First name and last name are required.' });
    }
    // Check duplicate email
    if (req.body.email) {
      const existing = await Student.findOne({ email: req.body.email.toLowerCase().trim() });
      if (existing) return res.status(409).json({ success: false, message: 'Email already exists.' });
    }
    // Check duplicate studentId
    if (req.body.studentId) {
      const existing = await Student.findOne({ studentId: req.body.studentId });
      if (existing) return res.status(409).json({ success: false, message: 'Student ID already exists.' });
    }
    const student = await Student.create(req.body);
    // Log activity
    try {
      await Activity.create({
        type: 'student_added',
        title: `Student added: ${student.firstName} ${student.lastName}`,
        description: `Class ${student.className || 'N/A'} | ID: ${student.studentId || 'N/A'}`,
        entityId: student._id,
        entityType: 'Student',
        performedBy: req.user?._id,
        icon: '👨‍🎓',
      });
    } catch (_) {}
    res.status(201).json({ success: true, data: student, message: 'Student created successfully.' });
  } catch (err) {
    console.error('[STUDENT CREATE]', err.message);
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
 * PUT /api/students/:id
 */
const updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    // Check email conflict with other students
    if (req.body.email && req.body.email !== student.email) {
      const existing = await Student.findOne({ email: req.body.email.toLowerCase().trim(), _id: { $ne: req.params.id } });
      if (existing) return res.status(409).json({ success: false, message: 'Email already exists.' });
    }
    const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    // Log activity
    try {
      await Activity.create({
        type: 'student_updated',
        title: `Student updated: ${updated.firstName} ${updated.lastName}`,
        description: `Class ${updated.className || 'N/A'}`,
        entityId: updated._id,
        entityType: 'Student',
        performedBy: req.user?._id,
        icon: '✏️',
      });
    } catch (_) {}
    res.json({ success: true, data: updated, message: 'Student updated successfully.' });
  } catch (err) {
    console.error('[STUDENT UPDATE]', err.message);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ success: false, message: `${field} already exists.` });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: `Validation failed: ${messages}` });
    }
    if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid student ID.' });
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/students/:id
 */
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    // Log activity
    try {
      await Activity.create({
        type: 'student_deleted',
        title: `Student removed: ${student.firstName} ${student.lastName}`,
        description: `Class ${student.className || 'N/A'}`,
        entityType: 'Student',
        performedBy: req.user?._id,
        icon: '🗑️',
      });
    } catch (_) {}
    res.json({ success: true, message: 'Student deleted successfully.' });
  } catch (err) {
    console.error('[STUDENT DELETE]', err.message);
    if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid student ID.' });
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getStudents, getStudentById, createStudent, updateStudent, deleteStudent };