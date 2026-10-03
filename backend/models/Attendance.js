const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    className:   { type: String, required: true, trim: true },
    section:     { type: String, trim: true },
    date:        { type: Date, required: true },
    status:      {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Leave'],
      default: 'Present',
      required: true,
    },
    remarks:     { type: String, trim: true, default: '' },
    markedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Unique: one attendance record per student per date per class
attendanceSchema.index({ studentId: 1, date: 1, className: 1 }, { unique: true });

// Indexes for fast queries
attendanceSchema.index({ className: 1, section: 1, date: 1 });
attendanceSchema.index({ studentId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);