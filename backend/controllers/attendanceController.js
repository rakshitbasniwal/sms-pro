const Attendance = require('../models/Attendance');
const Student    = require('../models/Student');
const Activity   = require('../models/Activity');

// ─── helpers ────────────────────────────────────────────────────────────────

/** Normalise a date to midnight UTC so comparisons work reliably */
const dayStart = (d) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};
const dayEnd = (d) => {
  const dt = new Date(d);
  dt.setHours(23, 59, 59, 999);
  return dt;
};

// ─── GET /api/attendance ─────────────────────────────────────────────────────
// Supports: className, section, date, month (1-12), year, studentId
const getAttendance = async (req, res) => {
  try {
    const { className, section, date, month, year, studentId } = req.query;
    const filter = {};

    if (className)  filter.className = className;
    if (section)    filter.section   = section;
    if (studentId)  filter.studentId = studentId;

    if (date) {
      filter.date = { $gte: dayStart(date), $lte: dayEnd(date) };
    } else if (month && year) {
      const m  = parseInt(month) - 1; // 0-indexed
      const y  = parseInt(year);
      const start = new Date(y, m, 1, 0, 0, 0, 0);
      const end   = new Date(y, m + 1, 0, 23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (year) {
      const y = parseInt(year);
      filter.date = { $gte: new Date(y, 0, 1), $lte: new Date(y, 11, 31, 23, 59, 59, 999) };
    }

    const records = await Attendance.find(filter)
      .populate('studentId', 'firstName lastName studentId rollNumber className section')
      .populate('markedBy', 'name role')
      .sort({ date: -1 });

    res.json({ success: true, data: records, total: records.length });
  } catch (err) {
    console.error('[ATTENDANCE GET]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/attendance (bulk upsert) ──────────────────────────────────────
// Body: { className, section, date, records: [{ studentId, status, remarks }] }
const markAttendance = async (req, res) => {
  try {
    const { className, section, date, records } = req.body;

    if (!className) return res.status(400).json({ success: false, message: 'className is required.' });
    if (!date)      return res.status(400).json({ success: false, message: 'date is required.' });
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'records array is required.' });
    }

    const normDate = dayStart(date);
    const results  = [];

    for (const rec of records) {
      if (!rec.studentId) continue;

      const allowedStatuses = ['Present', 'Absent', 'Late', 'Leave'];
      const status = allowedStatuses.includes(rec.status) ? rec.status : 'Present';

      const filter = { studentId: rec.studentId, date: normDate, className };
      const update = {
        section:  section || '',
        status,
        remarks:  rec.remarks || '',
        markedBy: req.user?._id,
      };

      const doc = await Attendance.findOneAndUpdate(
        filter,
        { $set: update },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push(doc);
    }

    // Log activity
    try {
      await Activity.create({
        type:        'attendance_marked',
        title:       `Attendance marked for ${className}${section ? ' - ' + section : ''}`,
        description: `Date: ${new Date(date).toLocaleDateString('en-IN')} | ${results.length} student(s)`,
        entityType:  'Attendance',
        performedBy: req.user?._id,
        icon:        '📝',
      });
    } catch (_) {}

    res.json({ success: true, data: results, message: `Attendance saved for ${results.length} student(s).` });
  } catch (err) {
    console.error('[ATTENDANCE MARK]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/attendance/student/:studentId ───────────────────────────────────
// Student's full attendance history with optional month/year filter
const getStudentAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { studentId: req.params.studentId };

    if (month && year) {
      const m = parseInt(month) - 1;
      const y = parseInt(year);
      filter.date = { $gte: new Date(y, m, 1), $lte: new Date(y, m + 1, 0, 23, 59, 59, 999) };
    }

    const records = await Attendance.find(filter)
      .populate('markedBy', 'name role')
      .sort({ date: 1 });

    const total   = records.length;
    const present = records.filter(r => r.status === 'Present').length;
    const absent  = records.filter(r => r.status === 'Absent').length;
    const late    = records.filter(r => r.status === 'Late').length;
    const leave   = records.filter(r => r.status === 'Leave').length;
    const workingDays = present + absent + late; // Leave doesn't count as working
    const percentage  = workingDays > 0 ? Math.round(((present + late) / workingDays) * 100 * 100) / 100 : 0;

    res.json({
      success: true,
      data: records,
      summary: { total, present, absent, late, leave, workingDays, percentage },
    });
  } catch (err) {
    console.error('[ATTENDANCE STUDENT]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/attendance/monthly/:studentId ───────────────────────────────────
// Monthly calendar data — defaults to current month
const getMonthlyAttendance = async (req, res) => {
  try {
    const now   = new Date();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);
    const year  = parseInt(req.query.year)  || now.getFullYear();
    const m     = month - 1;

    const filter = {
      studentId: req.params.studentId,
      date: { $gte: new Date(year, m, 1), $lte: new Date(year, m + 1, 0, 23, 59, 59, 999) },
    };

    const records = await Attendance.find(filter)
      .populate('markedBy', 'name role')
      .sort({ date: 1 });

    // Build a day → record map  { "1": {...}, "5": {...} }
    const calendar = {};
    records.forEach(r => {
      const day = new Date(r.date).getDate();
      calendar[day] = {
        _id:      r._id,
        status:   r.status,
        remarks:  r.remarks,
        markedBy: r.markedBy,
        date:     r.date,
      };
    });

    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const present     = records.filter(r => r.status === 'Present').length;
    const absent      = records.filter(r => r.status === 'Absent').length;
    const late        = records.filter(r => r.status === 'Late').length;
    const leave       = records.filter(r => r.status === 'Leave').length;
    const workingDays = present + absent + late;
    const percentage  = workingDays > 0 ? Math.round(((present + late) / workingDays) * 10000) / 100 : 0;

    res.json({
      success: true,
      data: { calendar, daysInMonth, month, year },
      summary: { present, absent, late, leave, workingDays, percentage },
    });
  } catch (err) {
    console.error('[ATTENDANCE MONTHLY]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/attendance/class/:className/:section ─────────────────────────
// Class-level attendance summary
const getClassAttendance = async (req, res) => {
  try {
    const { className, section } = req.params;
    const { month, year, date }  = req.query;
    const filter = { className };
    if (section && section !== 'all') filter.section = section;

    if (date) {
      filter.date = { $gte: dayStart(date), $lte: dayEnd(date) };
    } else if (month && year) {
      const m = parseInt(month) - 1;
      const y = parseInt(year);
      filter.date = { $gte: new Date(y, m, 1), $lte: new Date(y, m + 1, 0, 23, 59, 59, 999) };
    } else {
      // Default: today
      const today = new Date();
      filter.date = { $gte: dayStart(today), $lte: dayEnd(today) };
    }

    const records = await Attendance.find(filter)
      .populate('studentId', 'firstName lastName studentId rollNumber')
      .populate('markedBy', 'name')
      .sort({ date: 1 });

    // Group by student
    const studentMap = {};
    records.forEach(r => {
      const sid = String(r.studentId?._id || r.studentId);
      if (!studentMap[sid]) {
        studentMap[sid] = {
          student:  r.studentId,
          present:  0, absent: 0, late: 0, leave: 0,
          records:  [],
        };
      }
      studentMap[sid][r.status.toLowerCase()]++;
      studentMap[sid].records.push(r);
    });

    res.json({ success: true, data: Object.values(studentMap), records, total: records.length });
  } catch (err) {
    console.error('[CLASS ATTENDANCE]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/attendance/:id ──────────────────────────────────────────────────
const updateAttendance = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const allowedStatuses = ['Present', 'Absent', 'Late', 'Leave'];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Use Present, Absent, Late, or Leave.' });
    }

    const updated = await Attendance.findByIdAndUpdate(
      req.params.id,
      { $set: { status, remarks, markedBy: req.user?._id } },
      { new: true, runValidators: true }
    ).populate('studentId', 'firstName lastName studentId rollNumber')
     .populate('markedBy', 'name role');

    if (!updated) return res.status(404).json({ success: false, message: 'Attendance record not found.' });

    res.json({ success: true, data: updated, message: 'Attendance updated successfully.' });
  } catch (err) {
    console.error('[ATTENDANCE UPDATE]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/attendance/:id ───────────────────────────────────────────────
const deleteAttendance = async (req, res) => {
  try {
    const doc = await Attendance.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    res.json({ success: true, message: 'Attendance record deleted.' });
  } catch (err) {
    console.error('[ATTENDANCE DELETE]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/attendance/stats ─────────────────────────────────────────────
const getAttendanceStats = async (req, res) => {
  try {
    const now   = new Date();
    const start = dayStart(now);
    const end   = dayEnd(now);

    const [todayPresent, todayAbsent, total] = await Promise.all([
      Attendance.countDocuments({ date: { $gte: start, $lte: end }, status: 'Present' }),
      Attendance.countDocuments({ date: { $gte: start, $lte: end }, status: 'Absent' }),
      Attendance.countDocuments({}),
    ]);

    const present = await Attendance.countDocuments({ status: 'Present' });

    res.json({
      success: true,
      data: {
        total, present, todayPresent, todayAbsent,
        percentage: total ? Math.round((present / total) * 100) : 0,
      },
    });
  } catch (err) {
    console.error('[ATTENDANCE STATS]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAttendance,
  markAttendance,
  getStudentAttendance,
  getMonthlyAttendance,
  getClassAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
};
