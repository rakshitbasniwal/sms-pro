const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema(
  {
    teacherId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    month:           { type: Number, required: true, min: 1, max: 12 },   // 1-12
    year:            { type: Number, required: true },
    monthlySalary:   { type: Number, required: true, min: 0 },
    paidAmount:      { type: Number, default: 0, min: 0 },
    pendingAmount:   { type: Number, default: 0, min: 0 },
    status:          { type: String, enum: ['Paid', 'Pending', 'Partial'], default: 'Pending' },
    paymentDate:     { type: Date },
    paymentMethod:   { type: String, enum: ['Bank Transfer', 'Cash', 'UPI', 'Cheque', 'Other'], default: 'Bank Transfer' },
    transactionId:   { type: String, trim: true },
    remarks:         { type: String, trim: true },
  },
  { timestamps: true }
);

// Unique: one salary record per teacher per month per year
salarySchema.index({ teacherId: 1, month: 1, year: 1 }, { unique: true });

// Auto-calculate pendingAmount before saving
salarySchema.pre('save', function (next) {
  this.pendingAmount = Math.max(0, this.monthlySalary - this.paidAmount);
  if (this.paidAmount >= this.monthlySalary) {
    this.status = 'Paid';
  } else if (this.paidAmount > 0) {
    this.status = 'Partial';
  } else {
    this.status = 'Pending';
  }
  next();
});

module.exports = mongoose.model('Salary', salarySchema);
