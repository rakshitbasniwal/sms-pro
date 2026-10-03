const Timetable = require('../models/Timetable');

const getTimetable = async (req, res) => {
  try {
    const { className, section, day } = req.query;
    const filter = {};
    if (className) filter.className = className;
    if (section)   filter.section   = section;
    if (day)       filter.day       = day;
    const entries = await Timetable.find(filter).sort({ day: 1, startTime: 1 });
    res.json({ data: entries, total: entries.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createTimetableEntry = async (req, res) => {
  try {
    const entry = await Timetable.create(req.body);
    res.status(201).json({ data: entry });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateTimetableEntry = async (req, res) => {
  try {
    const entry = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json({ data: entry });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteTimetableEntry = async (req, res) => {
  try {
    const entry = await Timetable.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getTimetable, createTimetableEntry, updateTimetableEntry, deleteTimetableEntry };
