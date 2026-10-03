const express = require('express');
const router  = express.Router();
const {
  getStudentReport,
  getTeacherReport,
  getFeeReport,
  getAttendanceReport,
  getResultReport,
  getClassReport,
  getSalaryReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/students',   protect, authorize('admin', 'teacher'), getStudentReport);
router.get('/teachers',   protect, authorize('admin'), getTeacherReport);
router.get('/fees',       protect, authorize('admin'), getFeeReport);
router.get('/attendance', protect, authorize('admin', 'teacher'), getAttendanceReport);
router.get('/results',    protect, authorize('admin', 'teacher'), getResultReport);
router.get('/classes',    protect, authorize('admin', 'teacher'), getClassReport);
router.get('/salary',     protect, authorize('admin'), getSalaryReport);

module.exports = router;
