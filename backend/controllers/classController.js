const Class = require('../models/Class');

/**
 * GET /api/classes
 */
const getClasses = async (req, res) => {
  try {
    const { search, status, academicYear } = req.query;
    const filter = {};
    if (status)       filter.status       = status;
    if (academicYear) filter.academicYear = academicYear;
    if (search) {
      filter.$or = [
        { name:    { $regex: search, $options: 'i' } },
        { section: { $regex: search, $options: 'i' } },
      ];
    }
    const classes = await Class.find(filter)
      .populate('teacher', 'firstName lastName subject')
      .sort({ name: 1, section: 1 });
    res.json({ success: true, data: classes, total: classes.length });
  } catch (err) {
    console.error('[CLASS GET]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/classes/:id
 */
const getClassById = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id)
      .populate('teacher', 'firstName lastName subject email')
      .populate('students', 'firstName lastName studentId rollNumber');
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found.' });
    res.json({ success: true, data: cls });
  } catch (err) {
    console.error('[CLASS GET BY ID]', err.message);
    if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid class ID.' });
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/classes
 */
const createClass = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Class name is required.' });
    const cls = await Class.create(req.body);
    const populated = await Class.findById(cls._id).populate('teacher', 'firstName lastName subject');
    res.status(201).json({ success: true, data: populated, message: 'Class created successfully.' });
  } catch (err) {
    console.error('[CLASS CREATE]', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'A class with the same name, section, and academic year already exists.' });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/classes/:id
 */
const updateClass = async (req, res) => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('teacher', 'firstName lastName subject');
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found.' });
    res.json({ success: true, data: cls, message: 'Class updated successfully.' });
  } catch (err) {
    console.error('[CLASS UPDATE]', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'A class with the same name, section, and academic year already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/classes/:id
 */
const deleteClass = async (req, res) => {
  try {
    const cls = await Class.findByIdAndDelete(req.params.id);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found.' });
    res.json({ success: true, message: 'Class deleted successfully.' });
  } catch (err) {
    console.error('[CLASS DELETE]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getClasses, getClassById, createClass, updateClass, deleteClass };
