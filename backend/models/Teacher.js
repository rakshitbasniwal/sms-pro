const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  firstName:        { type: String, required: true, trim: true },
  lastName:         { type: String, required: true, trim: true },
  teacherId:        { type: String, unique: true, sparse: true },
  email:            { type: String, trim: true, lowercase: true },
  phone:            { type: String },
  gender:           { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
  dateOfBirth:      { type: Date },
  address:          { type: String },
  subject:          { type: String },
  qualification:    { type: String },
  experience:       { type: Number, default: 0 },
  assignedClasses:  [{ type: String }],
  joiningDate:      { type: Date },
  salary:           { type: Number },
  status:           { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);