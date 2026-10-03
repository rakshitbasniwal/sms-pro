const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName:    { type: String, required: true, trim: true },
  lastName:     { type: String, required: true, trim: true },
  studentId:    { type: String, unique: true, sparse: true },
  rollNumber:   { type: String },
  email:        { type: String, trim: true, lowercase: true },
  phone:        { type: String },
  gender:       { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
  dateOfBirth:  { type: Date },
  address:      { type: String },
  className:    { type: String },
  section:      { type: String },
  parentName:   { type: String },
  parentPhone:  { type: String },
  parentEmail:  { type: String },
  bloodGroup:   { type: String },
  photo:        { type: String },
  status:       { type: String, enum: ['Active', 'Inactive', 'Transferred'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);