const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    type:        { type: String, required: true }, // 'student_added', 'teacher_added', 'fee_paid', etc.
    title:       { type: String, required: true },
    description: { type: String },
    entityId:    { type: mongoose.Schema.Types.ObjectId },
    entityType:  { type: String }, // 'Student', 'Teacher', 'Fee', 'Salary', 'Class', 'Exam', 'Attendance', 'Result'
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    icon:        { type: String, default: '📌' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Activity', activitySchema);
