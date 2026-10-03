const express = require('express');
const router  = express.Router();
const {
  getAttendance,
  markAttendance,
  getStudentAttendance,
  getMonthlyAttendance,
  getClassAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Stats — must be before /:id
router.get('/stats',                    protect, getAttendanceStats);

// Student-specific routes — must be before /:id
router.get('/student/:studentId',       protect, getStudentAttendance);
router.get('/monthly/:studentId',       protect, getMonthlyAttendance);

// Class-level attendance
router.get('/class/:className/:section', protect, authorize('admin', 'teacher'), getClassAttendance);

// General
router.route('/')
  .get(protect, getAttendance)
  .post(protect, authorize('admin', 'teacher'), markAttendance);

// Individual record
router.route('/:id')
  .put(protect, authorize('admin', 'teacher'), updateAttendance)
  .delete(protect, authorize('admin', 'teacher'), deleteAttendance);

module.exports = router;
