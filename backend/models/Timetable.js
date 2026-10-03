const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  className:  { type: String, required: true },
  section:    { type: String },
  day:        { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], required: true },
  startTime:  { type: String, required: true }, // e.g. "08:00"
  endTime:    { type: String, required: true }, // e.g. "09:00"
  subject:    { type: String, required: true },
  teacherId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  teacherName: { type: String },
  room:       { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);