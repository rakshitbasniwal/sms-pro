const Exam = require('../models/Exam');

/**
 * GET /api/exams
 */
const getExams = async (req, res) => {
  try {
    const { search, className, subject, published } = req.query;
    const filter = {};
    if (className) filter.className = className;
    if (subject)   filter.subject   = subject;
    if (published !== undefined) filter.published = published === 'true';
    if (search) {
      filter.$or = [
        { title:     { $regex: search, $options: 'i' } },
        { className: { $regex: search, $options: 'i' } },
        { subject:   { $regex: search, $options: 'i' } },
      ];
    }
    const exams = await Exam.find(filter).sort({ examDate: -1, createdAt: -1 });
    res.json({ success: true, data: exams, total: exams.length });
  } catch (err) {
    console.error('[EXAM GET]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/exams/:id
 */
const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
    res.json({ success: true, data: exam });
  } catch (err) {
    console.error('[EXAM GET BY ID]', err.message);
    if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid exam ID.' });
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/exams
 */
const createExam = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Exam title is required.' });
    if (req.user) req.body.createdBy = req.user._id;
    const exam = await Exam.create(req.body);
    res.status(201).json({ success: true, data: exam, message: 'Exam created successfully.' });
  } catch (err) {
    console.error('[EXAM CREATE]', err.message);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ success: false, message: messages });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /api/exams/:id
 */
const updateExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
    res.json({ success: true, data: exam, message: 'Exam updated successfully.' });
  } catch (err) {
    console.error('[EXAM UPDATE]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /api/exams/:id
 */
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
    res.json({ success: true, message: 'Exam deleted successfully.' });
  } catch (err) {
    console.error('[EXAM DELETE]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/exams/:id/publish — toggle publish
 */
const togglePublish = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found.' });
    exam.published = !exam.published;
    await exam.save();
    res.json({ success: true, data: exam, message: `Exam ${exam.published ? 'published' : 'unpublished'} successfully.` });
  } catch (err) {
    console.error('[EXAM PUBLISH]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getExams, getExamById, createExam, updateExam, deleteExam, togglePublish };
