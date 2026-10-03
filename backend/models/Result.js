const mongoose = require('mongoose');

const subjectResultSchema = new mongoose.Schema({
  subject:      { type: String, required: true },
  maxMarks:     { type: Number, default: 100 },
  obtainedMarks: { type: Number, required: true },
});

const resultSchema = new mongoose.Schema({
  studentId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  examName:       { type: String, required: true }, // Mid-Term, Final, etc.
  className:      { type: String },
  section:        { type: String },
  examDate:       { type: Date },
  subjects:       [subjectResultSchema],
  totalMaxMarks:  { type: Number },
  totalObtained:  { type: Number },
  percentage:     { type: Number },
  grade:          { type: String },
  remarks:        { type: String },
}, { timestamps: true });

// Auto-compute percentage and grade before saving
resultSchema.pre('save', function(next) {
  if (this.subjects && this.subjects.length > 0) {
    this.totalMaxMarks  = this.subjects.reduce((s, sub) => s + sub.maxMarks, 0);
    this.totalObtained  = this.subjects.reduce((s, sub) => s + sub.obtainedMarks, 0);
    this.percentage     = Math.round((this.totalObtained / this.totalMaxMarks) * 100 * 100) / 100;
    if (this.percentage >= 90)      this.grade = 'A+';
    else if (this.percentage >= 80) this.grade = 'A';
    else if (this.percentage >= 70) this.grade = 'B+';
    else if (this.percentage >= 60) this.grade = 'B';
    else if (this.percentage >= 50) this.grade = 'C';
    else if (this.percentage >= 40) this.grade = 'D';
    else                            this.grade = 'F';
  }
  next();
});

module.exports = mongoose.model('Result', resultSchema);