const Student    = require('../models/Student');
const Teacher    = require('../models/Teacher');
const Class      = require('../models/Class');
const Fee        = require('../models/Fee');
const Attendance = require('../models/Attendance');
const Salary     = require('../models/Salary');
const Activity   = require('../models/Activity');

/**
 * GET /api/dashboard/stats
 * Returns all dashboard statistics from real MongoDB data
 */
const getDashboardStats = async (req, res) => {
  try {
    console.log('[DASHBOARD] Fetching stats for user:', req.user?.role);

    // Parallel queries for performance
    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      feeAgg,
      attendanceToday,
      totalSalaries,
    ] = await Promise.all([
      Student.countDocuments({}),
      Teacher.countDocuments({}),
      Class.countDocuments({}),

      // Fee aggregation
      Fee.aggregate([
        {
          $group: {
            _id: null,
            totalFees:      { $sum: '$amount' },
            totalPaid:      { $sum: '$paidAmount' },
            totalPending:   {
              $sum: {
                $cond: [
                  { $in: ['$status', ['Pending', 'Overdue', 'Partial']] },
                  { $subtract: ['$amount', '$paidAmount'] },
                  0,
                ],
              },
            },
          },
        },
      ]),

      // Today's attendance
      (async () => {
        const today = new Date();
        const start = new Date(today.setHours(0, 0, 0, 0));
        const end   = new Date(today.setHours(23, 59, 59, 999));
        const [present, absent] = await Promise.all([
          Attendance.countDocuments({ date: { $gte: start, $lte: end }, status: 'Present' }),
          Attendance.countDocuments({ date: { $gte: start, $lte: end }, status: 'Absent' }),
        ]);
        return { present, absent };
      })(),

      // Current month salary stats
      (async () => {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear  = now.getFullYear();
        const result = await Salary.aggregate([
          { $match: { month: currentMonth, year: currentYear } },
          {
            $group: {
              _id: null,
              totalPayroll:  { $sum: '$monthlySalary' },
              paidThisMonth: { $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, '$paidAmount', 0] } },
              pendingAmount: { $sum: '$pendingAmount' },
            },
          },
        ]);
        return result[0] || { totalPayroll: 0, paidThisMonth: 0, pendingAmount: 0 };
      })(),
    ]);

    const feeStats = feeAgg[0] || { totalFees: 0, totalPaid: 0, totalPending: 0 };

    const stats = {
      totalStudents,
      totalTeachers,
      totalClasses,
      feesCollected:      feeStats.totalPaid,
      pendingFees:        feeStats.totalPending,
      todayPresent:       attendanceToday.present,
      todayAbsent:        attendanceToday.absent,
      monthlyPayroll:     totalSalaries.totalPayroll,
      salaryPaidThisMonth: totalSalaries.paidThisMonth,
      salaryPendingThisMonth: totalSalaries.pendingAmount,
    };

    console.log('[DASHBOARD] Stats computed:', stats);
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('[DASHBOARD ERROR]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/dashboard/activities
 * Returns latest activities
 */
const getRecentActivities = async (req, res) => {
  try {
    const activities = await Activity.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('performedBy', 'name role');
    res.json({ success: true, data: activities });
  } catch (err) {
    console.error('[DASHBOARD ACTIVITIES ERROR]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardStats, getRecentActivities };
