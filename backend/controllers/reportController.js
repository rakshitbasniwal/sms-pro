const Student    = require('../models/Student');
const Teacher    = require('../models/Teacher');
const Fee        = require('../models/Fee');
const Attendance = require('../models/Attendance');
const Result     = require('../models/Result');
const Class      = require('../models/Class');
const Salary     = require('../models/Salary');

// GET /api/reports/students
const getStudentReport = async (req, res) => {
  try {
    const { className, section, status } = req.query;
    const filter = {};
    if (className) filter.className = className;
    if (section)   filter.section   = section;
    if (status)    filter.status    = status;
    const students = await Student.find(filter).sort({ className: 1, firstName: 1 });
    res.json({ success: true, data: students, total: students.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/teachers
const getTeacherReport = async (req, res) => {
  try {
    const { subject, status } = req.query;
    const filter = {};
    if (subject) filter.subject = subject;
    if (status)  filter.status  = status;
    const teachers = await Teacher.find(filter).sort({ firstName: 1 });
    res.json({ success: true, data: teachers, total: teachers.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/fees
const getFeeReport = async (req, res) => {
  try {
    const { className, status, fromDate, toDate } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate)   filter.createdAt.$lte = new Date(toDate);
    }
    const fees = await Fee.find(filter)
      .populate('studentId', 'firstName lastName studentId className section')
      .sort({ createdAt: -1 });
    
    // Filter by className if provided (from populated student)
    const filtered = className
      ? fees.filter(f => f.studentId?.className === className)
      : fees;

    const totalAmount = filtered.reduce((s, f) => s + f.amount, 0);
    const paidAmount  = filtered.reduce((s, f) => s + f.paidAmount, 0);
    const pending     = totalAmount - paidAmount;

    res.json({
      success: true,
      data: filtered,
      total: filtered.length,
      summary: { totalAmount, paidAmount, pendingAmount: pending },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/attendance
const getAttendanceReport = async (req, res) => {
  try {
    const { className, section, fromDate, toDate, status } = req.query;
    const filter = {};
    if (className) filter.className = className;
    if (section)   filter.section   = section;
    if (status)    filter.status    = status;
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate)   filter.date.$lte = new Date(toDate);
    }
    const records = await Attendance.find(filter)
      .populate('studentId', 'firstName lastName studentId rollNumber className section')
      .sort({ date: -1 });

    const total   = records.length;
    const present = records.filter(r => r.status === 'Present').length;
    const absent  = records.filter(r => r.status === 'Absent').length;

    res.json({
      success: true,
      data: records,
      total,
      summary: { present, absent, percentage: total ? Math.round((present / total) * 100) : 0 },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/results
const getResultReport = async (req, res) => {
  try {
    const { className, examId } = req.query;
    const filter = {};
    if (className) filter.className = className;
    if (examId)    filter.examId    = examId;
    const results = await Result.find(filter)
      .populate('studentId', 'firstName lastName studentId className section')
      .populate('examId', 'title type')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: results, total: results.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/classes
const getClassReport = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const classes = await Class.find(filter)
      .populate('teacher', 'firstName lastName teacherId')
      .sort({ name: 1, section: 1 });
    res.json({ success: true, data: classes, total: classes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/reports/salary
const getSalaryReport = async (req, res) => {
  try {
    const { month, year, status } = req.query;
    const filter = {};
    if (month)  filter.month  = Number(month);
    if (year)   filter.year   = Number(year);
    if (status) filter.status = status;
    const salaries = await Salary.find(filter)
      .populate('teacherId', 'firstName lastName teacherId email subject')
      .sort({ year: -1, month: -1 });
    const totalPayroll = salaries.reduce((s, r) => s + r.monthlySalary, 0);
    const totalPaid    = salaries.reduce((s, r) => s + r.paidAmount, 0);
    const totalPending = salaries.reduce((s, r) => s + r.pendingAmount, 0);
    res.json({
      success: true,
      data: salaries,
      total: salaries.length,
      summary: { totalPayroll, totalPaid, totalPending },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getStudentReport, getTeacherReport, getFeeReport, getAttendanceReport, getResultReport, getClassReport, getSalaryReport };
