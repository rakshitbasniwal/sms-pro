const Result = require('../models/Result');

const getResults = async (req, res) => {
  try {
    const { studentId, examName, className } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (examName)  filter.examName  = examName;
    if (className) filter.className = className;
    const results = await Result.find(filter).populate('studentId', 'firstName lastName studentId className section');
    res.json({ data: results, total: results.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id).populate('studentId', 'firstName lastName studentId');
    if (!result) return res.status(404).json({ message: 'Result not found' });
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createResult = async (req, res) => {
  try {
    const result = await Result.create(req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateResult = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found' });
    Object.assign(result, req.body);
    await result.save(); // trigger pre-save hook for grade calc
    res.json({ data: result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteResult = async (req, res) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getResults, getResultById, createResult, updateResult, deleteResult };
