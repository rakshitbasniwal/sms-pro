const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name:         { type: String, required: [true, 'Class name is required'], trim: true },
    section:      { type: String, trim: true, default: 'A' },
    academicYear: { type: String, trim: true },
    capacity:     { type: Number, default: 40 },
    teacher:      { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
    subjects:     [{ type: String, trim: true }],
    students:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    status:       { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    description:  { type: String },
  },
  { timestamps: true }
);

// Unique constraint: same class name + section + academic year
classSchema.index({ name: 1, section: 1, academicYear: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Class', classSchema);