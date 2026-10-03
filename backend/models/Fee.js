const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  studentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  feeType:      { type: String, required: true }, // Tuition, Transport, Library, etc.
  amount:       { type: Number, required: true },
  dueDate:      { type: Date },
  paidDate:     { type: Date },
  status:       { type: String, enum: ['Paid', 'Pending', 'Overdue', 'Partial'], default: 'Pending' },
  paidAmount:   { type: Number, default: 0 },
  description:  { type: String },
  receiptNo:    { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Fee', feeSchema);