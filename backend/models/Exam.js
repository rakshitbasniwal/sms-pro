const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    title:        { type: String, required: [true, 'Exam title is required'], trim: true },
    examType:     { type: String, enum: ['Unit Test', 'Mid Term', 'Final', 'Assignment', 'Quiz', 'Other'], default: 'Other' },
    className:    { type: String, trim: true },
    section:      { type: String, trim: true },
    subject:      { type: String, trim: true },
    examDate:     { type: Date },
    startTime:    { type: String },
    endTime:      { type: String },
    totalMarks:   { type: Number, default: 100 },
    passingMarks: { type: Number, default: 33 },
    academicYear: { type: String },
    description:  { type: String },
    published:    { type: Boolean, default: false },
    createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exam', examSchema);