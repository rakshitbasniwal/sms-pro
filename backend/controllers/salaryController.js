const Salary   = require('../models/Salary');
const Teacher  = require('../models/Teacher');
const Activity = require('../models/Activity');

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// GET /api/salaries
const getSalaries = async (req, res) => {
  try {
    const { teacherId, month, year, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (teacherId) filter.teacherId = teacherId;
    if (month)     filter.month     = Number(month);
    if (year)      filter.year      = Number(year);
    if (status)    filter.status    = status;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Salary.countDocuments(filter);
    const salaries = await Salary.find(filter)
      .populate('teacherId', 'firstName lastName teacherId email subject salary')
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, data: salaries, total });
  } catch (err) {
    console.error('[SALARY GET]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/salaries/:id
const getSalaryById = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id)
      .populate('teacherId', 'firstName lastName teacherId email subject salary');
    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found.' });
    res.json({ success: true, data: salary });
  } catch (err) {
    console.error('[SALARY GET BY ID]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/salaries
const createSalary = async (req, res) => {
  try {
    const { teacherId, month, year, monthlySalary, paidAmount, paymentDate, paymentMethod, transactionId, remarks } = req.body;

    if (!teacherId || !month || !year || !monthlySalary) {
      return res.status(400).json({ success: false, message: 'teacherId, month, year, and monthlySalary are required.' });
    }

    // Check teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found.' });

    // Check duplicate
    const existing = await Salary.findOne({ teacherId, month: Number(month), year: Number(year) });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Salary record for ${teacher.firstName} ${teacher.lastName} for ${MONTH_NAMES[Number(month)-1]} ${year} already exists.`,
      });
    }

    const paid = Number(paidAmount) || 0;
    const salary = await Salary.create({
      teacherId,
      month: Number(month),
      year: Number(year),
      monthlySalary: Number(monthlySalary),
      paidAmount: paid,
      paymentDate: paid > 0 ? (paymentDate || new Date()) : undefined,
      paymentMethod,
      transactionId,
      remarks,
    });

    // Log activity
    try {
      await Activity.create({
        type: 'salary_created',
        title: `Salary record created for ${teacher.firstName} ${teacher.lastName}`,
        description: `${MONTH_NAMES[Number(month)-1]} ${year} — ₹${Number(monthlySalary).toLocaleString('en-IN')} — ${salary.status}`,
        entityId: salary._id,
        entityType: 'Salary',
        performedBy: req.user?._id,
        icon: '💰',
      });
    } catch (_) {}

    const populated = await salary.populate('teacherId', 'firstName lastName teacherId email subject');
    res.status(201).json({ success: true, data: populated, message: 'Salary record created successfully.' });
  } catch (err) {
    console.error('[SALARY CREATE]', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Duplicate salary record for this teacher/month/year.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/salaries/:id
const updateSalary = async (req, res) => {
  try {
    const existing = await Salary.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Salary record not found.' });

    const updated = await Salary.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    ).populate('teacherId', 'firstName lastName teacherId email subject');

    // Log activity
    try {
      await Activity.create({
        type: 'salary_updated',
        title: `Salary record updated`,
        description: `${MONTH_NAMES[updated.month-1]} ${updated.year} — Status: ${updated.status}`,
        entityId: updated._id,
        entityType: 'Salary',
        performedBy: req.user?._id,
        icon: '✏️',
      });
    } catch (_) {}

    res.json({ success: true, data: updated, message: 'Salary updated successfully.' });
  } catch (err) {
    console.error('[SALARY UPDATE]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/salaries/:id
const deleteSalary = async (req, res) => {
  try {
    const salary = await Salary.findByIdAndDelete(req.params.id);
    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found.' });
    res.json({ success: true, message: 'Salary record deleted successfully.' });
  } catch (err) {
    console.error('[SALARY DELETE]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/salaries/:id/pay — Mark salary as paid
const markSalaryAsPaid = async (req, res) => {
  try {
    const salary = await Salary.findById(req.params.id);
    if (!salary) return res.status(404).json({ success: false, message: 'Salary record not found.' });

    salary.paidAmount    = salary.monthlySalary;
    salary.paymentDate   = req.body.paymentDate   || new Date();
    salary.paymentMethod = req.body.paymentMethod || 'Bank Transfer';
    salary.transactionId = req.body.transactionId || salary.transactionId;
    salary.remarks       = req.body.remarks       || salary.remarks;
    await salary.save();

    const populated = await salary.populate('teacherId', 'firstName lastName teacherId email subject');

    // Log activity
    try {
      await Activity.create({
        type: 'salary_paid',
        title: `Salary marked as Paid`,
        description: `${populated.teacherId?.firstName} ${populated.teacherId?.lastName} — ${MONTH_NAMES[salary.month-1]} ${salary.year} — ₹${salary.monthlySalary.toLocaleString('en-IN')}`,
        entityId: salary._id,
        entityType: 'Salary',
        performedBy: req.user?._id,
        icon: '✅',
      });
    } catch (_) {}

    res.json({ success: true, data: populated, message: 'Salary marked as Paid.' });
  } catch (err) {
    console.error('[SALARY PAY]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/salaries/stats — payroll statistics
const getSalaryStats = async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear  = now.getFullYear();

    const [totalTeachers, monthStats, allTimeStats] = await Promise.all([
      Teacher.countDocuments({}),
      Salary.aggregate([
        { $match: { month: currentMonth, year: currentYear } },
        {
          $group: {
            _id: null,
            totalPayroll:  { $sum: '$monthlySalary' },
            paidThisMonth: { $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, '$paidAmount', 0] } },
            pendingAmount: { $sum: '$pendingAmount' },
            countPaid:     { $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, 1, 0] } },
            countPending:  { $sum: { $cond: [{ $ne: ['$status', 'Paid'] }, 1, 0] } },
          },
        },
      ]),
      Salary.aggregate([
        {
          $group: {
            _id: null,
            totalPaidAllTime:    { $sum: '$paidAmount' },
            totalPendingAllTime: { $sum: '$pendingAmount' },
          },
        },
      ]),
    ]);

    const month = monthStats[0] || { totalPayroll: 0, paidThisMonth: 0, pendingAmount: 0, countPaid: 0, countPending: 0 };
    const all   = allTimeStats[0] || { totalPaidAllTime: 0, totalPendingAllTime: 0 };

    res.json({
      success: true,
      data: {
        totalTeachers,
        currentMonth,
        currentYear,
        monthlyPayroll:         month.totalPayroll,
        paidThisMonth:          month.paidThisMonth,
        pendingThisMonth:       month.pendingAmount,
        teachersPaidThisMonth:  month.countPaid,
        teachersPendingThisMonth: month.countPending,
        totalPaidAllTime:       all.totalPaidAllTime,
        totalPendingAllTime:    all.totalPendingAllTime,
      },
    });
  } catch (err) {
    console.error('[SALARY STATS]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/salaries/teacher/:teacherId — salary history for a teacher
const getTeacherSalaryHistory = async (req, res) => {
  try {
    const salaries = await Salary.find({ teacherId: req.params.teacherId })
      .sort({ year: -1, month: -1 });

    const totalPaid    = salaries.reduce((s, r) => s + (r.paidAmount || 0), 0);
    const totalPending = salaries.reduce((s, r) => s + (r.pendingAmount || 0), 0);

    res.json({ success: true, data: salaries, totalPaid, totalPending });
  } catch (err) {
    console.error('[TEACHER SALARY HISTORY]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getSalaries,
  getSalaryById,
  createSalary,
  updateSalary,
  deleteSalary,
  markSalaryAsPaid,
  getSalaryStats,
  getTeacherSalaryHistory,
};
